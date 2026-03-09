import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/rankings?client_id=xxx
router.get("/", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id required" });

  try {
    const result = await pool.query(
      `SELECT 
        k.id as keyword_id,
        k.keyword, 
        rs.position AS current_position, 
        rs.ranking_url,
        rs.delta AS change, 
        rs.snapshot_date AS tracked_date,
        rs.serp_provider,
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

// GET /api/clients/:id/rankings - Rankings for a specific client
router.get("/client/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Get client domain
    const { rows: clientRows } = await pool.query(
      `SELECT domain FROM clients WHERE id = $1`,
      [id]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    const clientDomain = clientRows[0].domain;

    // Get rankings with delta calculation
    const result = await pool.query(
      `WITH latest_snapshots AS (
        SELECT DISTINCT ON (keyword_id, domain)
          keyword_id,
          domain,
          position,
          ranking_url,
          snapshot_date,
          serp_provider,
          delta
        FROM rank_snapshots
        ORDER BY keyword_id, domain, snapshot_date DESC
      ),
      previous_snapshots AS (
        SELECT DISTINCT ON (rs.keyword_id, rs.domain)
          rs.keyword_id,
          rs.domain,
          rs.position as previous_position
        FROM rank_snapshots rs
        JOIN latest_snapshots ls ON rs.keyword_id = ls.keyword_id 
          AND rs.domain = ls.domain 
          AND rs.snapshot_date < ls.snapshot_date
        ORDER BY rs.keyword_id, rs.domain, rs.snapshot_date DESC
      )
      SELECT 
        k.id as keyword_id,
        k.keyword,
        ls.position as current_position,
        COALESCE(ps.previous_position, ls.position) as last_position,
        CASE 
          WHEN ps.previous_position IS NOT NULL AND ls.position IS NOT NULL 
          THEN ps.previous_position - ls.position
          ELSE 0 
        END as change,
        ls.ranking_url,
        ls.snapshot_date as tracked_date,
        ls.serp_provider
      FROM keywords k
      LEFT JOIN latest_snapshots ls ON ls.keyword_id = k.id AND ls.domain = $2
      LEFT JOIN previous_snapshots ps ON ps.keyword_id = k.id AND ps.domain = $2
      WHERE k.client_id = $1 AND k.is_active
      ORDER BY ls.position ASC NULLS LAST`,
      [id, clientDomain]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
});

// GET /api/rankings/history/:keyword_id - Historical rankings for a keyword
router.get("/history/:keyword_id", async (req, res) => {
  const { keyword_id } = req.params;
  const { domain, days = 30 } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        position,
        ranking_url,
        snapshot_date,
        delta,
        serp_provider
      FROM rank_snapshots
      WHERE keyword_id = $1 
        AND ($2::text IS NULL OR domain = $2)
        AND snapshot_date >= CURRENT_DATE - INTERVAL '1 day' * $3
      ORDER BY snapshot_date DESC`,
      [keyword_id, domain || null, Number(days)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ranking history" });
  }
});

export default router;
