import cron from "node-cron";
import pool from "./db.js";
import { fetchSerpResults, findDomainPosition } from "./services/dataforseo.js";
import dotenv from "dotenv";
dotenv.config();

const BATCH_SIZE = 30;
const SERP_PROVIDER = "dataforseo";

interface KeywordData {
  id: string;
  keyword: string;
  search_engine: string;
  locale: string;
  location: string;
  client_id: string;
  domain: string;
}

interface CompetitorData {
  domain: string;
  label: string;
}

// ====================================================================
// 1. RANK TRACKING
// ====================================================================
async function fetchRankings() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] 🔄 Rank check job started`);

  try {
    const { rows: keywords } = await pool.query<KeywordData>(
      `SELECT k.id, k.keyword, k.search_engine, k.locale, k.location, k.client_id, c.domain
       FROM keywords k
       JOIN clients c ON c.id = k.client_id
       WHERE k.is_active AND c.status = 'active'
       ORDER BY k.client_id, k.created_at
       LIMIT 1000`
    );

    if (keywords.length === 0) {
      console.log("  No active keywords to check");
      return;
    }

    console.log(`  Found ${keywords.length} active keywords to check`);

    const keywordsByClient = new Map<string, KeywordData[]>();
    for (const kw of keywords) {
      const clientKeywords = keywordsByClient.get(kw.client_id) || [];
      if (clientKeywords.length < BATCH_SIZE) {
        clientKeywords.push(kw);
        keywordsByClient.set(kw.client_id, clientKeywords);
      }
    }

    for (const [clientId, clientKeywords] of keywordsByClient) {
      const clientDomain = clientKeywords[0].domain;
      console.log(`  Processing client ${clientId}: ${clientKeywords.length} keywords`);

      const { rows: competitors } = await pool.query<CompetitorData>(
        `SELECT domain, label FROM competitors WHERE client_id = $1`,
        [clientId]
      );

      const domainsToTrack = [clientDomain, ...competitors.map((c) => c.domain)];

      try {
        const serpResults = await fetchSerpResults(
          clientKeywords.map((kw) => ({ id: kw.id, keyword: kw.keyword })),
          "Singapore",
          "en",
          10
        );

        const snapshotDate = new Date().toISOString().split("T")[0];

        for (const kw of clientKeywords) {
          const serpResult = serpResults.get(kw.id);
          if (!serpResult) {
            console.warn(`  No SERP result for keyword: ${kw.keyword}`);
            continue;
          }

          for (const domain of domainsToTrack) {
            const positionData = findDomainPosition(serpResult, domain);

            const { rows: prevRows } = await pool.query(
              `SELECT position FROM rank_snapshots
               WHERE keyword_id = $1 AND domain = $2
               ORDER BY snapshot_date DESC LIMIT 1`,
              [kw.id, domain]
            );
            const prevPosition = prevRows[0]?.position || null;
            const currentPosition = positionData?.position || null;

            let delta: number | null = null;
            if (prevPosition !== null && currentPosition !== null) {
              delta = prevPosition - currentPosition;
            }

            await pool.query(
              `INSERT INTO rank_snapshots
               (keyword_id, domain, position, ranking_url, snapshot_date, serp_provider, delta)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (keyword_id, domain, snapshot_date)
               DO UPDATE SET position = $3, ranking_url = $4, serp_provider = $6, delta = $7`,
              [kw.id, domain, currentPosition, positionData?.url || null, snapshotDate, SERP_PROVIDER, delta]
            );
          }
        }

        console.log(`  ✓ Completed client ${clientId}`);
      } catch (error) {
        console.error(`  ✗ Error processing client ${clientId}:`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`[${endTime.toISOString()}] ✅ Rank check job completed in ${duration}s`);
  } catch (error) {
    console.error("Fatal error in rank check job:", error);
  }
}

// ====================================================================
// 2. OPPORTUNITY GENERATION  (runs after rank tracking)
// ====================================================================
async function generateOpportunities() {
  console.log(`[${new Date().toISOString()}] 💡 Opportunity generation started`);

  try {
    const { rows: activeClients } = await pool.query(
      `SELECT id, domain FROM clients WHERE status = 'active'`
    );

    for (const client of activeClients) {
      const clientId = client.id;
      const clientDomain = client.domain;

      // Clear previous open/dismissed opportunities for fresh generation
      await pool.query(
        `DELETE FROM seo_opportunities WHERE client_id = $1 AND status IN ('open','dismissed')`,
        [clientId]
      );

      const { rows: competitors } = await pool.query(
        `SELECT domain FROM competitors WHERE client_id = $1`,
        [clientId]
      );
      const competitorDomains: string[] = competitors.map((r: any) => r.domain);

      // ---------- Near Wins (pos 11–20) ----------
      const { rows: nearWins } = await pool.query(
        `SELECT k.id AS keyword_id, k.keyword, k.target_url,
                rs.position, rs.ranking_url
         FROM keywords k
         JOIN LATERAL (
           SELECT position, ranking_url FROM rank_snapshots
           WHERE keyword_id = k.id AND domain = $2
           ORDER BY snapshot_date DESC LIMIT 1
         ) rs ON true
         WHERE k.client_id = $1 AND k.is_active
           AND rs.position BETWEEN 11 AND 20`,
        [clientId, clientDomain]
      );

      for (const r of nearWins) {
        const priority = r.position <= 15 ? "high" : "medium";
        await pool.query(
          `INSERT INTO seo_opportunities
           (client_id, keyword_id, type, priority, target_url, current_position, recommended_action)
           VALUES ($1, $2, 'near_win', $3, $4, $5, $6)`,
          [
            clientId,
            r.keyword_id,
            priority,
            r.ranking_url ?? r.target_url,
            r.position,
            `Push "${r.keyword}" from #${r.position} to page 1. Add internal links, expand content, and optimize headings.`,
          ]
        );
      }

      // ---------- Content Gap ----------
      if (competitorDomains.length > 0) {
        const { rows: gaps } = await pool.query(
          `SELECT DISTINCT k.id AS keyword_id, k.keyword,
                  comp_rs.domain AS competitor_domain, comp_rs.position AS competitor_position
           FROM keywords k
           JOIN LATERAL (
             SELECT domain, position FROM rank_snapshots
             WHERE keyword_id = k.id AND domain = ANY($3) AND position <= 10
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

        for (const r of gaps) {
          await pool.query(
            `INSERT INTO seo_opportunities
             (client_id, keyword_id, type, priority, target_url, current_position, recommended_action)
             VALUES ($1, $2, 'content_gap', $3, NULL, NULL, $4)`,
            [
              clientId,
              r.keyword_id,
              r.competitor_position <= 5 ? "high" : "medium",
              `Create new page for "${r.keyword}". Competitor ${r.competitor_domain} ranks #${r.competitor_position}.`,
            ]
          );
        }
      }

      // ---------- Page Expansion ----------
      const { rows: expansions } = await pool.query(
        `WITH latest AS (
           SELECT DISTINCT ON (rs.keyword_id)
             rs.keyword_id, rs.ranking_url, rs.position, k.keyword
           FROM rank_snapshots rs
           JOIN keywords k ON k.id = rs.keyword_id
           WHERE k.client_id = $1 AND rs.domain = $2 AND k.is_active
           ORDER BY rs.keyword_id, rs.snapshot_date DESC
         )
         SELECT ranking_url, array_agg(keyword) AS keywords,
                count(*) AS kw_count, min(position) AS best_pos
         FROM latest WHERE ranking_url IS NOT NULL
         GROUP BY ranking_url HAVING count(*) >= 2
         ORDER BY count(*) DESC`,
        [clientId, clientDomain]
      );

      for (const r of expansions) {
        await pool.query(
          `INSERT INTO seo_opportunities
           (client_id, keyword_id, type, priority, target_url, current_position, recommended_action)
           VALUES ($1, NULL, 'page_expansion', $2, $3, $4, $5)`,
          [
            clientId,
            r.kw_count >= 4 ? "high" : "medium",
            r.ranking_url,
            r.best_pos,
            `Expand page content. This URL ranks for ${r.kw_count} keywords (${r.keywords.join(", ")}). Consider splitting into dedicated pages.`,
          ]
        );
      }

      // ---------- Technical Fix ----------
      const { rows: techFixes } = await pool.query(
        `SELECT DISTINCT ON (ai.affected_url)
           ai.affected_url, ai.issue_type, ai.severity, ai.description, ai.fix_instruction,
           k.id AS keyword_id, k.keyword, rs.position
         FROM audit_issues ai
         JOIN audit_runs ar ON ar.id = ai.audit_run_id AND ar.client_id = $1
         JOIN LATERAL (
           SELECT DISTINCT ON (keyword_id) keyword_id, ranking_url, position
           FROM rank_snapshots WHERE domain = $2
           ORDER BY keyword_id, snapshot_date DESC
         ) rs ON rs.ranking_url = ai.affected_url
         JOIN keywords k ON k.id = rs.keyword_id AND k.is_active
         WHERE ai.status IN ('open','in_progress')
         ORDER BY ai.affected_url, ai.severity DESC`,
        [clientId, clientDomain]
      );

      for (const r of techFixes) {
        await pool.query(
          `INSERT INTO seo_opportunities
           (client_id, keyword_id, type, priority, target_url, current_position, recommended_action)
           VALUES ($1, $2, 'technical_fix', $3, $4, $5, $6)`,
          [
            clientId,
            r.keyword_id,
            r.severity === "critical" ? "high" : r.severity === "warning" ? "medium" : "low",
            r.affected_url,
            r.position,
            `Fix technical issues: ${r.severity.toUpperCase()} — ${r.issue_type}. ${r.description}. ${r.fix_instruction ?? "Review and fix."}`,
          ]
        );
      }

      console.log(`  ✓ Opportunities generated for client ${clientId}`);
    }

    console.log(`[${new Date().toISOString()}] ✅ Opportunity generation completed`);
  } catch (error) {
    console.error("Fatal error in opportunity generation:", error);
  }
}

// ====================================================================
// 3. COMBINED DAILY JOB
// ====================================================================
async function dailyJob() {
  await fetchRankings();
  await generateOpportunities();
}

// Run daily at 02:00 SGT
cron.schedule("0 2 * * *", dailyJob, {
  timezone: "Asia/Singapore",
});

console.log("🕐 Cron worker started — rank checks + opportunities daily at 02:00 SGT");

export { fetchRankings, generateOpportunities };
