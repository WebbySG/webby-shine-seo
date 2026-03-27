import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/:clientId/rewrites", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM content_rewrites WHERE client_id = $1 ORDER BY created_at DESC`, [req.params.clientId]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 🔌 AI: This endpoint calls AI provider to rewrite content
router.post("/rewrite", async (req, res) => {
  try {
    const { client_id, original_text, rewrite_mode, target_tone, source_article_id } = req.body;
    // Placeholder: In production, call AI provider here
    const rewritten = `[AI Rewritten - ${rewrite_mode}] ${original_text}`;
    const { rows } = await pool.query(
      `INSERT INTO content_rewrites (client_id, source_article_id, original_text, rewritten_text, rewrite_mode, target_tone, status)
       VALUES ($1,$2,$3,$4,$5,$6,'completed') RETURNING *`,
      [client_id, source_article_id, original_text, rewritten, rewrite_mode || "improve", target_tone]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
