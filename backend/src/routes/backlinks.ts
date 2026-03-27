import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/:clientId/backlinks", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM backlinks WHERE client_id = $1 ORDER BY domain_authority DESC NULLS LAST`, [req.params.clientId]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/:clientId/backlinks/summary", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as total, COUNT(DISTINCT source_domain) as referring_domains,
       COUNT(*) FILTER (WHERE link_type='dofollow') as dofollow,
       COUNT(*) FILTER (WHERE link_type='nofollow') as nofollow,
       COUNT(*) FILTER (WHERE status='lost') as lost,
       AVG(domain_authority) as avg_da
       FROM backlinks WHERE client_id = $1`, [req.params.clientId]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/:clientId/backlinks", async (req, res) => {
  try {
    const { source_url, target_url, anchor_text, link_type, domain_authority, page_authority, source_domain } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO backlinks (client_id, source_url, target_url, anchor_text, link_type, domain_authority, page_authority, source_domain, first_seen, last_seen)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE,CURRENT_DATE) RETURNING *`,
      [req.params.clientId, source_url, target_url, anchor_text, link_type || "dofollow", domain_authority, page_authority, source_domain]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
