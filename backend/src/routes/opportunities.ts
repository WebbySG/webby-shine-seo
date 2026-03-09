import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/opportunities
router.get("/:id/opportunities", async (req, res) => {
  const clientId = req.params.id;
  const typeFilter = req.query.type as string | undefined;
  const statusFilter = (req.query.status as string) || "open";

  try {
    let query = `
      SELECT o.id, o.type, o.priority, o.target_url, o.current_position,
             o.recommended_action, o.status, o.created_at,
             k.keyword
      FROM seo_opportunities o
      LEFT JOIN keywords k ON k.id = o.keyword_id
      WHERE o.client_id = $1 AND o.status = $2
    `;
    const params: any[] = [clientId, statusFilter];

    if (typeFilter) {
      params.push(typeFilter);
      query += ` AND o.type = $${params.length}`;
    }

    query += ` ORDER BY
      CASE o.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      o.created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

// PATCH /api/clients/:id/opportunities/:oppId — update status
router.patch("/:id/opportunities/:oppId", async (req, res) => {
  const { status } = req.body;
  if (!["open", "in_progress", "done", "dismissed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE seo_opportunities SET status = $1 WHERE id = $2 AND client_id = $3 RETURNING *`,
      [status, req.params.oppId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

export default router;
