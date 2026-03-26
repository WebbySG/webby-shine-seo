import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/bulk-jobs
router.get("/:id/bulk-jobs", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bulk_generation_jobs WHERE client_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/bulk-content/:jobId — job with items
router.get("/:jobId", async (req, res) => {
  try {
    const { rows: jobs } = await pool.query(`SELECT * FROM bulk_generation_jobs WHERE id = $1`, [req.params.jobId]);
    if (jobs.length === 0) return res.status(404).json({ error: "Not found" });

    const { rows: items } = await pool.query(
      `SELECT * FROM bulk_generation_items WHERE job_id = $1 ORDER BY created_at`,
      [req.params.jobId]
    );

    res.json({ ...jobs[0], items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/bulk-content/generate — create a bulk generation job
router.post("/generate", async (req, res) => {
  const { client_id, name, keywords, topical_map_id, config } = req.body;
  if (!client_id || (!keywords?.length && !topical_map_id)) {
    return res.status(400).json({ error: "client_id and either keywords array or topical_map_id required" });
  }

  try {
    let keywordList: { keyword: string; title?: string }[] = keywords || [];

    // If using topical map, pull articles from it
    if (topical_map_id && !keywords?.length) {
      const { rows: articles } = await pool.query(
        `SELECT target_keyword, title FROM topical_map_articles WHERE topical_map_id = $1 AND status = 'planned' ORDER BY sort_order`,
        [topical_map_id]
      );
      keywordList = articles.map(a => ({ keyword: a.target_keyword, title: a.title }));
    }

    if (keywordList.length === 0) return res.status(400).json({ error: "No keywords to generate" });

    // Create job
    const { rows: [job] } = await pool.query(
      `INSERT INTO bulk_generation_jobs (client_id, topical_map_id, name, total_articles, config_json)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [client_id, topical_map_id || null, name || `Bulk Generation — ${keywordList.length} articles`, keywordList.length, JSON.stringify(config || {})]
    );

    // Create items
    for (const kw of keywordList) {
      await pool.query(
        `INSERT INTO bulk_generation_items (job_id, target_keyword, title) VALUES ($1, $2, $3)`,
        [job.id, kw.keyword, kw.title || null]
      );
    }

    // 🔌 AI INTEGRATION POINT: In production, enqueue job to worker for async processing
    // For now, simulate immediate completion with template content
    await simulateBulkGeneration(job.id, client_id);

    // Return updated job
    const { rows: [updatedJob] } = await pool.query(`SELECT * FROM bulk_generation_jobs WHERE id = $1`, [job.id]);
    const { rows: items } = await pool.query(`SELECT * FROM bulk_generation_items WHERE job_id = $1 ORDER BY created_at`, [job.id]);

    res.status(201).json({ ...updatedJob, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/bulk-content/:jobId/cancel
router.post("/:jobId/cancel", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE bulk_generation_jobs SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status IN ('queued', 'running') RETURNING *`,
      [req.params.jobId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Job not found or already completed" });
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * 🔌 SIMULATION — Replace with worker queue in production
 * Marks items as completed with generated articles
 */
async function simulateBulkGeneration(jobId: string, clientId: string) {
  await pool.query(
    `UPDATE bulk_generation_jobs SET status = 'running', started_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [jobId]
  );

  const { rows: items } = await pool.query(`SELECT * FROM bulk_generation_items WHERE job_id = $1`, [jobId]);
  let completed = 0;

  for (const item of items) {
    const title = item.title || `Complete Guide to ${item.target_keyword}`;
    const slug = "/" + item.target_keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const content = `# ${title}\n\nThis is a comprehensive guide about **${item.target_keyword}**. ` +
      `In this article, we cover everything you need to know.\n\n` +
      `## What Is ${item.target_keyword}?\n\nUnderstanding ${item.target_keyword} is essential for anyone looking to succeed in this area.\n\n` +
      `## Key Benefits\n\nThere are several important benefits to consider when evaluating ${item.target_keyword}.\n\n` +
      `## Best Practices\n\nFollowing these best practices will help you get the most out of ${item.target_keyword}.\n\n` +
      `## Conclusion\n\nWe hope this guide to ${item.target_keyword} has been helpful.`;

    const { rows: [article] } = await pool.query(
      `INSERT INTO seo_articles (client_id, title, meta_description, content, target_keyword, slug, status)
       VALUES ($1,$2,$3,$4,$5,$6,'draft') RETURNING id`,
      [clientId, title, `Learn everything about ${item.target_keyword} in our comprehensive guide.`, content, item.target_keyword, slug]
    );

    await pool.query(
      `UPDATE bulk_generation_items SET status = 'completed', article_id = $1, content_score = $2, completed_at = NOW() WHERE id = $3`,
      [article.id, Math.round(55 + Math.random() * 35), item.id]
    );
    completed++;
  }

  await pool.query(
    `UPDATE bulk_generation_jobs SET status = 'completed', completed_articles = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2`,
    [completed, jobId]
  );
}

export default router;
