import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/cms — get CMS connection for client
router.get("/:id/cms", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, cms_type, site_url, username, created_at FROM cms_connections WHERE client_id = $1`,
      [req.params.id]
    );
    // Don't return application_password
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch CMS connection" });
  }
});

// POST /api/clients/:id/cms — create/update CMS connection
router.post("/:id/cms", async (req, res) => {
  const { site_url, username, application_password, cms_type = "wordpress" } = req.body;
  if (!site_url || !username || !application_password) {
    return res.status(400).json({ error: "site_url, username, and application_password are required" });
  }

  try {
    // Upsert: update if exists, insert if not
    const { rows } = await pool.query(
      `INSERT INTO cms_connections (client_id, cms_type, site_url, username, application_password)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (client_id, cms_type)
       DO UPDATE SET site_url = $3, username = $4, application_password = $5
       RETURNING id, cms_type, site_url, username, created_at`,
      [req.params.id, cms_type, site_url, username, application_password]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save CMS connection" });
  }
});

// DELETE /api/clients/:id/cms — remove CMS connection
router.delete("/:id/cms", async (req, res) => {
  try {
    await pool.query(`DELETE FROM cms_connections WHERE client_id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete CMS connection" });
  }
});

// POST /api/clients/:id/cms/test — test CMS connection
router.post("/:id/cms/test", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT site_url, username, application_password FROM cms_connections WHERE client_id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "No CMS connection configured" });
    }

    const { site_url, username, application_password } = rows[0];
    const wpUrl = `${site_url.replace(/\/$/, "")}/wp-json/wp/v2/posts?per_page=1`;

    const response = await fetch(wpUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${application_password}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(400).json({ error: `WordPress connection failed: ${response.status}`, details: text });
    }

    res.json({ success: true, message: "Connection successful" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to test CMS connection", details: err.message });
  }
});

export default router;
