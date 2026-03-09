import pool from "../../db.js";

export interface CreateActivityInput {
  client_id: string;
  contact_id?: string;
  deal_id?: string;
  activity_type: string;
  title: string;
  description?: string;
  due_date?: string;
}

export async function createActivity(input: CreateActivityInput) {
  const { rows } = await pool.query(
    `INSERT INTO crm_activities (client_id, contact_id, deal_id, activity_type, title, description, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [input.client_id, input.contact_id || null, input.deal_id || null, input.activity_type, input.title, input.description || null, input.due_date || null]
  );
  return rows[0];
}

export async function getActivities(clientId: string, filters?: { contact_id?: string; deal_id?: string }) {
  let q = `SELECT * FROM crm_activities WHERE client_id = $1`;
  const params: any[] = [clientId];
  if (filters?.contact_id) { params.push(filters.contact_id); q += ` AND contact_id = $${params.length}`; }
  if (filters?.deal_id) { params.push(filters.deal_id); q += ` AND deal_id = $${params.length}`; }
  q += ` ORDER BY created_at DESC`;
  const { rows } = await pool.query(q, params);
  return rows;
}

export async function completeActivity(id: string) {
  const { rows } = await pool.query(
    `UPDATE crm_activities SET completed_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
}
