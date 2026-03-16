import pool from "../../db.js";
import { createActivationChecklist } from "./onboardingService.js";

export async function runSetup(workspaceId: string, clientId: string, templateId: string) {
  // Create setup run record
  const { rows: [run] } = await pool.query(
    `INSERT INTO setup_runs (workspace_id, client_id, template_id, status) VALUES ($1, $2, $3, 'processing') RETURNING *`,
    [workspaceId, clientId, templateId]
  );

  try {
    // Get template config
    const { rows: [template] } = await pool.query(`SELECT * FROM setup_templates WHERE id = $1`, [templateId]);
    if (!template) throw new Error("Template not found");

    const config = template.config_json;
    const summary: string[] = [];

    // Seed keywords
    if (config.keywords?.length) {
      for (const kw of config.keywords) {
        await pool.query(
          `INSERT INTO keywords (client_id, keyword, search_engine, locale, location, is_active)
           VALUES ($1, $2, 'google', 'en', 'Singapore', true)
           ON CONFLICT DO NOTHING`,
          [clientId, kw]
        );
      }
      summary.push(`Seeded ${config.keywords.length} starter keywords`);
    }

    // Seed content suggestions
    if (config.content_topics?.length) {
      for (const topic of config.content_topics) {
        await pool.query(
          `INSERT INTO content_suggestions (client_id, cluster_name, keyword, suggested_slug, reason, priority, status)
           VALUES ($1, $2, $3, $4, $5, 'medium', 'pending')
           ON CONFLICT DO NOTHING`,
          [clientId, template.industry, topic, topic.toLowerCase().replace(/[^a-z0-9]+/g, "-"), `Template suggestion for ${template.name}`]
        );
      }
      summary.push(`Seeded ${config.content_topics.length} content topics`);
    }

    // Seed ads recommendations
    if (config.ads_suggestions?.length) {
      for (const ad of config.ads_suggestions) {
        await pool.query(
          `INSERT INTO ads_recommendations (client_id, recommendation_type, campaign_name, keyword_text, recommended_budget, recommended_action, priority, status)
           VALUES ($1, 'new_campaign', $2, $3, $4, $5, 'medium', 'pending')
           ON CONFLICT DO NOTHING`,
          [clientId, ad.campaign, ad.keywords?.[0] || null, ad.budget_daily || null, `Create campaign: ${ad.campaign}`]
        );
      }
      summary.push(`Seeded ${config.ads_suggestions.length} ads recommendations`);
    }

    // Create activation checklist
    await createActivationChecklist(workspaceId, clientId);
    summary.push("Created activation checklist");

    // Mark setup complete
    await pool.query(
      `UPDATE setup_runs SET status = 'completed', summary = $1, updated_at = NOW() WHERE id = $2`,
      [summary.join("; "), run.id]
    );

    return { ...run, status: "completed", summary: summary.join("; ") };
  } catch (error: any) {
    await pool.query(
      `UPDATE setup_runs SET status = 'failed', summary = $1, updated_at = NOW() WHERE id = $2`,
      [error.message, run.id]
    );
    throw error;
  }
}

export async function getSetupStatus(workspaceId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM setup_runs WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [workspaceId]
  );
  return rows[0] || null;
}
