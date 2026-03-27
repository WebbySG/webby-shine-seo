import { Router } from "express";
import pool from "../db.js";
const router = Router();

// Categories
router.get("/categories", async (req, res) => {
  try {
    const { workspace_id } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM kb_categories WHERE workspace_id = $1 ORDER BY position`, [workspace_id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/categories", async (req, res) => {
  try {
    const { workspace_id, name, description, icon } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO kb_categories (workspace_id, name, description, icon) VALUES ($1,$2,$3,$4) RETURNING *`,
      [workspace_id, name, description, icon]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Articles
router.get("/articles", async (req, res) => {
  try {
    const { workspace_id, category_id, status } = req.query;
    let q = `SELECT a.*, c.name as category_name FROM kb_articles a LEFT JOIN kb_categories c ON c.id = a.category_id WHERE a.workspace_id = $1`;
    const params: any[] = [workspace_id];
    if (category_id) { params.push(category_id); q += ` AND a.category_id = $${params.length}`; }
    if (status) { params.push(status); q += ` AND a.status = $${params.length}`; }
    q += ` ORDER BY a.updated_at DESC`;
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/articles", async (req, res) => {
  try {
    const { workspace_id, category_id, title, slug, content, status, author_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO kb_articles (workspace_id, category_id, title, slug, content, status, author_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [workspace_id, category_id, title, slug || title.toLowerCase().replace(/\s+/g, "-"), content, status || "draft", author_id]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/articles/:id", async (req, res) => {
  try {
    const { title, content, status, category_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE kb_articles SET title=$1, content=$2, status=$3, category_id=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [title, content, status, category_id, req.params.id]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/articles/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM kb_articles WHERE id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
