import { Router } from "express";
import pool from "../db.js";
import { generatePerformanceInsights } from "../services/analytics/insightEngine.js";

const router = Router();

// POST /analytics/connect — save analytics connection
router.post("/connect", async (req, res) => {
  try {
    const { client_id, provider, property_id, site_url, access_token, refresh_token, token_expires_at } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO analytics_connections (client_id, provider, property_id, site_url, access_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (client_id, provider) DO UPDATE SET
         property_id = EXCLUDED.property_id, site_url = EXCLUDED.site_url,
         access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
         token_expires_at = EXCLUDED.token_expires_at, status = 'active', updated_at = now()
       RETURNING *`,
      [client_id, provider, property_id || null, site_url || null, access_token || null, refresh_token || null, token_expires_at || null]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /analytics/:id/disconnect
router.delete("/:id/disconnect", async (req, res) => {
  try {
    await pool.query(
      `UPDATE analytics_connections SET status = 'disconnected', updated_at = now() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/sync — trigger sync for a client
router.post("/sync", async (req, res) => {
  try {
    const { client_id } = req.body;
    // For now, just regenerate insights from existing data
    const count = await generatePerformanceInsights(client_id);
    res.json({ success: true, insights_generated: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/:id/analytics-connections
router.get("/:id/analytics-connections", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, client_id, provider, property_id, site_url, status, created_at, updated_at
       FROM analytics_connections WHERE client_id = $1 ORDER BY provider`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/:id/page-performance
router.get("/:id/page-performance", async (req, res) => {
  try {
    const days = Number(req.query.days) || 14;
    const { rows } = await pool.query(
      `SELECT page_url, source,
              SUM(clicks) AS clicks, SUM(impressions) AS impressions,
              AVG(ctr) AS ctr, AVG(average_position) AS average_position,
              SUM(sessions) AS sessions, SUM(users) AS users, AVG(engagement_rate) AS engagement_rate
       FROM page_performance_snapshots
       WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - $2
       GROUP BY page_url, source
       ORDER BY SUM(clicks) DESC`,
      [req.params.id, days]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/:id/keyword-performance
router.get("/:id/keyword-performance", async (req, res) => {
  try {
    const days = Number(req.query.days) || 14;
    const { rows } = await pool.query(
      `SELECT kps.keyword_id, k.keyword, kps.page_url,
              SUM(kps.clicks) AS clicks, SUM(kps.impressions) AS impressions,
              AVG(kps.ctr) AS ctr, AVG(kps.average_position) AS average_position,
              MAX(kps.current_rank) AS current_rank, SUM(kps.rank_change) AS rank_change
       FROM keyword_performance_snapshots kps
       LEFT JOIN keywords k ON k.id = kps.keyword_id
       WHERE kps.client_id = $1 AND kps.snapshot_date >= CURRENT_DATE - $2
       GROUP BY kps.keyword_id, k.keyword, kps.page_url
       ORDER BY SUM(kps.clicks) DESC`,
      [req.params.id, days]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/:id/asset-performance
router.get("/:id/asset-performance", async (req, res) => {
  try {
    const days = Number(req.query.days) || 14;
    const assetType = req.query.asset_type as string | undefined;
    let query = `SELECT asset_type, asset_id, platform,
                        SUM(views) AS views, SUM(clicks) AS clicks,
                        SUM(engagements) AS engagements, SUM(shares) AS shares,
                        SUM(comments) AS comments, SUM(likes) AS likes, MAX(published_url) AS published_url
                 FROM asset_performance_snapshots
                 WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - $2`;
    const params: any[] = [req.params.id, days];
    if (assetType) {
      query += ` AND asset_type = $3`;
      params.push(assetType);
    }
    query += ` GROUP BY asset_type, asset_id, platform ORDER BY SUM(clicks) DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/:id/performance-insights
router.get("/:id/performance-insights", async (req, res) => {
  try {
    const status = (req.query.status as string) || "open";
    const { rows } = await pool.query(
      `SELECT * FROM performance_insights
       WHERE client_id = $1 AND ($2 = 'all' OR status = $2)
       ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`,
      [req.params.id, status]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /analytics/insights/:id — update insight status
router.patch("/insights/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      `UPDATE performance_insights SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/:id/performance-summary — aggregated dashboard metrics
router.get("/:id/performance-summary", async (req, res) => {
  try {
    const days = Number(req.query.days) || 14;
    const { rows: pageSummary } = await pool.query(
      `SELECT SUM(clicks) AS total_clicks, SUM(impressions) AS total_impressions,
              AVG(ctr) AS avg_ctr, AVG(average_position) AS avg_position,
              SUM(sessions) AS total_sessions
       FROM page_performance_snapshots
       WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - $2`,
      [req.params.id, days]
    );

    const { rows: topPages } = await pool.query(
      `SELECT page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions, AVG(ctr) AS ctr
       FROM page_performance_snapshots
       WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - $2
       GROUP BY page_url ORDER BY SUM(clicks) DESC LIMIT 5`,
      [req.params.id, days]
    );

    const { rows: topKeywords } = await pool.query(
      `SELECT k.keyword, SUM(kps.clicks) AS clicks, AVG(kps.average_position) AS position, SUM(kps.rank_change) AS rank_change
       FROM keyword_performance_snapshots kps
       LEFT JOIN keywords k ON k.id = kps.keyword_id
       WHERE kps.client_id = $1 AND kps.snapshot_date >= CURRENT_DATE - $2
       GROUP BY k.keyword ORDER BY SUM(kps.clicks) DESC LIMIT 10`,
      [req.params.id, days]
    );

    const { rows: insightCounts } = await pool.query(
      `SELECT insight_type, COUNT(*) AS count FROM performance_insights
       WHERE client_id = $1 AND status = 'open' GROUP BY insight_type`,
      [req.params.id]
    );

    res.json({
      summary: pageSummary[0] || { total_clicks: 0, total_impressions: 0, avg_ctr: 0, avg_position: 0, total_sessions: 0 },
      topPages,
      topKeywords,
      insightCounts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
