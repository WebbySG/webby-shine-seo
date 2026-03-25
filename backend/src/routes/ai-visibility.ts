import { Router } from "express";
import pool from "../db.js";
import { logActivity } from "../services/activityLogger.js";

const router = Router();

// ========== PROMPT SETS ==========

// GET /api/clients/:id/ai-visibility/prompt-sets
router.get("/:id/ai-visibility/prompt-sets", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ps.*, 
        (SELECT COUNT(*)::int FROM ai_visibility_prompts WHERE prompt_set_id = ps.id) as prompt_count,
        (SELECT COUNT(*)::int FROM ai_visibility_runs WHERE prompt_set_id = ps.id) as run_count
       FROM ai_visibility_prompt_sets ps
       WHERE ps.client_id = $1
       ORDER BY ps.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch prompt sets" });
  }
});

// POST /api/ai-visibility/prompt-sets
router.post("/prompt-sets", async (req, res) => {
  const { client_id, name, description, topic_cluster, intent_type } = req.body;
  if (!client_id || !name) return res.status(400).json({ error: "client_id and name required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO ai_visibility_prompt_sets (client_id, name, description, topic_cluster, intent_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [client_id, name, description || null, topic_cluster || null, intent_type || "informational"]
    );
    await logActivity({ clientId: client_id, action: "created", entityType: "prompt_set", entityId: rows[0].id, summary: `Created prompt set "${name}"` });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create prompt set" });
  }
});

// PUT /api/ai-visibility/prompt-sets/:id
router.put("/prompt-sets/:id", async (req, res) => {
  const { name, description, topic_cluster, intent_type, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE ai_visibility_prompt_sets
       SET name = COALESCE($1, name), description = COALESCE($2, description),
           topic_cluster = COALESCE($3, topic_cluster), intent_type = COALESCE($4, intent_type),
           status = COALESCE($5, status), updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, description, topic_cluster, intent_type, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update prompt set" });
  }
});

// DELETE /api/ai-visibility/prompt-sets/:id
router.delete("/prompt-sets/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM ai_visibility_prompt_sets WHERE id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete prompt set" });
  }
});

// ========== PROMPTS ==========

// GET /api/ai-visibility/prompt-sets/:setId/prompts
router.get("/prompt-sets/:setId/prompts", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ai_visibility_prompts WHERE prompt_set_id = $1 ORDER BY created_at`,
      [req.params.setId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch prompts" });
  }
});

// POST /api/ai-visibility/prompts
router.post("/prompts", async (req, res) => {
  const { prompt_set_id, prompt_text, target_entities, competitor_entities } = req.body;
  if (!prompt_set_id || !prompt_text) return res.status(400).json({ error: "prompt_set_id and prompt_text required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO ai_visibility_prompts (prompt_set_id, prompt_text, target_entities, competitor_entities)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [prompt_set_id, prompt_text, target_entities || [], competitor_entities || []]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create prompt" });
  }
});

// POST /api/ai-visibility/prompts/bulk
router.post("/prompts/bulk", async (req, res) => {
  const { prompt_set_id, prompts } = req.body;
  if (!prompt_set_id || !Array.isArray(prompts)) return res.status(400).json({ error: "prompt_set_id and prompts array required" });

  try {
    const inserted = [];
    for (const p of prompts) {
      const { rows } = await pool.query(
        `INSERT INTO ai_visibility_prompts (prompt_set_id, prompt_text, target_entities, competitor_entities)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [prompt_set_id, p.prompt_text, p.target_entities || [], p.competitor_entities || []]
      );
      inserted.push(rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create prompts" });
  }
});

// DELETE /api/ai-visibility/prompts/:id
router.delete("/prompts/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM ai_visibility_prompts WHERE id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete prompt" });
  }
});

// ========== RUNS ==========

// GET /api/clients/:id/ai-visibility/runs
router.get("/:id/ai-visibility/runs", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, ps.name as prompt_set_name
       FROM ai_visibility_runs r
       LEFT JOIN ai_visibility_prompt_sets ps ON ps.id = r.prompt_set_id
       WHERE r.client_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch runs" });
  }
});

// POST /api/ai-visibility/runs — start a visibility run
router.post("/runs", async (req, res) => {
  const { client_id, prompt_set_id, provider } = req.body;
  if (!client_id || !prompt_set_id) return res.status(400).json({ error: "client_id and prompt_set_id required" });

  try {
    // Get prompts for this set
    const { rows: prompts } = await pool.query(
      `SELECT * FROM ai_visibility_prompts WHERE prompt_set_id = $1`,
      [prompt_set_id]
    );

    if (prompts.length === 0) return res.status(400).json({ error: "No prompts in this set" });

    const { rows } = await pool.query(
      `INSERT INTO ai_visibility_runs (client_id, prompt_set_id, provider, status, total_prompts, started_at)
       VALUES ($1, $2, $3, 'running', $4, NOW()) RETURNING *`,
      [client_id, prompt_set_id, provider || "manual", prompts.length]
    );

    const run = rows[0];

    // For "manual" provider, create empty observations for user to fill in
    // For AI providers, this would be handled by the worker
    if (!provider || provider === "manual") {
      for (const prompt of prompts) {
        await pool.query(
          `INSERT INTO ai_visibility_observations (run_id, prompt_id, provider, prominence)
           VALUES ($1, $2, $3, 'absent')`,
          [run.id, prompt.id, "manual"]
        );
      }
      await pool.query(
        `UPDATE ai_visibility_runs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [run.id]
      );
      run.status = "completed";
    }

    await logActivity({ clientId: client_id, action: "started", entityType: "visibility_run", entityId: run.id, summary: `Started AI visibility run (${prompts.length} prompts)` });
    res.status(201).json(run);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start visibility run" });
  }
});

// GET /api/ai-visibility/runs/:runId/observations
router.get("/runs/:runId/observations", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, p.prompt_text
       FROM ai_visibility_observations o
       JOIN ai_visibility_prompts p ON p.id = o.prompt_id
       WHERE o.run_id = $1
       ORDER BY p.prompt_text`,
      [req.params.runId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch observations" });
  }
});

// PUT /api/ai-visibility/observations/:id — update an observation (manual entry)
router.put("/observations/:id", async (req, res) => {
  const { brand_mentioned, brand_position, competitor_mentioned, competitor_names, citation_present, citation_url, sentiment, prominence, raw_snippet } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE ai_visibility_observations SET
         brand_mentioned = COALESCE($1, brand_mentioned),
         brand_position = COALESCE($2, brand_position),
         competitor_mentioned = COALESCE($3, competitor_mentioned),
         competitor_names = COALESCE($4, competitor_names),
         citation_present = COALESCE($5, citation_present),
         citation_url = COALESCE($6, citation_url),
         sentiment = COALESCE($7, sentiment),
         prominence = COALESCE($8, prominence),
         raw_snippet = COALESCE($9, raw_snippet)
       WHERE id = $10 RETURNING *`,
      [brand_mentioned, brand_position, competitor_mentioned, competitor_names, citation_present, citation_url, sentiment, prominence, raw_snippet, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    // Update run aggregate counts
    const obs = rows[0];
    await pool.query(
      `UPDATE ai_visibility_runs SET
         prompts_with_mention = (SELECT COUNT(*)::int FROM ai_visibility_observations WHERE run_id = $1 AND brand_mentioned = TRUE),
         prompts_with_citation = (SELECT COUNT(*)::int FROM ai_visibility_observations WHERE run_id = $1 AND citation_present = TRUE)
       WHERE id = $1`,
      [obs.run_id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update observation" });
  }
});

// ========== OVERVIEW / REPORTING ==========

// GET /api/clients/:id/ai-visibility/overview
router.get("/:id/ai-visibility/overview", async (req, res) => {
  try {
    const clientId = req.params.id;

    // Overall stats
    const { rows: runStats } = await pool.query(
      `SELECT 
         COUNT(*)::int as total_runs,
         SUM(total_prompts)::int as total_prompts_checked,
         SUM(prompts_with_mention)::int as total_mentions,
         SUM(prompts_with_citation)::int as total_citations
       FROM ai_visibility_runs WHERE client_id = $1 AND status = 'completed'`,
      [clientId]
    );

    // Trend: last 10 runs
    const { rows: trend } = await pool.query(
      `SELECT id, created_at, total_prompts, prompts_with_mention, prompts_with_citation, provider
       FROM ai_visibility_runs WHERE client_id = $1 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 10`,
      [clientId]
    );

    // Per-prompt-set breakdown
    const { rows: bySet } = await pool.query(
      `SELECT ps.id, ps.name, ps.topic_cluster, ps.intent_type,
         COUNT(r.id)::int as runs,
         COALESCE(AVG(CASE WHEN r.total_prompts > 0 THEN r.prompts_with_mention::float / r.total_prompts * 100 ELSE 0 END), 0)::numeric(5,1) as avg_visibility_rate,
         COALESCE(AVG(CASE WHEN r.total_prompts > 0 THEN r.prompts_with_citation::float / r.total_prompts * 100 ELSE 0 END), 0)::numeric(5,1) as avg_citation_rate
       FROM ai_visibility_prompt_sets ps
       LEFT JOIN ai_visibility_runs r ON r.prompt_set_id = ps.id AND r.status = 'completed'
       WHERE ps.client_id = $1 AND ps.status = 'active'
       GROUP BY ps.id ORDER BY ps.name`,
      [clientId]
    );

    // Competitor mentions
    const { rows: compMentions } = await pool.query(
      `SELECT unnest(o.competitor_names) as competitor, COUNT(*)::int as mention_count
       FROM ai_visibility_observations o
       JOIN ai_visibility_runs r ON r.id = o.run_id
       WHERE r.client_id = $1 AND o.competitor_mentioned = TRUE
       GROUP BY competitor ORDER BY mention_count DESC LIMIT 10`,
      [clientId]
    );

    const stats = runStats[0] || { total_runs: 0, total_prompts_checked: 0, total_mentions: 0, total_citations: 0 };
    const visibilityRate = stats.total_prompts_checked > 0
      ? ((stats.total_mentions / stats.total_prompts_checked) * 100).toFixed(1)
      : "0.0";
    const citationRate = stats.total_prompts_checked > 0
      ? ((stats.total_citations / stats.total_prompts_checked) * 100).toFixed(1)
      : "0.0";

    res.json({
      summary: { ...stats, visibility_rate: Number(visibilityRate), citation_rate: Number(citationRate) },
      trend: trend.reverse(),
      byPromptSet: bySet,
      competitorMentions: compMentions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch AI visibility overview" });
  }
});

// ========== COMPETITORS ==========

// GET /api/clients/:id/ai-visibility/competitors
router.get("/:id/ai-visibility/competitors", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ai_visibility_competitors WHERE client_id = $1 ORDER BY competitor_name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch AI visibility competitors" });
  }
});

// POST /api/ai-visibility/competitors
router.post("/competitors", async (req, res) => {
  const { client_id, competitor_name, competitor_domain } = req.body;
  if (!client_id || !competitor_name) return res.status(400).json({ error: "client_id and competitor_name required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO ai_visibility_competitors (client_id, competitor_name, competitor_domain)
       VALUES ($1, $2, $3) ON CONFLICT (client_id, competitor_name) DO NOTHING RETURNING *`,
      [client_id, competitor_name, competitor_domain || null]
    );
    res.status(201).json(rows[0] || { exists: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add competitor" });
  }
});

export default router;
