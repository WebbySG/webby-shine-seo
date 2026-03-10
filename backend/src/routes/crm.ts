import { Router } from "express";
import pool from "../db.js";
import * as activityService from "../services/crm/activityService.js";
import * as attributionService from "../services/crm/attributionService.js";
import * as insightService from "../services/crm/insightService.js";

const router = Router();

// ===== Contacts =====
router.get("/:id/crm/contacts", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM crm_contacts WHERE client_id = $1 ORDER BY created_at DESC`, [req.params.id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/crm/contacts", async (req, res) => {
  try {
    const { client_id, first_name, last_name, email, phone, company_name, job_title, lead_source, notes } = req.body;
    const full_name = `${first_name || ""} ${last_name || ""}`.trim();

    if (email) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM crm_contacts WHERE client_id = $1 AND email = $2`, [client_id, email]
      );
      if (existing.length > 0) return res.status(409).json({ error: "Contact with this email already exists", contact_id: existing[0].id });
    }

    const { rows } = await pool.query(
      `INSERT INTO crm_contacts (client_id, first_name, last_name, full_name, email, phone, company_name, job_title, lead_source, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [client_id, first_name, last_name, full_name, email, phone, company_name, job_title, lead_source || 'manual', notes]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/crm/contacts/:contactId", async (req, res) => {
  try {
    const fields = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = $${i}`); vals.push(v); i++;
    }
    if (fields.first_name || fields.last_name) {
      sets.push(`full_name = $${i}`);
      vals.push(`${fields.first_name || ""} ${fields.last_name || ""}`.trim());
      i++;
    }
    sets.push(`updated_at = NOW()`);
    vals.push(req.params.contactId);
    const { rows } = await pool.query(
      `UPDATE crm_contacts SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/crm/contacts/:contactId", async (req, res) => {
  try {
    await pool.query(`DELETE FROM crm_activities WHERE contact_id = $1`, [req.params.contactId]);
    await pool.query(`DELETE FROM attribution_records WHERE contact_id = $1`, [req.params.contactId]);
    await pool.query(`DELETE FROM lead_capture_events WHERE contact_id = $1`, [req.params.contactId]);
    const { rows } = await pool.query(`DELETE FROM crm_contacts WHERE id = $1 RETURNING id`, [req.params.contactId]);
    if (rows.length === 0) return res.status(404).json({ error: "Contact not found" });
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== Deals =====
router.get("/:id/crm/deals", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, c.full_name as contact_name, c.email as contact_email
       FROM crm_deals d LEFT JOIN crm_contacts c ON c.id = d.contact_id
       WHERE d.client_id = $1 ORDER BY d.created_at DESC`, [req.params.id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/crm/deals", async (req, res) => {
  try {
    const { client_id, contact_id, deal_name, deal_value, deal_stage, pipeline_name, expected_close_date, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO crm_deals (client_id, contact_id, deal_name, deal_value, deal_stage, pipeline_name, expected_close_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [client_id, contact_id, deal_name, deal_value || 0, deal_stage || 'lead', pipeline_name || 'default', expected_close_date, notes]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/crm/deals/:dealId", async (req, res) => {
  try {
    const fields = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = $${i}`); vals.push(v); i++;
    }
    if (fields.deal_stage === 'won' && !fields.won_date) {
      sets.push(`won_date = $${i}`); vals.push(new Date().toISOString()); i++;
    }
    sets.push(`updated_at = NOW()`);
    vals.push(req.params.dealId);
    const { rows } = await pool.query(
      `UPDATE crm_deals SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/crm/deals/:dealId", async (req, res) => {
  try {
    await pool.query(`DELETE FROM crm_activities WHERE deal_id = $1`, [req.params.dealId]);
    const { rows } = await pool.query(`DELETE FROM crm_deals WHERE id = $1 RETURNING id`, [req.params.dealId]);
    if (rows.length === 0) return res.status(404).json({ error: "Deal not found" });
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== Activities =====
router.get("/:id/crm/activities", async (req, res) => {
  try {
    const rows = await activityService.getActivities(req.params.id, {
      contact_id: req.query.contact_id as string,
      deal_id: req.query.deal_id as string,
    });
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/crm/activities", async (req, res) => {
  try {
    const result = await activityService.createActivity(req.body);
    res.status(201).json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/crm/activities/:actId/complete", async (req, res) => {
  try {
    const result = await activityService.completeActivity(req.params.actId);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/crm/activities/:actId", async (req, res) => {
  try {
    const { rows } = await pool.query(`DELETE FROM crm_activities WHERE id = $1 RETURNING id`, [req.params.actId]);
    if (rows.length === 0) return res.status(404).json({ error: "Activity not found" });
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== Lead Capture =====
router.post("/crm/leads/capture", async (req, res) => {
  try {
    const { client_id, first_name, last_name, email, phone, company_name,
            source_type, channel, landing_page_url, referrer_url,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            gclid, fbclid, event_type } = req.body;

    const full_name = `${first_name || ""} ${last_name || ""}`.trim();
    let contact_id: string;

    if (email) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM crm_contacts WHERE client_id = $1 AND email = $2`, [client_id, email]
      );
      if (existing.length > 0) {
        contact_id = existing[0].id;
      } else {
        const { rows: created } = await pool.query(
          `INSERT INTO crm_contacts (client_id, first_name, last_name, full_name, email, phone, company_name, lead_source, source_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [client_id, first_name, last_name, full_name, email, phone, company_name, channel || 'website_form', source_type]
        );
        contact_id = created[0].id;
      }
    } else {
      const { rows: created } = await pool.query(
        `INSERT INTO crm_contacts (client_id, first_name, last_name, full_name, phone, company_name, lead_source, source_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [client_id, first_name, last_name, full_name, phone, company_name, channel || 'website_form', source_type]
      );
      contact_id = created[0].id;
    }

    const { rows: evt } = await pool.query(
      `INSERT INTO lead_capture_events (client_id, contact_id, source_type, channel, landing_page_url, referrer_url,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid, event_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [client_id, contact_id, source_type, channel, landing_page_url, referrer_url,
       utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid, event_type || 'form_submit']
    );

    await activityService.createActivity({
      client_id, contact_id, activity_type: 'follow_up',
      title: `Follow up with ${full_name || email || 'new lead'}`,
      due_date: new Date(Date.now() + 86400000).toISOString(),
    });

    res.status(201).json({ contact_id, event: evt[0] });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== Attribution =====
router.get("/:id/attribution/overview", async (req, res) => {
  try {
    const data = await attributionService.getAttributionOverview(req.params.id);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/:id/attribution/contacts", async (req, res) => {
  try {
    const data = await attributionService.getAttributionContacts(req.params.id);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/:id/attribution/deals", async (req, res) => {
  try {
    const data = await attributionService.getAttributionDeals(req.params.id);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/:id/attribution/recompute", async (req, res) => {
  try {
    await attributionService.computeFirstTouchAttribution(req.params.id);
    await attributionService.computeLastTouchAttribution(req.params.id);
    await attributionService.computeLinearAttribution(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== CRM Insights =====
router.get("/:id/crm/insights", async (req, res) => {
  try {
    const data = await insightService.getCrmInsights(req.params.id, req.query.status as string);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/:id/crm/insights/recompute", async (req, res) => {
  try {
    const count = await insightService.recomputeCrmInsights(req.params.id);
    res.json({ success: true, insights_generated: count });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/crm/insights/:insightId", async (req, res) => {
  try {
    const result = await insightService.updateCrmInsightStatus(req.params.insightId, req.body.status);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
