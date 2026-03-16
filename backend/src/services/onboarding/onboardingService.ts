import pool from "../../db.js";

export async function startOnboarding(workspaceId: string) {
  const { rows } = await pool.query(
    `INSERT INTO onboarding_sessions (workspace_id, current_step, status, data_json)
     VALUES ($1, 1, 'in_progress', '{}')
     RETURNING *`,
    [workspaceId]
  );
  return rows[0];
}

export async function getOnboarding(workspaceId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM onboarding_sessions WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [workspaceId]
  );
  return rows[0] || null;
}

export async function updateOnboarding(workspaceId: string, data: { current_step?: number; data_json?: any; status?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.current_step !== undefined) { fields.push(`current_step = $${idx++}`); values.push(data.current_step); }
  if (data.data_json !== undefined) { fields.push(`data_json = $${idx++}`); values.push(JSON.stringify(data.data_json)); }
  if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
  fields.push(`updated_at = NOW()`);
  values.push(workspaceId);

  const { rows } = await pool.query(
    `UPDATE onboarding_sessions SET ${fields.join(", ")} WHERE workspace_id = $${idx} AND status = 'in_progress' RETURNING *`,
    values
  );
  return rows[0] || null;
}

export async function completeOnboarding(workspaceId: string) {
  const { rows } = await pool.query(
    `UPDATE onboarding_sessions SET status = 'completed', updated_at = NOW()
     WHERE workspace_id = $1 AND status = 'in_progress' RETURNING *`,
    [workspaceId]
  );
  return rows[0] || null;
}

export async function createActivationChecklist(workspaceId: string, clientId: string | null) {
  const items = [
    { key: "connect_gsc", title: "Connect Google Search Console", desc: "Link your GSC property to start tracking search performance.", type: "integration" },
    { key: "connect_ga4", title: "Connect Google Analytics", desc: "Connect GA4 to monitor website traffic and conversions.", type: "integration" },
    { key: "connect_gbp", title: "Connect Google Business Profile", desc: "Link your GBP listing for local SEO management.", type: "integration" },
    { key: "connect_google_ads", title: "Connect Google Ads", desc: "Link Google Ads for campaign management and optimization.", type: "integration" },
    { key: "connect_wordpress", title: "Connect WordPress CMS", desc: "Link your WordPress site for direct content publishing.", type: "integration" },
    { key: "review_keywords", title: "Review Target Keywords", desc: "Review and confirm the starter keywords for tracking.", type: "setup" },
    { key: "review_competitors", title: "Review Competitors", desc: "Confirm competitor domains to track and analyze.", type: "setup" },
    { key: "approve_first_plan", title: "Approve First Weekly Plan", desc: "Review and approve the initial marketing action plan.", type: "launch" },
    { key: "generate_first_article", title: "Generate First Article", desc: "Create your first SEO-optimized article.", type: "launch" },
    { key: "publish_first_asset", title: "Publish First Asset", desc: "Publish your first content piece to a live channel.", type: "launch" },
  ];

  for (const item of items) {
    await pool.query(
      `INSERT INTO activation_checklists (workspace_id, client_id, checklist_type, item_key, title, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [workspaceId, clientId, item.type, item.key, item.title, item.desc]
    );
  }
}

export async function getActivationChecklist(clientId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM activation_checklists WHERE client_id = $1 ORDER BY created_at`,
    [clientId]
  );
  return rows;
}

export async function updateChecklistItem(itemId: string, status: string) {
  const { rows } = await pool.query(
    `UPDATE activation_checklists SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, itemId]
  );
  return rows[0] || null;
}
