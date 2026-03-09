// =============================================================================
// Phase 18: Command Center Aggregation Service
// =============================================================================

import pool from "../../db.js";
import { calculateScores, ScoringInput } from "./scoringEngine.js";

export interface CommandCenterSummary {
  totalPriorities: number;
  highPriorityCount: number;
  quickWinsCount: number;
  repurposeCount: number;
  decliningAssetsCount: number;
  nearPage1Count: number;
  gbpIssuesCount: number;
  adsOpportunitiesCount: number;
  weeklyTasksDue: number;
  weeklyTasksCompleted: number;
  topGrowthChannels: { channel: string; score: number }[];
  topUnderperformingChannels: { channel: string; score: number }[];
}

export interface MarketingPriority {
  id: string;
  clientId: string;
  priorityType: string;
  sourceModule: string;
  sourceId: string | null;
  title: string;
  description: string | null;
  recommendedAction: string | null;
  priorityScore: number;
  impactScore: number;
  effortScore: number;
  confidenceScore: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export interface CrossChannelRecommendation {
  id: string;
  clientId: string;
  recommendationType: string;
  sourceAssetType: string | null;
  sourceAssetId: string | null;
  targetChannel: string | null;
  title: string;
  description: string | null;
  recommendedAction: string | null;
  priority: string;
  status: string;
  metadata: any;
  createdAt: string;
}

// ====================================================================
// Aggregation: Compute priorities from all modules
// ====================================================================
export async function recomputePriorities(clientId: string): Promise<number> {
  let prioritiesGenerated = 0;

  // Clear old open/in_progress priorities (keep done/dismissed for history)
  await pool.query(
    `DELETE FROM marketing_priorities WHERE client_id = $1 AND status IN ('open', 'in_progress')`,
    [clientId]
  );

  // 1. SEO Opportunities → Priorities
  const { rows: seoOpps } = await pool.query(
    `SELECT id, type, keyword_id, target_url, current_position, recommended_action, priority
     FROM seo_opportunities WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  for (const opp of seoOpps) {
    const scoring = calculateScores({
      position: opp.current_position,
      impressions: 1000, // estimate
    });

    await pool.query(
      `INSERT INTO marketing_priorities
       (client_id, priority_type, source_module, source_id, title, description, recommended_action,
        priority_score, impact_score, effort_score, confidence_score)
       VALUES ($1, $2, 'seo_opportunities', $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        clientId,
        opp.type === 'technical_fix' ? 'technical' : 'seo',
        opp.id,
        `${opp.type.replace(/_/g, ' ')} opportunity`,
        `Target: ${opp.target_url || 'New page'}`,
        opp.recommended_action,
        scoring.priorityScore,
        scoring.impactScore,
        scoring.effortScore,
        scoring.confidenceScore,
      ]
    );
    prioritiesGenerated++;
  }

  // 2. Technical Audit Issues → Priorities
  const { rows: auditIssues } = await pool.query(
    `SELECT ai.id, ai.issue_type, ai.severity, ai.affected_url, ai.description, ai.fix_instruction
     FROM audit_issues ai
     JOIN audit_runs ar ON ar.id = ai.audit_run_id
     WHERE ar.client_id = $1 AND ai.status = 'open'
     ORDER BY CASE ai.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END
     LIMIT 20`,
    [clientId]
  );

  for (const issue of auditIssues) {
    const scoring = calculateScores({
      hasTechnicalIssue: true,
      technicalSeverity: issue.severity,
      requiresDeveloper: issue.severity === 'critical',
    });

    await pool.query(
      `INSERT INTO marketing_priorities
       (client_id, priority_type, source_module, source_id, title, description, recommended_action,
        priority_score, impact_score, effort_score, confidence_score)
       VALUES ($1, 'technical', 'technical_audit', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clientId,
        issue.id,
        `Fix ${issue.severity} issue: ${issue.issue_type}`,
        `Affected: ${issue.affected_url}. ${issue.description}`,
        issue.fix_instruction,
        scoring.priorityScore,
        scoring.impactScore,
        scoring.effortScore,
        scoring.confidenceScore,
      ]
    );
    prioritiesGenerated++;
  }

  // 3. Internal Link Suggestions → Priorities
  const { rows: linkSuggestions } = await pool.query(
    `SELECT id, from_url, to_url, anchor_text, reason, priority
     FROM internal_link_suggestions WHERE client_id = $1 AND status = 'pending'
     LIMIT 15`,
    [clientId]
  );

  for (const link of linkSuggestions) {
    const baseScore = link.priority === 'high' ? 70 : link.priority === 'medium' ? 50 : 30;
    await pool.query(
      `INSERT INTO marketing_priorities
       (client_id, priority_type, source_module, source_id, title, description, recommended_action,
        priority_score, impact_score, effort_score, confidence_score)
       VALUES ($1, 'internal_linking', 'internal_links', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clientId,
        link.id,
        `Add internal link: \"${link.anchor_text}\"`,
        `Link from ${link.from_url} to ${link.to_url}`,
        link.reason,
        baseScore,
        baseScore,
        20, // low effort
        80,
      ]
    );
    prioritiesGenerated++;
  }

  // 4. Content Suggestions → Priorities
  const { rows: contentSuggestions } = await pool.query(
    `SELECT id, cluster_name, keyword, suggested_slug, reason, priority
     FROM content_suggestions WHERE client_id = $1 AND status = 'pending'
     LIMIT 10`,
    [clientId]
  );

  for (const content of contentSuggestions) {
    const baseScore = content.priority === 'high' ? 65 : content.priority === 'medium' ? 45 : 25;
    await pool.query(
      `INSERT INTO marketing_priorities
       (client_id, priority_type, source_module, source_id, title, description, recommended_action,
        priority_score, impact_score, effort_score, confidence_score)
       VALUES ($1, 'content', 'content_plan', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clientId,
        content.id,
        `Create content for \"${content.keyword}\"`,
        `Cluster: ${content.cluster_name}. Suggested slug: ${content.suggested_slug || 'TBD'}`,
        content.reason,
        baseScore,
        baseScore,
        50, // medium effort
        70,
      ]
    );
    prioritiesGenerated++;
  }

  // 5. Local SEO Insights → Priorities
  const { rows: localInsights } = await pool.query(
    `SELECT id, insight_type, title, description, recommended_action, priority
     FROM local_seo_insights WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  for (const insight of localInsights) {
    const baseScore = insight.priority === 'high' ? 75 : insight.priority === 'medium' ? 50 : 30;
    await pool.query(
      `INSERT INTO marketing_priorities
       (client_id, priority_type, source_module, source_id, title, description, recommended_action,
        priority_score, impact_score, effort_score, confidence_score)
       VALUES ($1, 'gbp', 'gbp', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clientId,
        insight.id,
        insight.title,
        insight.description,
        insight.recommended_action,
        baseScore,
        baseScore,
        30,
        75,
      ]
    );
    prioritiesGenerated++;
  }

  // 6. Ads Insights → Priorities
  const { rows: adsInsights } = await pool.query(
    `SELECT id, insight_type, title, description, recommended_action, priority
     FROM ads_insights WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  for (const insight of adsInsights) {
    const baseScore = insight.priority === 'high' ? 70 : insight.priority === 'medium' ? 45 : 25;
    await pool.query(
      `INSERT INTO marketing_priorities
       (client_id, priority_type, source_module, source_id, title, description, recommended_action,
        priority_score, impact_score, effort_score, confidence_score)
       VALUES ($1, 'paid_ads', 'google_ads', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clientId,
        insight.id,
        insight.title,
        insight.description,
        insight.recommended_action,
        baseScore,
        baseScore,
        35,
        70,
      ]
    );
    prioritiesGenerated++;
  }

  // 7. Performance Insights → Priorities
  const { rows: perfInsights } = await pool.query(
    `SELECT id, insight_type, title, description, recommended_action, priority
     FROM performance_insights WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  for (const insight of perfInsights) {
    const priorityType = insight.insight_type.includes('content') ? 'content' : 'analytics';
    const baseScore = insight.priority === 'high' ? 65 : insight.priority === 'medium' ? 45 : 25;
    await pool.query(
      `INSERT INTO marketing_priorities
       (client_id, priority_type, source_module, source_id, title, description, recommended_action,
        priority_score, impact_score, effort_score, confidence_score)
       VALUES ($1, $2, 'analytics', $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        clientId,
        priorityType,
        insight.id,
        insight.title,
        insight.description,
        insight.recommended_action,
        baseScore,
        baseScore,
        40,
        70,
      ]
    );
    prioritiesGenerated++;
  }

  return prioritiesGenerated;
}

// ====================================================================
// Cross-Channel Recommendations
// ====================================================================
export async function generateCrossChannelRecommendations(clientId: string): Promise<number> {
  let recsGenerated = 0;

  // Clear old open recommendations
  await pool.query(
    `DELETE FROM cross_channel_recommendations WHERE client_id = $1 AND status IN ('open', 'reviewed')`,
    [clientId]
  );

  // 1. Repurpose approved articles to social
  const { rows: approvedArticles } = await pool.query(
    `SELECT a.id, a.title, a.target_keyword
     FROM seo_articles a
     LEFT JOIN social_posts sp ON sp.article_id = a.id
     WHERE a.client_id = $1 AND a.status IN ('approved', 'published')
     GROUP BY a.id HAVING COUNT(sp.id) < 3
     LIMIT 5`,
    [clientId]
  );

  for (const article of approvedArticles) {
    for (const channel of ['facebook', 'instagram', 'linkedin']) {
      await pool.query(
        `INSERT INTO cross_channel_recommendations
         (client_id, recommendation_type, source_asset_type, source_asset_id, target_channel,
          title, description, recommended_action, priority)
         VALUES ($1, 'repurpose_article_to_social', 'article', $2, $3, $4, $5, $6, 'medium')`,
        [
          clientId,
          article.id,
          channel,
          `Repurpose \"${article.title}\" to ${channel}`,
          `This approved article about \"${article.target_keyword}\" can be repurposed for ${channel} to extend reach.`,
          `Generate ${channel} post from article content`,
        ]
      );
      recsGenerated++;
    }
  }

  // 2. Repurpose articles to video
  const { rows: videoReadyArticles } = await pool.query(
    `SELECT a.id, a.title, a.target_keyword
     FROM seo_articles a
     LEFT JOIN video_assets va ON va.article_id = a.id
     WHERE a.client_id = $1 AND a.status IN ('approved', 'published')
     AND va.id IS NULL
     LIMIT 3`,
    [clientId]
  );

  for (const article of videoReadyArticles) {
    await pool.query(
      `INSERT INTO cross_channel_recommendations
       (client_id, recommendation_type, source_asset_type, source_asset_id, target_channel,
        title, description, recommended_action, priority)
       VALUES ($1, 'repurpose_article_to_video', 'article', $2, 'youtube_shorts', $3, $4, $5, 'medium')`,
      [
        clientId,
        article.id,
        `Turn \"${article.title}\" into video`,
        `Create a short-form video from this article about \"${article.target_keyword}\" for TikTok/Reels/Shorts.`,
        `Generate video script and avatar video`,
      ]
    );
    recsGenerated++;
  }

  // 3. Boost top organic pages with ads
  const { rows: topPages } = await pool.query(
    `SELECT page_url, SUM(clicks) as total_clicks, AVG(position) as avg_position
     FROM page_performance_snapshots WHERE client_id = $1
     AND snapshot_date >= NOW() - INTERVAL '14 days'
     GROUP BY page_url
     HAVING AVG(position) <= 5 AND SUM(clicks) > 50
     ORDER BY total_clicks DESC
     LIMIT 3`,
    [clientId]
  );

  for (const page of topPages) {
    await pool.query(
      `INSERT INTO cross_channel_recommendations
       (client_id, recommendation_type, source_asset_type, source_asset_id, target_channel,
        title, description, recommended_action, priority, metadata_json)
       VALUES ($1, 'boost_page_with_ads', 'page', NULL, 'google_ads', $2, $3, $4, 'high', $5)`,
      [
        clientId,
        `Boost high-performing page with Google Ads`,
        `Page ${page.page_url} is ranking #${Math.round(page.avg_position)} with ${page.total_clicks} clicks. Amplify with paid ads.`,
        `Create search ad campaign targeting this landing page`,
        JSON.stringify({ pageUrl: page.page_url, clicks: page.total_clicks }),
      ]
    );
    recsGenerated++;
  }

  // 4. Refresh declining content
  const { rows: decliningPages } = await pool.query(
    `WITH recent AS (
       SELECT page_url, AVG(clicks) as recent_clicks
       FROM page_performance_snapshots WHERE client_id = $1
       AND snapshot_date >= NOW() - INTERVAL '7 days'
       GROUP BY page_url
     ),
     older AS (
       SELECT page_url, AVG(clicks) as older_clicks
       FROM page_performance_snapshots WHERE client_id = $1
       AND snapshot_date >= NOW() - INTERVAL '30 days'
       AND snapshot_date < NOW() - INTERVAL '7 days'
       GROUP BY page_url
     )
     SELECT r.page_url, r.recent_clicks, o.older_clicks
     FROM recent r JOIN older o ON r.page_url = o.page_url
     WHERE o.older_clicks > 10 AND r.recent_clicks < o.older_clicks * 0.7
     LIMIT 3`,
    [clientId]
  );

  for (const page of decliningPages) {
    await pool.query(
      `INSERT INTO cross_channel_recommendations
       (client_id, recommendation_type, source_asset_type, source_asset_id, target_channel,
        title, description, recommended_action, priority, metadata_json)
       VALUES ($1, 'refresh_article', 'page', NULL, 'website', $2, $3, $4, 'high', $5)`,
      [
        clientId,
        `Refresh declining content: ${page.page_url}`,
        `This page dropped from ${Math.round(page.older_clicks)} to ${Math.round(page.recent_clicks)} clicks. Needs content refresh.`,
        `Update content with fresh information, add new sections, optimize for current search intent`,
        JSON.stringify({ pageUrl: page.page_url }),
      ]
    );
    recsGenerated++;
  }

  // 5. Reviews needing response
  const { rows: unansweredReviews } = await pool.query(
    `SELECT COUNT(*) as cnt FROM gbp_review_items
     WHERE client_id = $1 AND response_status = 'unreviewed'`,
    [clientId]
  );

  if (unansweredReviews[0]?.cnt > 0) {
    await pool.query(
      `INSERT INTO cross_channel_recommendations
       (client_id, recommendation_type, source_asset_type, source_asset_id, target_channel,
        title, description, recommended_action, priority)
       VALUES ($1, 'respond_to_reviews', 'review', NULL, 'gbp', $2, $3, $4, 'high')`,
      [
        clientId,
        `Respond to ${unansweredReviews[0].cnt} unanswered reviews`,
        `You have ${unansweredReviews[0].cnt} Google reviews without responses. Responding improves local SEO and customer trust.`,
        `Generate AI response drafts and approve them`,
      ]
    );
    recsGenerated++;
  }

  return recsGenerated;
}

// ====================================================================
// Weekly Plan Generation
// ====================================================================
export async function generateWeeklyPlan(clientId: string): Promise<string> {
  // Get start of current week (Monday)
  const weekStart = getWeekStart(new Date());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Check if plan already exists
  const { rows: existing } = await pool.query(
    `SELECT id FROM weekly_action_plans WHERE client_id = $1 AND week_start = $2`,
    [clientId, weekStartStr]
  );

  let planId: string;

  if (existing.length > 0) {
    planId = existing[0].id;
    // Clear old items for regeneration
    await pool.query(`DELETE FROM weekly_action_items WHERE plan_id = $1`, [planId]);
  } else {
    // Create new plan
    const { rows } = await pool.query(
      `INSERT INTO weekly_action_plans (client_id, week_start, summary, status)
       VALUES ($1, $2, $3, 'draft') RETURNING id`,
      [clientId, weekStartStr, `Weekly action plan for week of ${weekStartStr}`]
    );
    planId = rows[0].id;
  }

  // Get top priorities
  const { rows: topPriorities } = await pool.query(
    `SELECT id, priority_type, title, description, recommended_action, priority_score, effort_score
     FROM marketing_priorities
     WHERE client_id = $1 AND status = 'open'
     ORDER BY priority_score DESC
     LIMIT 15`,
    [clientId]
  );

  // Map priority types to owner types
  const ownerMap: Record<string, string> = {
    seo: 'seo',
    content: 'content',
    technical: 'developer',
    internal_linking: 'seo',
    social: 'content',
    video: 'content',
    gbp: 'seo',
    paid_ads: 'ads',
    analytics: 'seo',
    repurpose: 'content',
    refresh: 'content',
    landing_page: 'developer',
  };

  for (const priority of topPriorities) {
    const ownerType = ownerMap[priority.priority_type] || 'seo';
    await pool.query(
      `INSERT INTO weekly_action_items
       (plan_id, priority_id, channel, task_title, task_description, owner_type, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        planId,
        priority.id,
        priority.priority_type,
        priority.title,
        priority.recommended_action || priority.description,
        ownerType,
        getWeekEnd(weekStart).toISOString().split('T')[0],
      ]
    );
  }

  // Update plan summary
  const tasksByOwner = await pool.query(
    `SELECT owner_type, COUNT(*) as cnt
     FROM weekly_action_items WHERE plan_id = $1
     GROUP BY owner_type`,
    [planId]
  );

  const ownerSummary = tasksByOwner.rows
    .map((r: any) => `${r.owner_type}: ${r.cnt}`)
    .join(', ');

  await pool.query(
    `UPDATE weekly_action_plans
     SET summary = $1, top_goal = 'Complete top priority marketing tasks', updated_at = NOW()
     WHERE id = $2`,
    [`${topPriorities.length} tasks assigned (${ownerSummary})`, planId]
  );

  return planId;
}

// ====================================================================
// Summary for Command Center Dashboard
// ====================================================================
export async function getCommandCenterSummary(clientId: string): Promise<CommandCenterSummary> {
  // Priorities counts
  const { rows: priorityCounts } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'open') as total,
       COUNT(*) FILTER (WHERE status = 'open' AND priority_score >= 70) as high_priority,
       COUNT(*) FILTER (WHERE status = 'open' AND effort_score <= 30) as quick_wins
     FROM marketing_priorities WHERE client_id = $1`,
    [clientId]
  );

  // Cross-channel counts
  const { rows: crossCounts } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE recommendation_type LIKE 'repurpose%') as repurpose,
       COUNT(*) FILTER (WHERE recommendation_type = 'refresh_article') as declining
     FROM cross_channel_recommendations WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  // Near page 1 keywords
  const { rows: nearPage1 } = await pool.query(
    `SELECT COUNT(*) as cnt FROM seo_opportunities
     WHERE client_id = $1 AND type = 'near_win' AND status = 'open'`,
    [clientId]
  );

  // GBP issues
  const { rows: gbpIssues } = await pool.query(
    `SELECT COUNT(*) as cnt FROM local_seo_insights
     WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  // Ads opportunities
  const { rows: adsOpps } = await pool.query(
    `SELECT COUNT(*) as cnt FROM ads_insights
     WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  // Weekly tasks
  const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];
  const { rows: weeklyTasks } = await pool.query(
    `SELECT
       COUNT(*) as due,
       COUNT(*) FILTER (WHERE wi.status = 'done') as completed
     FROM weekly_action_items wi
     JOIN weekly_action_plans wp ON wp.id = wi.plan_id
     WHERE wp.client_id = $1 AND wp.week_start = $2`,
    [clientId, weekStart]
  );

  // Channel performance (simplified)
  const topGrowthChannels = [
    { channel: 'organic', score: 75 },
    { channel: 'local', score: 60 },
  ];
  const topUnderperformingChannels = [
    { channel: 'paid', score: 35 },
    { channel: 'social', score: 40 },
  ];

  return {
    totalPriorities: parseInt(priorityCounts[0]?.total || '0'),
    highPriorityCount: parseInt(priorityCounts[0]?.high_priority || '0'),
    quickWinsCount: parseInt(priorityCounts[0]?.quick_wins || '0'),
    repurposeCount: parseInt(crossCounts[0]?.repurpose || '0'),
    decliningAssetsCount: parseInt(crossCounts[0]?.declining || '0'),
    nearPage1Count: parseInt(nearPage1[0]?.cnt || '0'),
    gbpIssuesCount: parseInt(gbpIssues[0]?.cnt || '0'),
    adsOpportunitiesCount: parseInt(adsOpps[0]?.cnt || '0'),
    weeklyTasksDue: parseInt(weeklyTasks[0]?.due || '0'),
    weeklyTasksCompleted: parseInt(weeklyTasks[0]?.completed || '0'),
    topGrowthChannels,
    topUnderperformingChannels,
  };
}

// ====================================================================
// Helpers
// ====================================================================
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6); // Sunday
  return end;
}
