import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/audit/issues?client_id=xxx
router.get("/issues", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id required" });

  try {
    const result = await pool.query(
      `SELECT ai.* FROM audit_issues ai
       JOIN audit_runs ar ON ar.id = ai.audit_run_id
       WHERE ar.client_id = $1
       ORDER BY
         CASE ai.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
         ai.created_at DESC`,
      [client_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit issues" });
  }
});

export default router;
