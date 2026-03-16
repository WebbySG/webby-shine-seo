import pool from "../../db.js";

export async function getTemplates(industry?: string) {
  if (industry) {
    const { rows } = await pool.query(
      `SELECT * FROM setup_templates WHERE status = 'active' AND industry = $1 ORDER BY name`,
      [industry]
    );
    return rows;
  }
  const { rows } = await pool.query(`SELECT * FROM setup_templates WHERE status = 'active' ORDER BY industry, name`);
  return rows;
}

export async function getTemplate(id: string) {
  const { rows } = await pool.query(`SELECT * FROM setup_templates WHERE id = $1`, [id]);
  return rows[0] || null;
}
