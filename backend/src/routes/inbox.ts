import { Router } from "express";
import pool from "../db.js";
const router = Router();

// List inboxes
router.get("/", async (req, res) => {
  try {
    const { workspace_id } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM inboxes WHERE workspace_id = $1 ORDER BY created_at`, [workspace_id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Create inbox
router.post("/", async (req, res) => {
  try {
    const { workspace_id, name, channel, widget_color, welcome_message } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO inboxes (workspace_id, name, channel, widget_color, welcome_message)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [workspace_id, name, channel || "live_chat", widget_color || "#2563eb", welcome_message]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// List conversations
router.get("/conversations", async (req, res) => {
  try {
    const { workspace_id, status, inbox_id } = req.query;
    let q = `SELECT c.*, i.name as inbox_name, i.channel, u.full_name as assignee_name
             FROM conversations c
             JOIN inboxes i ON i.id = c.inbox_id
             LEFT JOIN users u ON u.id = c.assignee_id
             WHERE c.workspace_id = $1`;
    const params: any[] = [workspace_id];
    if (status) { params.push(status); q += ` AND c.status = $${params.length}`; }
    if (inbox_id) { params.push(inbox_id); q += ` AND c.inbox_id = $${params.length}`; }
    q += ` ORDER BY c.last_message_at DESC NULLS LAST`;
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Get conversation with messages
router.get("/conversations/:id", async (req, res) => {
  try {
    const { rows: convRows } = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [req.params.id]);
    if (!convRows.length) return res.status(404).json({ error: "Not found" });
    const { rows: messages } = await pool.query(
      `SELECT m.*, u.full_name as sender_name FROM messages m LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1 ORDER BY m.created_at`, [req.params.id]
    );
    res.json({ ...convRows[0], messages });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Send message
router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const { content, message_type, is_private, sender_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, message_type, content, is_private)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, sender_id, message_type || "outgoing", content, is_private || false]
    );
    await pool.query(
      `UPDATE conversations SET last_message_at = NOW(), messages_count = messages_count + 1, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Update conversation status
router.patch("/conversations/:id", async (req, res) => {
  try {
    const { status, assignee_id, priority } = req.body;
    const sets: string[] = ["updated_at = NOW()"];
    const params: any[] = [];
    if (status) { params.push(status); sets.push(`status = $${params.length}`); }
    if (assignee_id !== undefined) { params.push(assignee_id); sets.push(`assignee_id = $${params.length}`); }
    if (priority) { params.push(priority); sets.push(`priority = $${params.length}`); }
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE conversations SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Canned responses
router.get("/canned-responses", async (req, res) => {
  try {
    const { workspace_id } = req.query;
    const { rows } = await pool.query(`SELECT * FROM canned_responses WHERE workspace_id = $1 ORDER BY title`, [workspace_id]);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/canned-responses", async (req, res) => {
  try {
    const { workspace_id, short_code, title, content, category } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO canned_responses (workspace_id, short_code, title, content, category)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [workspace_id, short_code, title, content, category]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
