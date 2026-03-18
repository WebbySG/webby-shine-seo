import pool from "../../db.js";
import crypto from "crypto";

// ---- Templates ----
export async function getReportTemplates(workspaceId?: string) {
  const { rows } = await pool.query(
    `SELECT * FROM report_templates WHERE status = 'active' AND (workspace_id IS NULL OR workspace_id = $1) ORDER BY is_default DESC, name`,
    [workspaceId || null]
  );
  return rows;
}

export async function getReportTemplate(id: string) {
  const { rows } = await pool.query(`SELECT * FROM report_templates WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createReportTemplate(data: any) {
  const { rows: [t] } = await pool.query(
    `INSERT INTO report_templates (workspace_id, name, template_type, description, sections) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.workspace_id || null, data.name, data.template_type, data.description || null, JSON.stringify(data.sections || [])]
  );
  return t;
}

// ---- Scheduled Reports ----
export async function getScheduledReports(workspaceId: string) {
  const { rows } = await pool.query(
    `SELECT sr.*, c.name as client_name, rt.name as template_name
     FROM scheduled_reports sr
     LEFT JOIN clients c ON c.id = sr.client_id
     LEFT JOIN report_templates rt ON rt.id = sr.template_id
     WHERE sr.workspace_id = $1 ORDER BY sr.created_at DESC`,
    [workspaceId]
  );
  return rows;
}

export async function createScheduledReport(data: any) {
  const nextRun = computeNextRun(data.schedule_type, data.day_of_month);
  const { rows: [s] } = await pool.query(
    `INSERT INTO scheduled_reports (workspace_id, client_id, template_id, schedule_type, day_of_month, recipients, include_branding, next_run_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.workspace_id, data.client_id, data.template_id, data.schedule_type || 'monthly', data.day_of_month || 1, JSON.stringify(data.recipients || []), data.include_branding ?? true, nextRun]
  );
  return s;
}

export async function updateScheduledReport(id: string, data: any) {
  const nextRun = computeNextRun(data.schedule_type, data.day_of_month);
  const { rows: [s] } = await pool.query(
    `UPDATE scheduled_reports SET schedule_type = COALESCE($2, schedule_type), day_of_month = COALESCE($3, day_of_month),
     recipients = COALESCE($4, recipients), status = COALESCE($5, status), next_run_at = $6, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, data.schedule_type, data.day_of_month, data.recipients ? JSON.stringify(data.recipients) : null, data.status, nextRun]
  );
  return s;
}

export async function deleteScheduledReport(id: string) {
  await pool.query(`DELETE FROM scheduled_reports WHERE id = $1`, [id]);
  return { deleted: true };
}

// ---- Report Runs ----
export async function getReportRuns(clientId: string) {
  const { rows } = await pool.query(
    `SELECT rr.*, rt.name as template_name FROM report_runs rr
     LEFT JOIN report_templates rt ON rt.id = rr.template_id
     WHERE rr.client_id = $1 ORDER BY rr.created_at DESC LIMIT 50`,
    [clientId]
  );
  return rows;
}

export async function getReportByShareToken(token: string) {
  const { rows } = await pool.query(
    `SELECT rr.*, rt.name as template_name, c.name as client_name, c.domain as client_domain,
            wb.brand_name, wb.logo_url, wb.primary_color, wb.secondary_color
     FROM report_runs rr
     LEFT JOIN report_templates rt ON rt.id = rr.template_id
     LEFT JOIN clients c ON c.id = rr.client_id
     LEFT JOIN workspace_branding wb ON wb.workspace_id = rr.workspace_id
     WHERE rr.share_token = $1 AND rr.status = 'completed'`,
    [token]
  );
  return rows[0] || null;
}

export async function generateReport(data: { workspace_id: string; client_id: string; template_id: string; date_from: string; date_to: string; }) {
  const shareToken = crypto.randomBytes(24).toString("hex");

  const { rows: [run] } = await pool.query(
    `INSERT INTO report_runs (workspace_id, client_id, template_id, date_from, date_to, share_token, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'generating') RETURNING *`,
    [data.workspace_id, data.client_id, data.template_id, data.date_from, data.date_to, shareToken]
  );

  try {
    const template = await getReportTemplate(data.template_id);
    const sections = template?.sections || [];
    const sectionsData: Record<string, any> = {};

    for (const section of sections) {
      if (!section.enabled) continue;
      sectionsData[section.key] = await buildSection(section.key, data.client_id, data.date_from, data.date_to);
    }

    const summary = buildSummary(sectionsData);

    await pool.query(
      `UPDATE report_runs SET sections_data = $2, summary = $3, status = 'completed', generated_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [run.id, JSON.stringify(sectionsData), summary]
    );

    return { ...run, sections_data: sectionsData, summary, status: 'completed', share_token: shareToken };
  } catch (error: any) {
    await pool.query(
      `UPDATE report_runs SET status = 'failed', error_message = $2, updated_at = NOW() WHERE id = $1`,
      [run.id, error.message]
    );
    throw error;
  }
}

// ---- Section Builders ----
async function buildSection(key: string, clientId: string, dateFrom: string, dateTo: string) {
  switch (key) {
    case "keyword_movement": return buildKeywordMovement(clientId, dateFrom, dateTo);
    case "top_gainers_losers": return buildGainersLosers(clientId, dateFrom, dateTo);
    case "technical_fixes": return buildTechnicalFixes(clientId, dateFrom, dateTo);
    case "content_published": return buildContentPublished(clientId, dateFrom, dateTo);
    case "gbp_activity": return buildGbpActivity(clientId, dateFrom, dateTo);
    case "analytics_performance": return buildAnalyticsPerformance(clientId, dateFrom, dateTo);
    case "leads_crm_summary": return buildCrmSummary(clientId, dateFrom, dateTo);
    case "ads_summary": return buildAdsSummary(clientId, dateFrom, dateTo);
    case "next_priorities": return buildNextPriorities(clientId);
    default: return { note: "Section not available" };
  }
}

async function buildKeywordMovement(clientId: string, dateFrom: string, dateTo: string) {
  const { rows } = await pool.query(
    `SELECT k.keyword,
            (SELECT position FROM rank_snapshots WHERE keyword_id = k.id AND domain = c.domain ORDER BY snapshot_date DESC LIMIT 1) as current_pos,
            (SELECT position FROM rank_snapshots WHERE keyword_id = k.id AND domain = c.domain AND snapshot_date <= $2 ORDER BY snapshot_date DESC LIMIT 1) as start_pos
     FROM keywords k JOIN clients c ON c.id = k.client_id
     WHERE k.client_id = $1 AND k.is_active ORDER BY k.keyword LIMIT 50`,
    [clientId, dateFrom]
  );
  return {
    keywords: rows.map(r => ({
      keyword: r.keyword,
      current: r.current_pos,
      start: r.start_pos,
      change: r.start_pos && r.current_pos ? r.start_pos - r.current_pos : null,
    })),
    total_tracked: rows.length,
    improved: rows.filter(r => r.start_pos && r.current_pos && r.current_pos < r.start_pos).length,
    declined: rows.filter(r => r.start_pos && r.current_pos && r.current_pos > r.start_pos).length,
  };
}

async function buildGainersLosers(clientId: string, dateFrom: string, dateTo: string) {
  const { rows } = await pool.query(
    `SELECT k.keyword,
            (SELECT position FROM rank_snapshots WHERE keyword_id = k.id AND domain = c.domain ORDER BY snapshot_date DESC LIMIT 1) as current_pos,
            (SELECT position FROM rank_snapshots WHERE keyword_id = k.id AND domain = c.domain AND snapshot_date <= $2 ORDER BY snapshot_date DESC LIMIT 1) as start_pos
     FROM keywords k JOIN clients c ON c.id = k.client_id
     WHERE k.client_id = $1 AND k.is_active`,
    [clientId, dateFrom]
  );
  const withChange = rows.filter(r => r.start_pos && r.current_pos).map(r => ({ ...r, change: r.start_pos - r.current_pos }));
  const gainers = withChange.filter(r => r.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
  const losers = withChange.filter(r => r.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
  return { gainers, losers };
}

async function buildTechnicalFixes(clientId: string, dateFrom: string, dateTo: string) {
  const { rows: fixed } = await pool.query(
    `SELECT ai.issue_type, ai.severity, ai.affected_url, ai.description
     FROM audit_issues ai JOIN audit_runs ar ON ar.id = ai.audit_run_id
     WHERE ar.client_id = $1 AND ai.status = 'done' AND ai.updated_at BETWEEN $2 AND $3
     ORDER BY ai.updated_at DESC LIMIT 20`,
    [clientId, dateFrom, dateTo]
  );
  const { rows: open } = await pool.query(
    `SELECT COUNT(*) as count FROM audit_issues ai JOIN audit_runs ar ON ar.id = ai.audit_run_id
     WHERE ar.client_id = $1 AND ai.status IN ('open','in_progress')`,
    [clientId]
  );
  return { fixed, remaining_issues: parseInt(open[0]?.count || '0') };
}

async function buildContentPublished(clientId: string, dateFrom: string, dateTo: string) {
  const { rows: articles } = await pool.query(
    `SELECT title, target_keyword, slug, status, publish_date FROM seo_articles
     WHERE client_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at DESC`,
    [clientId, dateFrom, dateTo]
  );
  const { rows: social } = await pool.query(
    `SELECT platform, status, COUNT(*) as count FROM social_posts
     WHERE client_id = $1 AND created_at BETWEEN $2 AND $3 GROUP BY platform, status`,
    [clientId, dateFrom, dateTo]
  );
  return { articles, social_summary: social, total_articles: articles.length };
}

async function buildGbpActivity(clientId: string, dateFrom: string, dateTo: string) {
  const { rows: posts } = await pool.query(
    `SELECT title, status, scheduled_time FROM gbp_post_drafts WHERE client_id = $1 AND created_at BETWEEN $2 AND $3`,
    [clientId, dateFrom, dateTo]
  );
  const { rows: reviews } = await pool.query(
    `SELECT reviewer_name, rating, review_text, response_status FROM gbp_reviews WHERE client_id = $1 AND created_at BETWEEN $2 AND $3`,
    [clientId, dateFrom, dateTo]
  );
  const { rows: profile } = await pool.query(
    `SELECT data_json FROM gbp_profile_snapshots WHERE client_id = $1 ORDER BY snapshot_date DESC LIMIT 1`,
    [clientId]
  );
  return { posts, reviews, profile_snapshot: profile[0]?.data_json || null };
}

async function buildAnalyticsPerformance(clientId: string, dateFrom: string, dateTo: string) {
  const { rows } = await pool.query(
    `SELECT snapshot_date, clicks, impressions, ctr, avg_position, sessions, bounce_rate
     FROM page_performance_snapshots WHERE client_id = $1 AND snapshot_date BETWEEN $2 AND $3
     ORDER BY snapshot_date`,
    [clientId, dateFrom, dateTo]
  );
  const totals = rows.reduce((acc, r) => ({
    clicks: acc.clicks + (r.clicks || 0),
    impressions: acc.impressions + (r.impressions || 0),
    sessions: acc.sessions + (r.sessions || 0),
  }), { clicks: 0, impressions: 0, sessions: 0 });
  return { daily: rows, totals };
}

async function buildCrmSummary(clientId: string, dateFrom: string, dateTo: string) {
  const { rows: newContacts } = await pool.query(
    `SELECT COUNT(*) as count FROM crm_contacts WHERE client_id = $1 AND created_at BETWEEN $2 AND $3`,
    [clientId, dateFrom, dateTo]
  );
  const { rows: deals } = await pool.query(
    `SELECT deal_stage, COUNT(*) as count, SUM(deal_value) as total_value FROM crm_deals
     WHERE client_id = $1 AND created_at BETWEEN $2 AND $3 GROUP BY deal_stage`,
    [clientId, dateFrom, dateTo]
  );
  const { rows: wonDeals } = await pool.query(
    `SELECT COUNT(*) as count, COALESCE(SUM(deal_value), 0) as total FROM crm_deals
     WHERE client_id = $1 AND deal_stage = 'won' AND won_date BETWEEN $2 AND $3`,
    [clientId, dateFrom, dateTo]
  );
  return { new_contacts: parseInt(newContacts[0]?.count || '0'), deals_by_stage: deals, won: wonDeals[0] };
}

async function buildAdsSummary(clientId: string, dateFrom: string, dateTo: string) {
  const { rows: campaigns } = await pool.query(
    `SELECT name, campaign_type, status, budget_daily FROM google_ads_campaigns WHERE client_id = $1`,
    [clientId]
  );
  const { rows: performance } = await pool.query(
    `SELECT SUM(impressions) as impressions, SUM(clicks) as clicks, SUM(cost) as cost, SUM(conversions) as conversions
     FROM google_ads_performance WHERE client_id = $1 AND snapshot_date BETWEEN $2 AND $3`,
    [clientId, dateFrom, dateTo]
  );
  return { campaigns, performance: performance[0] || {} };
}

async function buildNextPriorities(clientId: string) {
  const { rows } = await pool.query(
    `SELECT title, description, recommended_action, priority_score, source_module
     FROM marketing_priorities WHERE client_id = $1 AND status = 'open'
     ORDER BY priority_score DESC LIMIT 10`,
    [clientId]
  );
  return { priorities: rows };
}

function buildSummary(sectionsData: Record<string, any>): string {
  const parts: string[] = [];
  if (sectionsData.keyword_movement) {
    const km = sectionsData.keyword_movement;
    parts.push(`${km.total_tracked} keywords tracked: ${km.improved} improved, ${km.declined} declined`);
  }
  if (sectionsData.content_published) {
    parts.push(`${sectionsData.content_published.total_articles} articles published`);
  }
  if (sectionsData.leads_crm_summary) {
    parts.push(`${sectionsData.leads_crm_summary.new_contacts} new contacts`);
  }
  return parts.join(". ") || "Report generated successfully.";
}

function computeNextRun(scheduleType: string, dayOfMonth: number): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth || 1, 9, 0, 0);
  if (scheduleType === 'weekly') {
    const d = new Date();
    d.setDate(d.getDate() + (7 - d.getDay()) % 7 + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  return next.toISOString();
}

// ---- Scheduled report execution ----
export async function processScheduledReports() {
  const { rows } = await pool.query(
    `SELECT sr.*, c.domain FROM scheduled_reports sr
     JOIN clients c ON c.id = sr.client_id
     WHERE sr.status = 'active' AND sr.next_run_at <= NOW()`
  );

  for (const schedule of rows) {
    try {
      const now = new Date();
      const dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      await generateReport({
        workspace_id: schedule.workspace_id,
        client_id: schedule.client_id,
        template_id: schedule.template_id,
        date_from: dateFrom,
        date_to: dateTo,
      });

      const nextRun = computeNextRun(schedule.schedule_type, schedule.day_of_month);
      await pool.query(
        `UPDATE scheduled_reports SET last_sent_at = NOW(), next_run_at = $2, updated_at = NOW() WHERE id = $1`,
        [schedule.id, nextRun]
      );

      console.log(`  ✓ Report generated for client ${schedule.client_id}`);
    } catch (error) {
      console.error(`  ✗ Failed report for schedule ${schedule.id}:`, error);
    }
  }
}
