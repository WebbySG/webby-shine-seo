import { Router } from "express";
import pool from "../db.js";
import { publishToWordPress, markdownToHtml } from "../services/publishing/wordpressPublisher.js";
import { createSocialPublisher } from "../services/publishing/socialPublisher.js";
import { createVideoRenderer } from "../services/video/videoRenderer.js";

const router = Router();

// POST /api/publishing/schedule — create a publishing job
router.post("/schedule", async (req, res) => {
  const { client_id, asset_type, asset_id, platform, job_type, scheduled_time, provider } = req.body;
  if (!client_id || !asset_type || !asset_id || !platform || !job_type) {
    return res.status(400).json({ error: "client_id, asset_type, asset_id, platform, and job_type are required" });
  }

  try {
    const publishStatus = scheduled_time ? "scheduled" : "queued";
    const { rows } = await pool.query(
      `INSERT INTO publishing_jobs (client_id, asset_type, asset_id, platform, job_type, scheduled_time, publish_status, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [client_id, asset_type, asset_id, platform, job_type, scheduled_time || null, publishStatus, provider || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to schedule job" });
  }
});

// GET /api/clients/:id/publishing-jobs — list jobs for a client
router.get("/:id/publishing-jobs", async (req, res) => {
  const statusFilter = req.query.status as string | undefined;
  try {
    let query = `SELECT * FROM publishing_jobs WHERE client_id = $1`;
    const params: any[] = [req.params.id];

    if (statusFilter) {
      params.push(statusFilter);
      query += ` AND publish_status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// POST /api/publishing/:jobId/retry — retry a failed job
router.post("/:jobId/retry", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE publishing_jobs
       SET publish_status = 'queued', error_message = NULL, updated_at = now()
       WHERE id = $1 AND publish_status = 'failed'
       RETURNING *`,
      [req.params.jobId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Job not found or not in failed state" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retry job" });
  }
});

// POST /api/publishing/:jobId/cancel — cancel a queued/scheduled job
router.post("/:jobId/cancel", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE publishing_jobs
       SET publish_status = 'cancelled', updated_at = now()
       WHERE id = $1 AND publish_status IN ('queued', 'scheduled')
       RETURNING *`,
      [req.params.jobId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Job not found or cannot be cancelled" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel job" });
  }
});

// PUT /api/publishing/:jobId/reschedule — reschedule a job
router.put("/:jobId/reschedule", async (req, res) => {
  const { scheduled_time } = req.body;
  if (!scheduled_time) return res.status(400).json({ error: "scheduled_time is required" });

  try {
    const { rows } = await pool.query(
      `UPDATE publishing_jobs
       SET scheduled_time = $1, publish_status = 'scheduled', updated_at = now()
       WHERE id = $2 AND publish_status IN ('queued', 'scheduled', 'failed')
       RETURNING *`,
      [scheduled_time, req.params.jobId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Job not found or cannot be rescheduled" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reschedule job" });
  }
});

export default router;
