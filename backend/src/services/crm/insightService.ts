import pool from "../../db.js";

export async function getCrmInsights(clientId: string, status?: string) {
  let q = `SELECT * FROM crm_insights WHERE client_id = $1`;
  const params: any[] = [clientId];
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  q += ` ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`;
  const { rows } = await pool.query(q, params);
  return rows;
}

export async function recomputeCrmInsights(clientId: string) {
  // Clear old open insights
  await pool.query(`DELETE FROM crm_insights WHERE client_id = $1 AND status = 'open'`, [clientId]);

  const insights: any[] = [];

  // 1. Stale pipeline - contacts stuck in same status > 14 days
  const { rows: staleContacts } = await pool.query(
    `SELECT * FROM crm_contacts WHERE client_id = $1 AND status NOT IN ('won','lost','archived')
     AND updated_at < NOW() - INTERVAL '14 days'`, [clientId]
  );
  if (staleContacts.length > 0) {
    insights.push({
      insight_type: 'stale_pipeline', priority: 'high',
      title: `${staleContacts.length} contacts stuck in pipeline`,
      description: `These contacts haven't been updated in over 14 days.`,
      recommended_action: 'Review and follow up or archive stale contacts.'
    });
  }

  // 2. Overdue follow-ups
  const { rows: overdue } = await pool.query(
    `SELECT COUNT(*) as cnt FROM crm_activities WHERE client_id = $1 AND completed_at IS NULL AND due_date < NOW()`,
    [clientId]
  );
  if (parseInt(overdue[0]?.cnt) > 0) {
    insights.push({
      insight_type: 'follow_up_overdue', priority: 'high',
      title: `${overdue[0].cnt} overdue follow-ups`,
      description: 'Activities past their due date need attention.',
      recommended_action: 'Complete or reschedule overdue activities.'
    });
  }

  // 3. High-value deals in pipeline
  const { rows: highValue } = await pool.query(
    `SELECT * FROM crm_deals WHERE client_id = $1 AND deal_stage NOT IN ('won','lost') AND deal_value > 5000
     ORDER BY deal_value DESC LIMIT 5`, [clientId]
  );
  if (highValue.length > 0) {
    insights.push({
      insight_type: 'high_value_opportunity', priority: 'medium',
      title: `${highValue.length} high-value deals in pipeline`,
      description: `Total value: $${highValue.reduce((s: number, d: any) => s + (d.deal_value || 0), 0).toLocaleString()}`,
      recommended_action: 'Prioritize outreach for high-value opportunities.'
    });
  }

  // 4. Top performing lead sources
  const { rows: topSources } = await pool.query(
    `SELECT lead_source, COUNT(*) as cnt FROM crm_contacts WHERE client_id = $1 AND status = 'won'
     GROUP BY lead_source ORDER BY cnt DESC LIMIT 3`, [clientId]
  );
  for (const src of topSources) {
    insights.push({
      insight_type: 'high_performing_source', priority: 'low',
      title: `${src.lead_source} generated ${src.cnt} won contacts`,
      description: `This channel is performing well for lead generation.`,
      recommended_action: `Increase investment in ${src.lead_source}.`
    });
  }

  // Insert all insights
  for (const ins of insights) {
    await pool.query(
      `INSERT INTO crm_insights (client_id, insight_type, priority, title, description, recommended_action, status)
       VALUES ($1,$2,$3,$4,$5,$6,'open')`,
      [clientId, ins.insight_type, ins.priority, ins.title, ins.description, ins.recommended_action]
    );
  }

  return insights.length;
}

export async function updateCrmInsightStatus(id: string, status: string) {
  const { rows } = await pool.query(
    `UPDATE crm_insights SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0];
}
