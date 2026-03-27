import { Router } from "express";
import pool from "../db.js";
import { z } from "zod";

const router = Router();

const startResearchSchema = z.object({
  client_id: z.string().uuid(),
  domain: z.string().min(1),
  seed_topics: z.array(z.string().min(1)).min(1),
  target_count: z.number().int().min(5).max(200).optional(),
  target_location: z.string().optional(),
  target_language: z.string().optional(),
  business_priority: z.enum(["leads", "local_seo", "authority", "content_growth"]).optional(),
  provider: z.enum(["mock", "dataforseo", "semrush"]).optional(),
});

// POST /api/keyword-research/start — Start a new keyword research job
router.post("/start", async (req, res) => {
  const parsed = startResearchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { client_id, domain, seed_topics, target_count, target_location, target_language, business_priority, provider } = parsed.data;

  try {
    const result = await pool.query(
      `INSERT INTO keyword_research_jobs (client_id, domain, seed_topics, target_count, target_location, target_language, business_priority, provider, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'running')
       RETURNING *`,
      [client_id, domain, seed_topics, target_count ?? 20, target_location ?? "Singapore", target_language ?? "en", business_priority ?? "authority", provider ?? "mock"]
    );

    // 🔌 PROVIDER HOOK: In production, dispatch to worker queue for async processing
    // For mock mode, results are generated via demo-data interceptor on the frontend
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start keyword research" });
  }
});

// GET /api/clients/:id/keyword-research — List research jobs for a client
router.get("/clients/:id/keyword-research", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM keyword_research_jobs WHERE client_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch keyword research jobs" });
  }
});

// GET /api/keyword-research/:id — Get job detail with results, clusters, mappings
router.get("/:id", async (req, res) => {
  try {
    const jobResult = await pool.query(`SELECT * FROM keyword_research_jobs WHERE id = $1`, [req.params.id]);
    if (jobResult.rows.length === 0) return res.status(404).json({ error: "Job not found" });

    const job = jobResult.rows[0];

    const [results, clusters, mappings] = await Promise.all([
      pool.query(`SELECT * FROM keyword_research_results WHERE job_id = $1 ORDER BY overall_score DESC`, [job.id]),
      pool.query(`SELECT * FROM keyword_research_clusters WHERE job_id = $1 ORDER BY sort_order`, [job.id]),
      pool.query(`SELECT * FROM keyword_page_mappings WHERE job_id = $1 ORDER BY sort_order`, [job.id]),
    ]);

    res.json({
      ...job,
      results: results.rows,
      clusters: clusters.rows,
      mappings: mappings.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch keyword research detail" });
  }
});

// PATCH /api/keyword-research/results/:id — Update mapping for a keyword result
router.patch("/results/:id", async (req, res) => {
  const { mapping_status, recommended_page_type, mapping_notes, brief_queued } = req.body;
  try {
    const result = await pool.query(
      `UPDATE keyword_research_results SET
        mapping_status = COALESCE($2, mapping_status),
        recommended_page_type = COALESCE($3, recommended_page_type),
        mapping_notes = COALESCE($4, mapping_notes),
        brief_queued = COALESCE($5, brief_queued)
       WHERE id = $1 RETURNING *`,
      [req.params.id, mapping_status, recommended_page_type, mapping_notes, brief_queued]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Result not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update keyword result" });
  }
});

// PATCH /api/keyword-research/mappings/:id — Update page mapping status
router.patch("/mappings/:id", async (req, res) => {
  const { status, priority } = req.body;
  try {
    const result = await pool.query(
      `UPDATE keyword_page_mappings SET
        status = COALESCE($2, status),
        priority = COALESCE($3, priority)
       WHERE id = $1 RETURNING *`,
      [req.params.id, status, priority]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Mapping not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update mapping" });
  }
});

// POST /api/keyword-research/mappings/:id/create-brief — Queue brief creation from mapping
router.post("/mappings/:id/create-brief", async (req, res) => {
  try {
    // 🔌 PROVIDER HOOK: In production, this triggers brief generation via AI service
    const result = await pool.query(
      `UPDATE keyword_page_mappings SET status = 'brief_created' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Mapping not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create brief" });
  }
});

export default router;
