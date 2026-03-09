import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/internal-links
router.get("/:id/internal-links", async (req, res) => {
  const clientId = req.params.id;
  const statusFilter = (req.query.status as string) || "pending";

  try {
    const { rows } = await pool.query(
      `SELECT id, from_url, to_url, anchor_text, reason, priority, status, created_at
       FROM internal_link_suggestions
       WHERE client_id = $1 AND status = $2
       ORDER BY
         CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         created_at DESC`,
      [clientId, statusFilter]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch internal link suggestions" });
  }
});

// PATCH /api/clients/:id/internal-links/:linkId — update status
router.patch("/:id/internal-links/:linkId", async (req, res) => {
  const { status } = req.body;
  if (!["pending", "implemented", "dismissed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE internal_link_suggestions SET status = $1 WHERE id = $2 AND client_id = $3 RETURNING *`,
      [status, req.params.linkId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update internal link suggestion" });
  }
});

export default router;
