import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const { workspace_id } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM automation_rules WHERE workspace_id = $1 ORDER BY created_at DESC`, [workspace_id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { workspace_id, name, description, event_type, conditions, actions } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO automation_rules (workspace_id, name, description, event_type, conditions, actions)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [workspace_id, name, description, event_type, JSON.stringify(conditions || []), JSON.stringify(actions || [])]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description, event_type, conditions, actions, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE automation_rules SET name=$1, description=$2, event_type=$3, conditions=$4, actions=$5, is_active=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, description, event_type, JSON.stringify(conditions), JSON.stringify(actions), is_active, req.params.id]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM automation_rules WHERE id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
