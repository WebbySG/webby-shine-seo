import pool from "../../db.js";

export async function computeFirstTouchAttribution(clientId: string) {
  // For each contact, find the first lead capture event and credit that channel 100%
  const { rows: contacts } = await pool.query(
    `SELECT id FROM crm_contacts WHERE client_id = $1`, [clientId]
  );

  for (const contact of contacts) {
    const { rows: events } = await pool.query(
      `SELECT * FROM lead_capture_events WHERE contact_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [contact.id]
    );
    if (events.length === 0) continue;
    const evt = events[0];

    // Upsert attribution record
    await pool.query(
      `INSERT INTO attribution_records (client_id, contact_id, attribution_model, channel, source_type, source_id, campaign_name, credit)
       VALUES ($1,$2,'first_touch',$3,$4,$5,$6,1.0)
       ON CONFLICT DO NOTHING`,
      [clientId, contact.id, evt.channel || 'direct', evt.source_type, evt.source_id, evt.utm_campaign]
    );
  }
}

export async function computeLastTouchAttribution(clientId: string) {
  const { rows: contacts } = await pool.query(
    `SELECT id FROM crm_contacts WHERE client_id = $1`, [clientId]
  );

  for (const contact of contacts) {
    const { rows: events } = await pool.query(
      `SELECT * FROM lead_capture_events WHERE contact_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [contact.id]
    );
    if (events.length === 0) continue;
    const evt = events[0];

    await pool.query(
      `INSERT INTO attribution_records (client_id, contact_id, attribution_model, channel, source_type, source_id, campaign_name, credit)
       VALUES ($1,$2,'last_touch',$3,$4,$5,$6,1.0)
       ON CONFLICT DO NOTHING`,
      [clientId, contact.id, evt.channel || 'direct', evt.source_type, evt.source_id, evt.utm_campaign]
    );
  }
}

export async function computeLinearAttribution(clientId: string) {
  const { rows: contacts } = await pool.query(
    `SELECT id FROM crm_contacts WHERE client_id = $1`, [clientId]
  );

  for (const contact of contacts) {
    const { rows: events } = await pool.query(
      `SELECT * FROM lead_capture_events WHERE contact_id = $1 ORDER BY created_at ASC`,
      [contact.id]
    );
    if (events.length === 0) continue;
    const credit = 1.0 / events.length;

    for (const evt of events) {
      await pool.query(
        `INSERT INTO attribution_records (client_id, contact_id, attribution_model, channel, source_type, source_id, campaign_name, credit)
         VALUES ($1,$2,'linear',$3,$4,$5,$6,$7)
         ON CONFLICT DO NOTHING`,
        [clientId, contact.id, evt.channel || 'direct', evt.source_type, evt.source_id, evt.utm_campaign, credit]
      );
    }
  }
}

export async function getAttributionOverview(clientId: string) {
  const { rows: byChannel } = await pool.query(
    `SELECT channel, attribution_model, SUM(credit) as total_credit, COUNT(DISTINCT contact_id) as contacts
     FROM attribution_records WHERE client_id = $1
     GROUP BY channel, attribution_model ORDER BY total_credit DESC`,
    [clientId]
  );

  const { rows: dealAttribution } = await pool.query(
    `SELECT ar.channel, ar.attribution_model, SUM(d.deal_value * ar.credit) as attributed_revenue, COUNT(DISTINCT d.id) as deals
     FROM attribution_records ar
     JOIN crm_deals d ON d.contact_id = ar.contact_id AND d.client_id = ar.client_id
     WHERE ar.client_id = $1 AND d.deal_stage = 'won'
     GROUP BY ar.channel, ar.attribution_model ORDER BY attributed_revenue DESC`,
    [clientId]
  );

  return { byChannel, dealAttribution };
}

export async function getAttributionContacts(clientId: string) {
  const { rows } = await pool.query(
    `SELECT ar.*, c.full_name, c.email, c.status as contact_status
     FROM attribution_records ar
     JOIN crm_contacts c ON c.id = ar.contact_id
     WHERE ar.client_id = $1
     ORDER BY ar.created_at DESC`,
    [clientId]
  );
  return rows;
}

export async function getAttributionDeals(clientId: string) {
  const { rows } = await pool.query(
    `SELECT ar.channel, ar.attribution_model, ar.credit, ar.campaign_name,
            d.deal_name, d.deal_value, d.deal_stage, d.won_date,
            c.full_name as contact_name
     FROM attribution_records ar
     JOIN crm_deals d ON d.contact_id = ar.contact_id AND d.client_id = ar.client_id
     JOIN crm_contacts c ON c.id = ar.contact_id
     WHERE ar.client_id = $1
     ORDER BY d.deal_value DESC NULLS LAST`,
    [clientId]
  );
  return rows;
}
