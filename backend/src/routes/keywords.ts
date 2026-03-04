import { Router } from "express";
import pool from "../db.js";
import { z } from "zod";

const router = Router();

const createKeywordSchema = z.object({
  keyword: z.string().min(1),
  search_engine: z.string().optional(),
  locale: z.string().optional(),
  location: z.string().optional(),
});

// GET /api/clients/:id/keywords
router.get("/:id/keywords", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT k.*,
        rs.position AS current_position,
        rs.ranking_url,
        rs.delta AS change,
        rs.snapshot_date AS tracked_date,
        prev.position AS last_position
      FROM keywords k
      LEFT JOIN LATERAL (
        SELECT * FROM rank_snapshots rs
        WHERE rs.keyword_id = k.id AND rs.domain = (SELECT domain FROM clients WHERE id = $1)
        ORDER BY rs.snapshot_date DESC LIMIT 1
      ) rs ON true
      LEFT JOIN LATERAL (
        SELECT position FROM rank_snapshots
        WHERE keyword_id = k.id AND domain = (SELECT domain FROM clients WHERE id = $1)
          AND snapshot_date < rs.snapshot_date
        ORDER BY snapshot_date DESC LIMIT 1
      ) prev ON true
      WHERE k.client_id = $1 AND k.is_active
      ORDER BY k.keyword`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch keywords" });
  }
});

// POST /api/clients/:id/keywords
router.post("/:id/keywords", async (req, res) => {
  const parsed = createKeywordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { keyword, search_engine, locale, location } = parsed.data;
    const result = await pool.query(
      `INSERT INTO keywords (client_id, keyword, search_engine, locale, location)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, keyword, search_engine ?? "google", locale ?? "en-SG", location ?? "Singapore"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Keyword already exists for this client" });
    console.error(err);
    res.status(500).json({ error: "Failed to create keyword" });
  }
});

export default router;
