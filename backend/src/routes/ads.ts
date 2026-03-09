import { Router, Request, Response } from "express";
import pool from "../db.js";
import { generateAdsRecommendations, generateAdsInsights, syncCampaigns, syncCampaignPerformance } from "../services/ads/googleAdsService.js";
import { generateAdCopy } from "../services/ads/adCopyGenerator.js";

const router = Router();

// ---- Connections ----
router.post("/connect", async (req: Request, res: Response) => {
  try {
    const { client_id, customer_id, manager_customer_id, account_name, currency_code, time_zone, access_token, refresh_token } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO google_ads_connections (client_id, customer_id, manager_customer_id, account_name, currency_code, time_zone, access_token, refresh_token, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'connected') ON CONFLICT DO NOTHING RETURNING *`,
      [client_id, customer_id, manager_customer_id, account_name, currency_code || 'SGD', time_zone || 'Asia/Singapore', access_token, refresh_token]
    );
    res.json(rows[0] || { message: "Connection already exists" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/ads-connections", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, client_id, customer_id, account_name, currency_code, status, created_at FROM google_ads_connections WHERE client_id = $1 ORDER BY created_at DESC`, [req.params.id]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id/disconnect", async (req: Request, res: Response) => {
  try {
    await pool.query(`UPDATE google_ads_connections SET status='disconnected', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---- Recommendations ----
router.post("/recommendations/generate", async (req: Request, res: Response) => {
  try {
    const count = await generateAdsRecommendations(req.body.client_id);
    res.json({ success: true, count });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/ads-recommendations", async (req: Request, res: Response) => {
  try {
    const status = req.query.status || "open";
    const { rows } = await pool.query(
      `SELECT * FROM ads_recommendations WHERE client_id=$1 AND status=$2 ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`,
      [req.params.id, status]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/recommendations/:id", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(`UPDATE ads_recommendations SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id, status]);
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---- Ad Copy ----
router.post("/copy/generate", async (req: Request, res: Response) => {
  try {
    const draft = await generateAdCopy(req.body);
    res.json(draft);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/ads-copy", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ads_copy_drafts WHERE client_id=$1 ORDER BY created_at DESC`, [req.params.id]);
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/copy/:id", async (req: Request, res: Response) => {
  try {
    const { headline_1, headline_2, headline_3, description_1, description_2, final_url, path_1, path_2 } = req.body;
    const { rows } = await pool.query(
      `UPDATE ads_copy_drafts SET headline_1=COALESCE($2,headline_1), headline_2=COALESCE($3,headline_2), headline_3=COALESCE($4,headline_3), description_1=COALESCE($5,description_1), description_2=COALESCE($6,description_2), final_url=COALESCE($7,final_url), path_1=COALESCE($8,path_1), path_2=COALESCE($9,path_2), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, headline_1, headline_2, headline_3, description_1, description_2, final_url, path_1, path_2]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/copy/:id/approve", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`UPDATE ads_copy_drafts SET status='approved', updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---- Campaigns ----
router.post("/campaigns/create", async (req: Request, res: Response) => {
  try {
    const { client_id, name, campaign_type, budget_daily, bidding_strategy, location_targets, language_targets, start_date, end_date } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO ads_campaigns (client_id, name, campaign_type, budget_daily, bidding_strategy, location_targets, language_targets, start_date, end_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft') RETURNING *`,
      [client_id, name, campaign_type || 'search', budget_daily, bidding_strategy, JSON.stringify(location_targets || ['Singapore']), JSON.stringify(language_targets || ['en']), start_date, end_date]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/ads-campaigns", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ads_campaigns WHERE client_id=$1 ORDER BY created_at DESC`, [req.params.id]);
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---- Insights ----
router.get("/:id/ads-insights", async (req: Request, res: Response) => {
  try {
    const status = req.query.status || "open";
    const { rows } = await pool.query(
      `SELECT * FROM ads_insights WHERE client_id=$1 AND status=$2 ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`, [req.params.id, status]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---- Sync ----
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const { client_id } = req.body;
    const { rows: conns } = await pool.query(`SELECT * FROM google_ads_connections WHERE client_id=$1 AND status='connected'`, [client_id]);
    if (conns.length === 0) return res.status(404).json({ error: "No connected Google Ads account" });

    const conn = conns[0];
    const campaigns = await syncCampaigns({ accessToken: conn.access_token, refreshToken: conn.refresh_token, customerId: conn.customer_id, managerCustomerId: conn.manager_customer_id });

    // Generate insights
    const insightCount = await generateAdsInsights(client_id);
    res.json({ success: true, campaigns_synced: campaigns.length, insights_generated: insightCount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---- Performance ----
router.get("/:id/ads-performance", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 14;
    const { rows: campaignPerf } = await pool.query(
      `SELECT cp.*, c.name as campaign_name FROM ads_campaign_performance_snapshots cp
       JOIN ads_campaigns c ON c.id = cp.campaign_id
       WHERE cp.client_id = $1 AND cp.snapshot_date >= CURRENT_DATE - $2
       ORDER BY cp.cost DESC`,
      [req.params.id, days]
    );

    const { rows: summary } = await pool.query(
      `SELECT COALESCE(SUM(impressions),0) as total_impressions, COALESCE(SUM(clicks),0) as total_clicks,
              CASE WHEN SUM(impressions)>0 THEN SUM(clicks)::numeric/SUM(impressions) ELSE 0 END as avg_ctr,
              CASE WHEN SUM(clicks)>0 THEN SUM(cost)/SUM(clicks) ELSE 0 END as avg_cpc,
              COALESCE(SUM(cost),0) as total_cost, COALESCE(SUM(conversions),0) as total_conversions,
              CASE WHEN SUM(conversions)>0 THEN SUM(cost)/SUM(conversions) ELSE 0 END as cost_per_conversion
       FROM ads_campaign_performance_snapshots WHERE client_id=$1 AND snapshot_date >= CURRENT_DATE - $2`,
      [req.params.id, days]
    );

    res.json({ summary: summary[0], campaigns: campaignPerf });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
