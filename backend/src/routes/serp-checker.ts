import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/:clientId/serp-checks", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM serp_checks WHERE client_id = $1 ORDER BY checked_at DESC LIMIT 50`, [req.params.clientId]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 🔌 External API: Calls SERP provider to check live results
router.post("/check", async (req, res) => {
  try {
    const { client_id, keyword, location, device } = req.body;
    // Placeholder: In production, call DataForSEO SERP API
    const results = Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      url: `https://example${i + 1}.com/${keyword.replace(/\s+/g, "-")}`,
      title: `${keyword} - Result ${i + 1}`,
      description: `Description for ${keyword} result ${i + 1}`,
      domain: `example${i + 1}.com`,
    }));
    const { rows } = await pool.query(
      `INSERT INTO serp_checks (client_id, keyword, location, device, results)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [client_id, keyword, location || "Singapore", device || "desktop", JSON.stringify(results)]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
