import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/topical-maps
router.get("/:id/topical-maps", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM topical_maps WHERE client_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/topical-maps/:mapId — full map with clusters and articles
router.get("/:mapId", async (req, res) => {
  try {
    const { rows: maps } = await pool.query(`SELECT * FROM topical_maps WHERE id = $1`, [req.params.mapId]);
    if (maps.length === 0) return res.status(404).json({ error: "Not found" });

    const { rows: clusters } = await pool.query(
      `SELECT * FROM topical_map_clusters WHERE topical_map_id = $1 ORDER BY sort_order, cluster_name`,
      [req.params.mapId]
    );
    const { rows: articles } = await pool.query(
      `SELECT * FROM topical_map_articles WHERE topical_map_id = $1 ORDER BY sort_order, title`,
      [req.params.mapId]
    );

    res.json({ ...maps[0], clusters, articles });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/topical-maps/generate — create a new topical map from seed keyword
// 🔌 AI INTEGRATION: Replace template logic with AI provider call
router.post("/generate", async (req, res) => {
  const { client_id, seed_keyword, name, config } = req.body;
  if (!client_id || !seed_keyword) return res.status(400).json({ error: "client_id and seed_keyword required" });

  try {
    // Create the map record
    const { rows: [map] } = await pool.query(
      `INSERT INTO topical_maps (client_id, name, seed_keyword, status, config_json)
       VALUES ($1, $2, $3, 'generating', $4) RETURNING *`,
      [client_id, name || `${seed_keyword} Topical Map`, seed_keyword, JSON.stringify(config || {})]
    );

    // 🔌 AI INTEGRATION POINT: Call AI provider to generate clusters + articles
    // For now, generate template-based topical map
    const clusters = generateTemplateClusters(seed_keyword);
    let clusterCount = 0;
    let articleCount = 0;

    for (const cluster of clusters) {
      const { rows: [dbCluster] } = await pool.query(
        `INSERT INTO topical_map_clusters (topical_map_id, cluster_name, pillar_keyword, search_intent, estimated_volume, difficulty_score, priority, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [map.id, cluster.name, cluster.pillar, cluster.intent, cluster.volume, cluster.difficulty, cluster.priority, clusterCount]
      );
      clusterCount++;

      for (const article of cluster.articles) {
        await pool.query(
          `INSERT INTO topical_map_articles (topical_map_id, cluster_id, title, target_keyword, content_type, search_intent, estimated_volume, difficulty_score, word_count_target, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [map.id, dbCluster.id, article.title, article.keyword, article.type, article.intent, article.volume, article.difficulty, article.wordCount, articleCount]
        );
        articleCount++;
      }
    }

    await pool.query(
      `UPDATE topical_maps SET status = 'ready', cluster_count = $1, article_count = $2, updated_at = NOW() WHERE id = $3`,
      [clusterCount, articleCount, map.id]
    );

    // Return full map
    const { rows: finalClusters } = await pool.query(
      `SELECT * FROM topical_map_clusters WHERE topical_map_id = $1 ORDER BY sort_order`, [map.id]
    );
    const { rows: finalArticles } = await pool.query(
      `SELECT * FROM topical_map_articles WHERE topical_map_id = $1 ORDER BY sort_order`, [map.id]
    );

    res.status(201).json({ ...map, status: "ready", cluster_count: clusterCount, article_count: articleCount, clusters: finalClusters, articles: finalArticles });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/topical-maps/:mapId
router.delete("/:mapId", async (req, res) => {
  try {
    const { rows } = await pool.query(`DELETE FROM topical_maps WHERE id = $1 RETURNING id`, [req.params.mapId]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * 🔌 TEMPLATE GENERATOR — Replace with AI call in production
 * Generates realistic topical map clusters from a seed keyword
 */
function generateTemplateClusters(seed: string) {
  const base = seed.toLowerCase();
  return [
    {
      name: `${seed} Fundamentals`,
      pillar: `what is ${base}`,
      intent: "informational",
      volume: 2400,
      difficulty: 35,
      priority: "high",
      articles: [
        { title: `What Is ${seed}? The Complete Guide`, keyword: `what is ${base}`, type: "pillar_page", intent: "informational", volume: 2400, difficulty: 35, wordCount: 2500 },
        { title: `${seed} for Beginners: Everything You Need to Know`, keyword: `${base} for beginners`, type: "how_to", intent: "informational", volume: 1200, difficulty: 25, wordCount: 2000 },
        { title: `How ${seed} Works: A Step-by-Step Breakdown`, keyword: `how ${base} works`, type: "how_to", intent: "informational", volume: 880, difficulty: 30, wordCount: 1800 },
      ],
    },
    {
      name: `${seed} Strategies`,
      pillar: `${base} strategies`,
      intent: "informational",
      volume: 1600,
      difficulty: 45,
      priority: "high",
      articles: [
        { title: `Top 10 ${seed} Strategies That Actually Work`, keyword: `${base} strategies`, type: "listicle", intent: "informational", volume: 1600, difficulty: 45, wordCount: 2200 },
        { title: `${seed} Best Practices for ${new Date().getFullYear()}`, keyword: `${base} best practices`, type: "blog_post", intent: "informational", volume: 990, difficulty: 40, wordCount: 1800 },
        { title: `Advanced ${seed} Techniques for Experts`, keyword: `advanced ${base}`, type: "blog_post", intent: "informational", volume: 480, difficulty: 55, wordCount: 2000 },
      ],
    },
    {
      name: `${seed} Tools & Software`,
      pillar: `best ${base} tools`,
      intent: "commercial",
      volume: 1900,
      difficulty: 50,
      priority: "medium",
      articles: [
        { title: `Best ${seed} Tools & Software Compared`, keyword: `best ${base} tools`, type: "comparison", intent: "commercial", volume: 1900, difficulty: 50, wordCount: 2500 },
        { title: `Free vs Paid ${seed} Tools: Which Should You Use?`, keyword: `free ${base} tools`, type: "comparison", intent: "commercial", volume: 720, difficulty: 35, wordCount: 1500 },
        { title: `${seed} Automation: Tools That Save You Hours`, keyword: `${base} automation`, type: "listicle", intent: "commercial", volume: 590, difficulty: 42, wordCount: 1800 },
      ],
    },
    {
      name: `${seed} Costs & ROI`,
      pillar: `${base} cost`,
      intent: "transactional",
      volume: 1300,
      difficulty: 38,
      priority: "medium",
      articles: [
        { title: `How Much Does ${seed} Cost in ${new Date().getFullYear()}?`, keyword: `${base} cost`, type: "blog_post", intent: "transactional", volume: 1300, difficulty: 38, wordCount: 1500 },
        { title: `${seed} ROI: How to Measure and Maximize Returns`, keyword: `${base} roi`, type: "how_to", intent: "informational", volume: 640, difficulty: 42, wordCount: 2000 },
        { title: `${seed} Pricing Guide for Small Businesses`, keyword: `${base} pricing`, type: "blog_post", intent: "transactional", volume: 880, difficulty: 30, wordCount: 1200 },
      ],
    },
    {
      name: `${seed} FAQs & Troubleshooting`,
      pillar: `${base} faq`,
      intent: "informational",
      volume: 520,
      difficulty: 20,
      priority: "low",
      articles: [
        { title: `${seed} FAQ: 20 Most Common Questions Answered`, keyword: `${base} faq`, type: "faq", intent: "informational", volume: 520, difficulty: 20, wordCount: 2000 },
        { title: `Common ${seed} Mistakes and How to Avoid Them`, keyword: `${base} mistakes`, type: "listicle", intent: "informational", volume: 390, difficulty: 22, wordCount: 1500 },
      ],
    },
  ];
}

export default router;
