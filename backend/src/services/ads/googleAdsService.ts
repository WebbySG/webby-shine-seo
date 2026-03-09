/**
 * Google Ads Service — provider-ready abstraction.
 * Currently placeholder; swap in real Google Ads API when OAuth is configured.
 */
import pool from "../../db.js";

interface GoogleAdsCredentials {
  accessToken: string;
  refreshToken: string | null;
  customerId: string;
  managerCustomerId?: string;
}

// ---------- Campaign Sync ----------
export async function syncCampaigns(creds: GoogleAdsCredentials): Promise<any[]> {
  // TODO: Replace with real Google Ads API call
  console.log(`[GoogleAds] Syncing campaigns for customer ${creds.customerId} (placeholder)`);
  return [];
}

export async function syncCampaignPerformance(creds: GoogleAdsCredentials, campaignId: string): Promise<any> {
  console.log(`[GoogleAds] Syncing performance for campaign ${campaignId} (placeholder)`);
  return { impressions: 0, clicks: 0, ctr: 0, avgCpc: 0, cost: 0, conversions: 0 };
}

// ---------- Campaign Creation ----------
export async function createCampaign(creds: GoogleAdsCredentials, campaign: any): Promise<{ externalCampaignId: string }> {
  console.log(`[GoogleAds] Creating campaign "${campaign.name}" (placeholder)`);
  return { externalCampaignId: `gads_${Date.now()}` };
}

// ---------- Recommendation Generation ----------
export async function generateAdsRecommendations(clientId: string): Promise<number> {
  await pool.query(`DELETE FROM ads_recommendations WHERE client_id = $1 AND status = 'open'`, [clientId]);

  const recs: { type: string; campaign?: string; adGroup?: string; keyword?: string; landingPage?: string; budget?: number; action: string; priority: string; meta?: any }[] = [];

  // Get SEO keywords for campaign suggestions
  const { rows: seoKws } = await pool.query(
    `SELECT k.keyword, k.cluster, k.target_url, rs.position
     FROM keywords k
     LEFT JOIN LATERAL (SELECT position FROM rank_snapshots WHERE keyword_id = k.id ORDER BY snapshot_date DESC LIMIT 1) rs ON true
     WHERE k.client_id = $1 AND k.is_active ORDER BY rs.position NULLS LAST LIMIT 50`,
    [clientId]
  );

  // Group by cluster for campaign suggestions
  const clusters = new Map<string, typeof seoKws>();
  for (const kw of seoKws) {
    const c = kw.cluster || "General";
    clusters.set(c, [...(clusters.get(c) || []), kw]);
  }

  for (const [cluster, keywords] of clusters) {
    recs.push({ type: "campaign", campaign: `${cluster} - Search`, action: `Create search campaign for "${cluster}" with ${keywords.length} keywords.`, priority: keywords.length >= 5 ? "high" : "medium" });

    // Ad group per sub-topic
    recs.push({ type: "ad_group", campaign: `${cluster} - Search`, adGroup: cluster, action: `Create ad group "${cluster}" with clustered keywords.`, priority: "medium" });

    // Keywords
    for (const kw of keywords.slice(0, 5)) {
      const matchType = kw.position && kw.position <= 10 ? "exact" : kw.position && kw.position <= 30 ? "phrase" : "broad";
      recs.push({ type: "keyword", campaign: `${cluster} - Search`, adGroup: cluster, keyword: kw.keyword, action: `Add "${kw.keyword}" as ${matchType} match.`, priority: kw.position && kw.position <= 20 ? "high" : "medium", meta: { match_type: matchType } });

      if (kw.target_url) {
        recs.push({ type: "landing_page", keyword: kw.keyword, landingPage: kw.target_url, action: `Map "${kw.keyword}" to ${kw.target_url}`, priority: "medium" });
      }
    }

    // Budget
    recs.push({ type: "budget", campaign: `${cluster} - Search`, budget: keywords.length >= 5 ? 30 : 15, action: `Start with SGD ${keywords.length >= 5 ? 30 : 15}/day for "${cluster}" campaign.`, priority: "medium" });
  }

  // Negative keywords
  const commonNegatives = ["free", "cheap", "diy", "tutorial", "sample", "template", "example", "download"];
  for (const neg of commonNegatives) {
    recs.push({ type: "negative_keyword", keyword: neg, action: `Add "${neg}" as campaign-level negative keyword.`, priority: "low" });
  }

  for (const r of recs) {
    await pool.query(
      `INSERT INTO ads_recommendations (client_id, recommendation_type, campaign_name, ad_group_name, keyword_text, landing_page_url, recommended_budget, recommended_action, priority, metadata_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [clientId, r.type, r.campaign || null, r.adGroup || null, r.keyword || null, r.landingPage || null, r.budget || null, r.action, r.priority, JSON.stringify(r.meta || {})]
    );
  }

  return recs.length;
}

// ---------- Ads Insight Engine ----------
export async function generateAdsInsights(clientId: string): Promise<number> {
  await pool.query(`DELETE FROM ads_insights WHERE client_id = $1 AND status = 'open'`, [clientId]);

  const insights: { type: string; campaignId?: string; title: string; desc: string; action: string; priority: string }[] = [];

  // Check campaign performance
  const { rows: campPerf } = await pool.query(
    `SELECT cp.*, c.name as campaign_name FROM ads_campaign_performance_snapshots cp
     JOIN ads_campaigns c ON c.id = cp.campaign_id
     WHERE cp.client_id = $1 AND cp.snapshot_date >= CURRENT_DATE - 7
     ORDER BY cp.cost DESC`, [clientId]
  );

  for (const p of campPerf) {
    if (p.cost > 50 && p.conversions < 1) {
      insights.push({ type: "high_spend_low_conversion", campaignId: p.campaign_id, title: `High spend, low conversions: ${p.campaign_name}`, desc: `Spent $${p.cost} with ${p.conversions} conversions this week.`, action: "Review keyword targeting and landing pages.", priority: "high" });
    }
    if (p.ctr > 0.05 && p.conversions < 1) {
      insights.push({ type: "high_ctr_low_conversion", campaignId: p.campaign_id, title: `Good CTR but low conversions: ${p.campaign_name}`, desc: `CTR is ${(p.ctr * 100).toFixed(1)}% but conversions are low.`, action: "Review landing page experience and offer.", priority: "high" });
    }
    if (p.conversions > 3 && p.cost_per_conversion < 20) {
      insights.push({ type: "budget_increase_opportunity", campaignId: p.campaign_id, title: `Scale opportunity: ${p.campaign_name}`, desc: `Good CPA of $${p.cost_per_conversion}. Consider increasing budget.`, action: "Increase daily budget by 20-30%.", priority: "medium" });
    }
  }

  // Check keyword quality scores
  const { rows: lowQs } = await pool.query(
    `SELECT k.keyword_text, k.quality_score, ag.name as ad_group_name
     FROM ads_keywords k JOIN ads_ad_groups ag ON ag.id = k.ad_group_id
     WHERE k.client_id = $1 AND k.quality_score IS NOT NULL AND k.quality_score < 5`, [clientId]
  );
  if (lowQs.length > 0) {
    insights.push({ type: "ad_copy_refresh_needed", title: `${lowQs.length} keywords with low quality scores`, desc: `Keywords like "${lowQs[0]?.keyword_text}" have quality scores below 5.`, action: "Improve ad relevance and landing page experience.", priority: "medium" });
  }

  for (const i of insights) {
    await pool.query(
      `INSERT INTO ads_insights (client_id, campaign_id, insight_type, priority, title, description, recommended_action)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [clientId, i.campaignId || null, i.type, i.priority, i.title, i.desc, i.action]
    );
  }

  return insights.length;
}
