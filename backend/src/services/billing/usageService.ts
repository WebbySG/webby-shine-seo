import pool from "../../db.js";

export async function trackUsage(workspaceId: string, usageKey: string, quantity: number = 1, sourceType?: string, sourceId?: string) {
  await pool.query(
    `INSERT INTO usage_events (workspace_id, usage_key, quantity, source_type, source_id) VALUES ($1, $2, $3, $4, $5)`,
    [workspaceId, usageKey, quantity, sourceType || null, sourceId || null]
  );
}

export async function getUsageSummary(workspaceId: string) {
  // Current month usage
  const { rows } = await pool.query(
    `SELECT usage_key, SUM(quantity) as total
     FROM usage_events
     WHERE workspace_id = $1 AND created_at >= date_trunc('month', NOW())
     GROUP BY usage_key`,
    [workspaceId]
  );

  // Get plan limits
  const { rows: limits } = await pool.query(
    `SELECT pl.limit_key, pl.limit_value
     FROM workspace_subscriptions ws
     JOIN plan_limits pl ON pl.plan_id = ws.plan_id
     WHERE ws.workspace_id = $1 AND ws.status IN ('trial', 'active')
     ORDER BY ws.created_at DESC LIMIT 20`,
    [workspaceId]
  );

  const usage: Record<string, { used: number; limit: number | null }> = {};
  for (const l of limits) {
    usage[l.limit_key] = { used: 0, limit: l.limit_value };
  }
  for (const r of rows) {
    const key = usageKeyToLimitKey(r.usage_key);
    if (usage[key]) {
      usage[key].used = parseInt(r.total);
    } else {
      usage[key] = { used: parseInt(r.total), limit: null };
    }
  }
  return usage;
}

function usageKeyToLimitKey(usageKey: string): string {
  const map: Record<string, string> = {
    article_generated: "max_articles_per_month",
    social_post_generated: "max_social_posts_per_month",
    video_generated: "max_videos_per_month",
    crm_contact_created: "max_crm_contacts",
  };
  return map[usageKey] || usageKey;
}

export async function checkLimit(workspaceId: string, usageKey: string): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  const limitKey = usageKeyToLimitKey(usageKey);
  const { rows: limits } = await pool.query(
    `SELECT pl.limit_value
     FROM workspace_subscriptions ws
     JOIN plan_limits pl ON pl.plan_id = ws.plan_id
     WHERE ws.workspace_id = $1 AND ws.status IN ('trial', 'active') AND pl.limit_key = $2
     ORDER BY ws.created_at DESC LIMIT 1`,
    [workspaceId, limitKey]
  );

  if (limits.length === 0) return { allowed: true, used: 0, limit: null };

  const { rows: usageRows } = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0) as total FROM usage_events
     WHERE workspace_id = $1 AND usage_key = $2 AND created_at >= date_trunc('month', NOW())`,
    [workspaceId, usageKey]
  );

  const used = parseInt(usageRows[0].total);
  const limit = limits[0].limit_value;
  return { allowed: used < limit, used, limit };
}

export async function getSubscription(workspaceId: string) {
  const { rows } = await pool.query(
    `SELECT ws.*, sp.name as plan_name, sp.plan_type, sp.monthly_price, sp.annual_price
     FROM workspace_subscriptions ws
     JOIN subscription_plans sp ON sp.id = ws.plan_id
     WHERE ws.workspace_id = $1 AND ws.status IN ('trial', 'active')
     ORDER BY ws.created_at DESC LIMIT 1`,
    [workspaceId]
  );
  return rows[0] || null;
}

export async function rollupUsage() {
  // Archive old usage events (older than 90 days) - keep aggregated
  console.log(`[${new Date().toISOString()}] 📊 Usage rollup started`);
  const { rowCount } = await pool.query(
    `DELETE FROM usage_events WHERE created_at < NOW() - INTERVAL '90 days'`
  );
  console.log(`  Cleaned ${rowCount || 0} old usage events`);
}
