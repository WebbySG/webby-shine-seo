import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const { workspace_id } = req.query;
    const { rows } = await pool.query(
      `SELECT r.*, c.subject as conversation_subject FROM csat_responses r
       LEFT JOIN conversations c ON c.id = r.conversation_id
       WHERE r.workspace_id = $1 ORDER BY r.created_at DESC`, [workspace_id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/summary", async (req, res) => {
  try {
    const { workspace_id } = req.query;
    const { rows } = await pool.query(
      `SELECT COUNT(*) as total, AVG(rating) as avg_rating,
       COUNT(*) FILTER (WHERE rating >= 4) as satisfied,
       COUNT(*) FILTER (WHERE rating <= 2) as unsatisfied
       FROM csat_responses WHERE workspace_id = $1`, [workspace_id]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { workspace_id, conversation_id, contact_id, assignee_id, rating, feedback } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO csat_responses (workspace_id, conversation_id, contact_id, assignee_id, rating, feedback)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [workspace_id, conversation_id, contact_id, assignee_id, rating, feedback]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
