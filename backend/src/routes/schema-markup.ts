import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/:clientId/schema-markups", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM schema_markups WHERE client_id = $1 ORDER BY created_at DESC`, [req.params.clientId]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/:clientId/schema-markups", async (req, res) => {
  try {
    const { page_url, schema_type, schema_json } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO schema_markups (client_id, page_url, schema_type, schema_json)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.clientId, page_url, schema_type, JSON.stringify(schema_json)]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/schema-markups/:id", async (req, res) => {
  try {
    const { schema_json, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE schema_markups SET schema_json=$1, status=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [JSON.stringify(schema_json), status, req.params.id]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/schema-markups/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM schema_markups WHERE id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
