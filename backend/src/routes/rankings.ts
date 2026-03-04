import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/rankings?client_id=xxx
router.get("/", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id required" });

  try {
    const result = await pool.query(
      `SELECT k.keyword, rs.position AS current_position, rs.ranking_url,
        rs.delta AS change, rs.snapshot_date AS tracked_date,
        prev.position AS last_position
      FROM keywords k
      JOIN LATERAL (
        SELECT * FROM rank_snapshots
        WHERE keyword_id = k.id AND domain = (SELECT domain FROM clients WHERE id = $1)
        ORDER BY snapshot_date DESC LIMIT 1
      ) rs ON true
      LEFT JOIN LATERAL (
        SELECT position FROM rank_snapshots
        WHERE keyword_id = k.id AND domain = (SELECT domain FROM clients WHERE id = $1)
          AND snapshot_date < rs.snapshot_date
        ORDER BY snapshot_date DESC LIMIT 1
      ) prev ON true
      WHERE k.client_id = $1 AND k.is_active
      ORDER BY rs.position ASC NULLS LAST`,
      [client_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
});

export default router;
