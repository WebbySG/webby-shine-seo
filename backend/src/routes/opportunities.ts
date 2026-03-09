import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/clients/:id/opportunities
router.get("/:id/opportunities", async (req, res) => {
  const clientId = req.params.id;

  try {
    // Fetch client domain
    const clientRes = await pool.query("SELECT domain FROM clients WHERE id = $1", [clientId]);
    if (clientRes.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    const clientDomain = clientRes.rows[0].domain;

    // Fetch competitor domains
    const compRes = await pool.query("SELECT domain FROM competitors WHERE client_id = $1", [clientId]);
    const competitorDomains: string[] = compRes.rows.map((r: any) => r.domain);

    const opportunities: any[] = [];

    // ---------- 1. Near Wins (positions 11–20) ----------
    const nearWinsRes = await pool.query(
      `SELECT k.id AS keyword_id, k.keyword, k.target_url, k.priority,
              rs.position AS current_position, rs.ranking_url,
              prev.position AS last_position
       FROM keywords k
       JOIN LATERAL (
         SELECT * FROM rank_snapshots
         WHERE keyword_id = k.id AND domain = $2
         ORDER BY snapshot_date DESC LIMIT 1
       ) rs ON true
       LEFT JOIN LATERAL (
         SELECT position FROM rank_snapshots
         WHERE keyword_id = k.id AND domain = $2 AND snapshot_date < rs.snapshot_date
         ORDER BY snapshot_date DESC LIMIT 1
       ) prev ON true
       WHERE k.client_id = $1 AND k.is_active
         AND rs.position BETWEEN 11 AND 20`,
      [clientId, clientDomain]
    );

    for (const r of nearWinsRes.rows) {
      opportunities.push({
        type: "near_win",
        keyword: r.keyword,
        current_position: r.current_position,
        last_position: r.last_position,
        change: r.last_position ? r.last_position - r.current_position : null,
        target_page: r.ranking_url,
        recommended_action: `Push from #${r.current_position} to page 1. Optimize on-page content, strengthen internal links, and build topical authority.`,
        priority: r.current_position <= 15 ? "high" : "medium",
      });
    }

    // ---------- 2. Content Gap (competitors rank, client doesn't) ----------
    if (competitorDomains.length > 0) {
      const contentGapRes = await pool.query(
        `SELECT DISTINCT k.keyword, comp_rs.domain AS competitor_domain,
                comp_rs.position AS competitor_position
         FROM keywords k
         JOIN LATERAL (
           SELECT domain, position FROM rank_snapshots
           WHERE keyword_id = k.id AND domain = ANY($3)
             AND position <= 10
           ORDER BY snapshot_date DESC LIMIT 1
         ) comp_rs ON true
         LEFT JOIN LATERAL (
           SELECT position FROM rank_snapshots
           WHERE keyword_id = k.id AND domain = $2
           ORDER BY snapshot_date DESC LIMIT 1
         ) client_rs ON true
         WHERE k.client_id = $1 AND k.is_active
           AND (client_rs.position IS NULL OR client_rs.position > 50)`,
        [clientId, clientDomain, competitorDomains]
      );

      for (const r of contentGapRes.rows) {
        opportunities.push({
          type: "content_gap",
          keyword: r.keyword,
          current_position: null,
          last_position: null,
          change: null,
          target_page: null,
          recommended_action: `Competitor ${r.competitor_domain} ranks #${r.competitor_position}. Create or optimize a dedicated page targeting this keyword.`,
          priority: r.competitor_position <= 5 ? "high" : "medium",
        });
      }
    }

    // ---------- 3. Page Expansion (same URL ranking for multiple keywords) ----------
    const pageExpansionRes = await pool.query(
      `WITH latest AS (
         SELECT DISTINCT ON (rs.keyword_id)
           rs.keyword_id, rs.ranking_url, rs.position, k.keyword
         FROM rank_snapshots rs
         JOIN keywords k ON k.id = rs.keyword_id
         WHERE k.client_id = $1 AND rs.domain = $2 AND k.is_active
         ORDER BY rs.keyword_id, rs.snapshot_date DESC
       )
       SELECT ranking_url, array_agg(keyword) AS keywords,
              count(*) AS keyword_count, min(position) AS best_position
       FROM latest
       WHERE ranking_url IS NOT NULL
       GROUP BY ranking_url
       HAVING count(*) >= 2
       ORDER BY count(*) DESC`,
      [clientId, clientDomain]
    );

    for (const r of pageExpansionRes.rows) {
      opportunities.push({
        type: "page_expansion",
        keyword: r.keywords.join(", "),
        current_position: r.best_position,
        last_position: null,
        change: null,
        target_page: r.ranking_url,
        recommended_action: `This page ranks for ${r.keyword_count} keywords. Consider expanding content depth or splitting into dedicated pages to capture more traffic.`,
        priority: r.keyword_count >= 4 ? "high" : "medium",
      });
    }

    // ---------- 4. Technical Fix (ranked pages with open audit issues) ----------
    const techFixRes = await pool.query(
      `SELECT DISTINCT ON (ai.affected_url)
         ai.affected_url, ai.issue_type, ai.severity, ai.description, ai.fix_instruction,
         k.keyword, rs.position AS current_position
       FROM audit_issues ai
       JOIN audit_runs ar ON ar.id = ai.audit_run_id AND ar.client_id = $1
       JOIN LATERAL (
         SELECT DISTINCT ON (keyword_id) keyword_id, ranking_url, position
         FROM rank_snapshots
         WHERE domain = $2
         ORDER BY keyword_id, snapshot_date DESC
       ) rs ON rs.ranking_url = ai.affected_url
       JOIN keywords k ON k.id = rs.keyword_id AND k.is_active
       WHERE ai.status IN ('open', 'in_progress')
       ORDER BY ai.affected_url, ai.severity DESC`,
      [clientId, clientDomain]
    );

    for (const r of techFixRes.rows) {
      opportunities.push({
        type: "technical_fix",
        keyword: r.keyword,
        current_position: r.current_position,
        last_position: null,
        change: null,
        target_page: r.affected_url,
        recommended_action: `${r.severity.toUpperCase()}: ${r.issue_type} — ${r.description}. ${r.fix_instruction ?? "Review and fix this issue."}`,
        priority: r.severity === "critical" ? "high" : r.severity === "warning" ? "medium" : "low",
      });
    }

    // Sort: high first, then medium, then low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    opportunities.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

    res.json(opportunities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate opportunities" });
  }
});

export default router;
