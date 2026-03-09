/**
 * Performance Feedback Loop Engine.
 * Converts performance snapshots into actionable insights.
 */
import pool from "../../db.js";

interface InsightCandidate {
  client_id: string;
  asset_type: string | null;
  asset_id: string | null;
  insight_type: string;
  priority: string;
  title: string;
  description: string;
  recommended_action: string;
}

export async function generatePerformanceInsights(clientId: string): Promise<number> {
  const insights: InsightCandidate[] = [];

  // Clear old open insights for this client
  await pool.query(
    `DELETE FROM performance_insights WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  // 1. Winning Content — pages with rising clicks (compare last 7d vs previous 7d)
  const { rows: winners } = await pool.query(
    `WITH recent AS (
       SELECT page_url, SUM(clicks) AS clicks, AVG(average_position) AS pos
       FROM page_performance_snapshots
       WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - 7
       GROUP BY page_url
     ), prev AS (
       SELECT page_url, SUM(clicks) AS clicks, AVG(average_position) AS pos
       FROM page_performance_snapshots
       WHERE client_id = $1 AND snapshot_date BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE - 8
       GROUP BY page_url
     )
     SELECT r.page_url, r.clicks AS recent_clicks, p.clicks AS prev_clicks,
            r.pos AS recent_pos, p.pos AS prev_pos
     FROM recent r JOIN prev p ON r.page_url = p.page_url
     WHERE r.clicks > p.clicks * 1.2 AND r.clicks > 5
     ORDER BY r.clicks - p.clicks DESC LIMIT 10`,
    [clientId]
  );
  for (const w of winners) {
    const pct = Math.round(((w.recent_clicks - w.prev_clicks) / Math.max(w.prev_clicks, 1)) * 100);
    insights.push({
      client_id: clientId, asset_type: "page", asset_id: null,
      insight_type: "winning_content", priority: pct > 50 ? "high" : "medium",
      title: `Rising page: ${w.page_url}`,
      description: `Clicks up ${pct}% (${w.prev_clicks} → ${w.recent_clicks}) over the last 7 days.`,
      recommended_action: "Double down: add internal links, expand content, and promote on social.",
    });
  }

  // 2. Declining Content
  const { rows: losers } = await pool.query(
    `WITH recent AS (
       SELECT page_url, SUM(clicks) AS clicks FROM page_performance_snapshots
       WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - 7 GROUP BY page_url
     ), prev AS (
       SELECT page_url, SUM(clicks) AS clicks FROM page_performance_snapshots
       WHERE client_id = $1 AND snapshot_date BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE - 8 GROUP BY page_url
     )
     SELECT r.page_url, r.clicks AS recent_clicks, p.clicks AS prev_clicks
     FROM recent r JOIN prev p ON r.page_url = p.page_url
     WHERE r.clicks < p.clicks * 0.7 AND p.clicks > 5
     ORDER BY p.clicks - r.clicks DESC LIMIT 10`,
    [clientId]
  );
  for (const l of losers) {
    const pct = Math.round(((l.prev_clicks - l.recent_clicks) / Math.max(l.prev_clicks, 1)) * 100);
    insights.push({
      client_id: clientId, asset_type: "page", asset_id: null,
      insight_type: "declining_content", priority: pct > 40 ? "high" : "medium",
      title: `Declining page: ${l.page_url}`,
      description: `Clicks down ${pct}% (${l.prev_clicks} → ${l.recent_clicks}) over the last 7 days.`,
      recommended_action: "Investigate: check for ranking drops, content freshness, or technical issues.",
    });
  }

  // 3. Low CTR Opportunities
  const { rows: lowCtr } = await pool.query(
    `SELECT page_url, SUM(impressions) AS impressions, AVG(ctr) AS avg_ctr, AVG(average_position) AS avg_pos
     FROM page_performance_snapshots
     WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - 14
     GROUP BY page_url
     HAVING SUM(impressions) > 50 AND AVG(ctr) < 0.02
     ORDER BY SUM(impressions) DESC LIMIT 10`,
    [clientId]
  );
  for (const r of lowCtr) {
    insights.push({
      client_id: clientId, asset_type: "page", asset_id: null,
      insight_type: "low_ctr", priority: r.impressions > 200 ? "high" : "medium",
      title: `Low CTR: ${r.page_url}`,
      description: `${r.impressions} impressions but only ${(r.avg_ctr * 100).toFixed(1)}% CTR (avg position ${Number(r.avg_pos).toFixed(1)}).`,
      recommended_action: "Improve title tag and meta description to boost click-through rate.",
    });
  }

  // 4. Refresh Candidates — published articles with declining performance over 30 days
  const { rows: refreshCandidates } = await pool.query(
    `WITH recent AS (
       SELECT asset_id, SUM(clicks) AS clicks FROM asset_performance_snapshots
       WHERE client_id = $1 AND asset_type = 'article' AND snapshot_date >= CURRENT_DATE - 14
       GROUP BY asset_id
     ), prev AS (
       SELECT asset_id, SUM(clicks) AS clicks FROM asset_performance_snapshots
       WHERE client_id = $1 AND asset_type = 'article' AND snapshot_date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE - 15
       GROUP BY asset_id
     )
     SELECT r.asset_id, r.clicks AS recent_clicks, p.clicks AS prev_clicks
     FROM recent r JOIN prev p ON r.asset_id = p.asset_id
     WHERE r.clicks < p.clicks * 0.6 AND p.clicks > 3
     LIMIT 10`,
    [clientId]
  );
  for (const r of refreshCandidates) {
    insights.push({
      client_id: clientId, asset_type: "article", asset_id: r.asset_id,
      insight_type: "refresh_candidate", priority: "medium",
      title: `Refresh candidate: article performance declining`,
      description: `Article clicks dropped from ${r.prev_clicks} to ${r.recent_clicks} over the last 30 days.`,
      recommended_action: "Update content with fresh information, add new sections, and republish.",
    });
  }

  // 5. Repurpose Opportunities — top performing articles not yet converted to social/video
  const { rows: repurposeCandidates } = await pool.query(
    `SELECT a.id, a.title, SUM(ap.clicks) AS total_clicks
     FROM seo_articles a
     JOIN asset_performance_snapshots ap ON ap.asset_id = a.id AND ap.asset_type = 'article'
     LEFT JOIN social_posts sp ON sp.article_id = a.id
     WHERE a.client_id = $1 AND ap.snapshot_date >= CURRENT_DATE - 14 AND sp.id IS NULL
     GROUP BY a.id, a.title
     HAVING SUM(ap.clicks) > 5
     ORDER BY SUM(ap.clicks) DESC LIMIT 5`,
    [clientId]
  );
  for (const r of repurposeCandidates) {
    insights.push({
      client_id: clientId, asset_type: "article", asset_id: r.id,
      insight_type: "repurpose_opportunity", priority: r.total_clicks > 20 ? "high" : "medium",
      title: `Repurpose: "${r.title}"`,
      description: `This article has ${r.total_clicks} clicks in 14 days but no social posts or videos created from it.`,
      recommended_action: "Generate social media posts and/or a video script from this high-performing article.",
    });
  }

  // 6. Content Expansion — pages ranking for multiple keywords with low average CTR
  const { rows: expansionCandidates } = await pool.query(
    `SELECT page_url, COUNT(DISTINCT keyword_id) AS kw_count, AVG(ctr) AS avg_ctr, AVG(average_position) AS avg_pos
     FROM keyword_performance_snapshots
     WHERE client_id = $1 AND snapshot_date >= CURRENT_DATE - 14 AND keyword_id IS NOT NULL
     GROUP BY page_url
     HAVING COUNT(DISTINCT keyword_id) >= 3 AND AVG(ctr) < 0.03
     ORDER BY COUNT(DISTINCT keyword_id) DESC LIMIT 5`,
    [clientId]
  );
  for (const r of expansionCandidates) {
    insights.push({
      client_id: clientId, asset_type: "page", asset_id: null,
      insight_type: "content_expansion", priority: r.kw_count >= 5 ? "high" : "medium",
      title: `Expand: ${r.page_url}`,
      description: `Ranks for ${r.kw_count} keywords with only ${(r.avg_ctr * 100).toFixed(1)}% avg CTR. Position ${Number(r.avg_pos).toFixed(1)}.`,
      recommended_action: "Expand content to better cover all ranking keywords. Consider splitting into dedicated pages.",
    });
  }

  // Insert all insights
  for (const ins of insights) {
    await pool.query(
      `INSERT INTO performance_insights (client_id, asset_type, asset_id, insight_type, priority, title, description, recommended_action)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ins.client_id, ins.asset_type, ins.asset_id, ins.insight_type, ins.priority, ins.title, ins.description, ins.recommended_action]
    );
  }

  return insights.length;
}
