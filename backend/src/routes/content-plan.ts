import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/content-plan
router.get("/:id/content-plan", async (req, res) => {
  const clientId = req.params.id;
  const statusFilter = (req.query.status as string) || "pending";
  const clusterFilter = req.query.cluster as string | undefined;

  try {
    let query = `
      SELECT id, cluster_name, keyword, suggested_slug, reason, priority, status, created_at
      FROM content_suggestions
      WHERE client_id = $1 AND status = $2
    `;
    const params: any[] = [clientId, statusFilter];

    if (clusterFilter) {
      params.push(clusterFilter);
      query += ` AND cluster_name = $${params.length}`;
    }

    query += ` ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      cluster_name,
      created_at DESC`;

    const { rows } = await pool.query(query, params);

    // Group by cluster for frontend convenience
    const clusters = new Map<string, any[]>();
    for (const row of rows) {
      const existing = clusters.get(row.cluster_name) || [];
      existing.push(row);
      clusters.set(row.cluster_name, existing);
    }

    const grouped = Array.from(clusters.entries()).map(([name, items]) => ({
      cluster_name: name,
      suggestions: items,
      high_priority_count: items.filter((i: any) => i.priority === "high").length,
    }));

    res.json({
      total: rows.length,
      clusters: grouped,
      flat: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch content plan" });
  }
});

// PATCH /api/clients/:id/content-plan/:suggestionId — update status
router.patch("/:id/content-plan/:suggestionId", async (req, res) => {
  const { status } = req.body;
  if (!["pending", "planned", "published", "dismissed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE content_suggestions SET status = $1 WHERE id = $2 AND client_id = $3 RETURNING *`,
      [status, req.params.suggestionId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update content suggestion" });
  }
});

export default router;
