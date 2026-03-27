import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/competitor-benchmarks?client_id=xxx
router.get("/", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id required" });
  try {
    const result = await pool.query(
      `SELECT * FROM competitor_benchmark_runs WHERE client_id = $1 ORDER BY created_at DESC`,
      [client_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch benchmark runs" });
  }
});

// GET /api/competitor-benchmarks/:id
router.get("/:id", async (req, res) => {
  try {
    const run = await pool.query(`SELECT * FROM competitor_benchmark_runs WHERE id = $1`, [req.params.id]);
    if (!run.rows[0]) return res.status(404).json({ error: "Benchmark run not found" });
    const pages = await pool.query(
      `SELECT * FROM competitor_page_classifications WHERE benchmark_run_id = $1 ORDER BY page_type, url`,
      [req.params.id]
    );
    const recommendations = await pool.query(
      `SELECT * FROM competitor_gap_recommendations WHERE benchmark_run_id = $1
       ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      [req.params.id]
    );
    res.json({ ...run.rows[0], pages: pages.rows, recommendations: recommendations.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch benchmark detail" });
  }
});

// POST /api/competitor-benchmarks
router.post("/", async (req, res) => {
  const { client_id, target_domain, competitor_domain, scope, provider, own_audit_run_id } = req.body;
  if (!client_id || !competitor_domain) return res.status(400).json({ error: "client_id and competitor_domain required" });
  try {
    const result = await pool.query(
      `INSERT INTO competitor_benchmark_runs (client_id, target_domain, competitor_domain, scope, provider, own_audit_run_id, status, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'running', now()) RETURNING *`,
      [client_id, target_domain || "", competitor_domain, scope || "full_crawl", provider || "mock", own_audit_run_id || null]
    );
    // TODO: Queue actual benchmark job via worker
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start benchmark" });
  }
});

export default router;
