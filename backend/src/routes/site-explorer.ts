import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/:clientId/domain-overview", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM domain_overviews WHERE client_id = $1 ORDER BY snapshot_date DESC LIMIT 1`, [req.params.clientId]
    );
    res.json(rows[0] || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/:clientId/domain-overview/history", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM domain_overviews WHERE client_id = $1 ORDER BY snapshot_date DESC LIMIT 30`, [req.params.clientId]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 🔌 External API: Calls DataForSEO or similar to fetch domain data
router.post("/:clientId/domain-overview/refresh", async (req, res) => {
  try {
    const { domain } = req.body;
    // Placeholder: In production, call DataForSEO API
    const { rows } = await pool.query(
      `INSERT INTO domain_overviews (client_id, domain, domain_authority, organic_keywords, organic_traffic, backlinks_total, referring_domains, top_keywords, traffic_trend)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.clientId, domain, 45, 320, 8500, 1200, 180, '[]', '[]']
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
