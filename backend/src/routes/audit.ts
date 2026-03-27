import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/audit/runs?client_id=xxx
router.get("/runs", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id required" });
  try {
    const result = await pool.query(
      `SELECT * FROM audit_runs WHERE client_id = $1 ORDER BY created_at DESC`,
      [client_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit runs" });
  }
});

// GET /api/audit/runs/:id
router.get("/runs/:id", async (req, res) => {
  try {
    const run = await pool.query(`SELECT * FROM audit_runs WHERE id = $1`, [req.params.id]);
    if (!run.rows[0]) return res.status(404).json({ error: "Run not found" });
    const issues = await pool.query(
      `SELECT ai.*, aie.evidence_type, aie.key as evidence_key, aie.value as evidence_value, aie.expected_value
       FROM audit_issues ai
       LEFT JOIN audit_issue_evidence aie ON aie.audit_issue_id = ai.id
       WHERE ai.audit_run_id = $1
       ORDER BY CASE ai.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, ai.created_at DESC`,
      [req.params.id]
    );
    const pages = await pool.query(`SELECT * FROM audit_pages WHERE audit_run_id = $1 ORDER BY issues_count DESC`, [req.params.id]);
    res.json({ ...run.rows[0], issues: issues.rows, pages: pages.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit run" });
  }
});

// POST /api/audit/runs – Start a new audit
router.post("/runs", async (req, res) => {
  const { client_id, domain, scope, provider } = req.body;
  if (!client_id || !domain) return res.status(400).json({ error: "client_id and domain required" });
  try {
    const result = await pool.query(
      `INSERT INTO audit_runs (client_id, domain, scope, provider, status, started_at)
       VALUES ($1, $2, $3, $4, 'running', now()) RETURNING *`,
      [client_id, domain, scope || "full_crawl", provider || "mock"]
    );
    // TODO: Queue actual audit job via worker
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start audit" });
  }
});

// GET /api/audit/issues?client_id=xxx
router.get("/issues", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id required" });
  try {
    const result = await pool.query(
      `SELECT ai.* FROM audit_issues ai
       JOIN audit_runs ar ON ar.id = ai.audit_run_id
       WHERE ar.client_id = $1
       ORDER BY CASE ai.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, ai.created_at DESC`,
      [client_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit issues" });
  }
});

// GET /api/audit/issues/:id – Issue detail with evidence and rechecks
router.get("/issues/:id", async (req, res) => {
  try {
    const issue = await pool.query(`SELECT * FROM audit_issues WHERE id = $1`, [req.params.id]);
    if (!issue.rows[0]) return res.status(404).json({ error: "Issue not found" });
    const evidence = await pool.query(`SELECT * FROM audit_issue_evidence WHERE audit_issue_id = $1 ORDER BY captured_at DESC`, [req.params.id]);
    const rechecks = await pool.query(`SELECT * FROM audit_rechecks WHERE audit_issue_id = $1 ORDER BY checked_at DESC`, [req.params.id]);
    res.json({ ...issue.rows[0], evidence: evidence.rows, rechecks: rechecks.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issue detail" });
  }
});

// PATCH /api/audit/issues/:id – Update issue status
router.patch("/issues/:id", async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "status required" });
  try {
    const result = await pool.query(
      `UPDATE audit_issues SET status = $1, resolved_at = CASE WHEN $1 = 'fixed' THEN now() ELSE resolved_at END WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update issue" });
  }
});

// POST /api/audit/issues/:id/recheck – Recheck a single issue
router.post("/issues/:id/recheck", async (req, res) => {
  try {
    const issue = await pool.query(`SELECT * FROM audit_issues WHERE id = $1`, [req.params.id]);
    if (!issue.rows[0]) return res.status(404).json({ error: "Issue not found" });
    // TODO: Run actual recheck via provider
    // For now, record a recheck entry
    const recheck = await pool.query(
      `INSERT INTO audit_rechecks (audit_issue_id, provider, previous_status, new_status, diff_summary)
       VALUES ($1, $2, $3, $3, 'Recheck pending — provider integration required')
       RETURNING *`,
      [req.params.id, issue.rows[0].provider || "mock", issue.rows[0].status]
    );
    await pool.query(`UPDATE audit_issues SET last_checked_at = now(), recheck_count = recheck_count + 1 WHERE id = $1`, [req.params.id]);
    res.json(recheck.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to recheck issue" });
  }
});

// POST /api/audit/runs/:id/recheck – Recheck all issues in a run
router.post("/runs/:id/recheck", async (req, res) => {
  try {
    const issues = await pool.query(`SELECT id, status, provider FROM audit_issues WHERE audit_run_id = $1 AND status != 'fixed'`, [req.params.id]);
    const rechecks = [];
    for (const issue of issues.rows) {
      const r = await pool.query(
        `INSERT INTO audit_rechecks (audit_issue_id, audit_run_id, provider, previous_status, new_status, diff_summary)
         VALUES ($1, $2, $3, $4, $4, 'Bulk recheck pending')
         RETURNING *`,
        [issue.id, req.params.id, issue.provider || "mock", issue.status]
      );
      await pool.query(`UPDATE audit_issues SET last_checked_at = now(), recheck_count = recheck_count + 1 WHERE id = $1`, [issue.id]);
      rechecks.push(r.rows[0]);
    }
    res.json({ rechecked: rechecks.length, rechecks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to recheck issues" });
  }
});

// GET /api/audit/rules – List active rule versions
router.get("/rules", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM audit_rule_versions WHERE is_active = true ORDER BY category, rule_key`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rules" });
  }
});

// GET /api/audit/pages?run_id=xxx
router.get("/pages", async (req, res) => {
  const { run_id } = req.query;
  if (!run_id) return res.status(400).json({ error: "run_id required" });
  try {
    const result = await pool.query(`SELECT * FROM audit_pages WHERE audit_run_id = $1 ORDER BY issues_count DESC`, [run_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

export default router;
