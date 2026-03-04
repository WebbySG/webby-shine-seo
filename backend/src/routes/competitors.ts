import { Router } from "express";
import pool from "../db.js";
import { z } from "zod";

const router = Router();

const createCompetitorSchema = z.object({
  domain: z.string().min(1),
  label: z.string().optional(),
});

// GET /api/clients/:id/competitors
router.get("/:id/competitors", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM competitors WHERE client_id = $1 ORDER BY domain",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch competitors" });
  }
});

// POST /api/clients/:id/competitors
router.post("/:id/competitors", async (req, res) => {
  const parsed = createCompetitorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { domain, label } = parsed.data;
    const result = await pool.query(
      `INSERT INTO competitors (client_id, domain, label, confirmed)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [req.params.id, domain, label ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Competitor already exists" });
    console.error(err);
    res.status(500).json({ error: "Failed to create competitor" });
  }
});

export default router;
