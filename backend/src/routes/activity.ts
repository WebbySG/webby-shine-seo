import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/activity — list activity log entries
router.get("/activity", async (req, res) => {
  const { client_id, workspace_id, entity_type, limit = "50", offset = "0" } = req.query;
  try {
    let query = `SELECT * FROM activity_log WHERE 1=1`;
    const params: any[] = [];

    if (workspace_id) {
      params.push(workspace_id);
      query += ` AND workspace_id = $${params.length}`;
    }
    if (client_id) {
      params.push(client_id);
      query += ` AND client_id = $${params.length}`;
    }
    if (entity_type) {
      params.push(entity_type);
      query += ` AND entity_type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;
    params.push(Number(limit));
    query += ` LIMIT $${params.length}`;
    params.push(Number(offset));
    query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch activity log" });
  }
});

// GET /api/notifications — list notifications
router.get("/notifications", async (req, res) => {
  const { is_read, category, limit = "30" } = req.query;
  try {
    let query = `SELECT * FROM notifications WHERE 1=1`;
    const params: any[] = [];

    if (is_read !== undefined) {
      params.push(is_read === "true");
      query += ` AND is_read = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;
    params.push(Number(limit));
    query += ` LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/:id/read — mark notification as read
router.put("/notifications/:id/read", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put("/notifications/read-all", async (_req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// GET /api/notifications/unread-count
router.get("/notifications/unread-count", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int as count FROM notifications WHERE is_read = FALSE`
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to count notifications" });
  }
});

// GET /api/publishing-jobs — all jobs across clients
router.get("/publishing-jobs", async (req, res) => {
  const { status, client_id, limit = "100" } = req.query;
  try {
    let query = `SELECT pj.*, c.name as client_name FROM publishing_jobs pj LEFT JOIN clients c ON c.id = pj.client_id WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` AND pj.publish_status = $${params.length}`;
    }
    if (client_id) {
      params.push(client_id);
      query += ` AND pj.client_id = $${params.length}`;
    }

    query += ` ORDER BY pj.created_at DESC`;
    params.push(Number(limit));
    query += ` LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

export default router;
