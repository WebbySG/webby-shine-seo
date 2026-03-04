import { Router } from "express";
import pool from "../db.js";
import { z } from "zod";

const router = Router();
const TENANT_ID = process.env.TENANT_ID || "00000000-0000-0000-0000-000000000001";

const createClientSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  max_keywords: z.number().int().positive().optional(),
  max_competitors: z.number().int().positive().optional(),
  crawl_limit: z.number().int().positive().optional(),
});

const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(["active", "paused", "archived"]).optional(),
});

// GET /api/clients
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT count(*) FROM keywords k WHERE k.client_id = c.id AND k.is_active) AS keywords_count,
        (SELECT count(*) FROM competitors co WHERE co.client_id = c.id) AS competitors_count,
        COALESCE((SELECT ar.score FROM audit_runs ar WHERE ar.client_id = c.id ORDER BY ar.created_at DESC LIMIT 1), 0) AS health_score
      FROM clients c
      WHERE c.tenant_id = $1 AND c.status = 'active'
      ORDER BY c.name`,
      [TENANT_ID]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// GET /api/clients/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT count(*) FROM keywords k WHERE k.client_id = c.id AND k.is_active) AS keywords_count,
        (SELECT count(*) FROM competitors co WHERE co.client_id = c.id) AS competitors_count,
        COALESCE((SELECT ar.score FROM audit_runs ar WHERE ar.client_id = c.id ORDER BY ar.created_at DESC LIMIT 1), 0) AS health_score
      FROM clients c
      WHERE c.id = $1 AND c.tenant_id = $2`,
      [req.params.id, TENANT_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

// POST /api/clients
router.post("/", async (req, res) => {
  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { name, domain, max_keywords, max_competitors, crawl_limit } = parsed.data;
    const result = await pool.query(
      `INSERT INTO clients (tenant_id, name, domain, max_keywords, max_competitors, crawl_limit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [TENANT_ID, name, domain, max_keywords ?? 30, max_competitors ?? 2, crawl_limit ?? 500]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Client domain already exists" });
    console.error(err);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// PUT /api/clients/:id
router.put("/:id", async (req, res) => {
  const parsed = updateClientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const fields = parsed.data;
    const sets = Object.keys(fields).map((k, i) => `${k} = $${i + 3}`);
    if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });

    const result = await pool.query(
      `UPDATE clients SET ${sets.join(", ")} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [req.params.id, TENANT_ID, ...Object.values(fields)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// DELETE /api/clients/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM clients WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [req.params.id, TENANT_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
