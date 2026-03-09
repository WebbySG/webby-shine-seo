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
// 2. OPPORTUNITY GENERATION
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

      await pool.query(
        `DELETE FROM seo_opportunities WHERE client_id = $1 AND status IN ('open','dismissed')`,
        [clientId]
      );

      const { rows: competitors } = await pool.query(
        `SELECT domain FROM competitors WHERE client_id = $1`,
        [clientId]
      );
      const competitorDomains: string[] = competitors.map((r: any) => r.domain);

      // Near Wins
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
          [clientId, r.keyword_id, priority, r.ranking_url ?? r.target_url, r.position,
            `Push "${r.keyword}" from #${r.position} to page 1. Add internal links, expand content, and optimize headings.`]
        );
      }

      // Content Gap
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
            [clientId, r.keyword_id, r.competitor_position <= 5 ? "high" : "medium",
              `Create new page for "${r.keyword}". Competitor ${r.competitor_domain} ranks #${r.competitor_position}.`]
          );
        }
      }

      // Page Expansion
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
          [clientId, r.kw_count >= 4 ? "high" : "medium", r.ranking_url, r.best_pos,
            `Expand page content. This URL ranks for ${r.kw_count} keywords (${r.keywords.join(", ")}). Consider splitting into dedicated pages.`]
        );
      }

      // Technical Fix
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
          [clientId, r.keyword_id,
            r.severity === "critical" ? "high" : r.severity === "warning" ? "medium" : "low",
            r.affected_url, r.position,
            `Fix technical issues: ${r.severity.toUpperCase()} — ${r.issue_type}. ${r.description}. ${r.fix_instruction ?? "Review and fix."}`]
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
// 3. INTERNAL LINK SUGGESTIONS
// ====================================================================
async function generateInternalLinks() {
  console.log(`[${new Date().toISOString()}] 🔗 Internal link suggestion generation started`);

  try {
    const { rows: activeClients } = await pool.query(
      `SELECT id, domain FROM clients WHERE status = 'active'`
    );

    for (const client of activeClients) {
      const clientId = client.id;
      const clientDomain = client.domain;

      // Clear old pending/dismissed suggestions
      await pool.query(
        `DELETE FROM internal_link_suggestions WHERE client_id = $1 AND status IN ('pending','dismissed')`,
        [clientId]
      );

      // Get all keywords with their target URLs and current ranking positions
      const { rows: keywordPages } = await pool.query(
        `SELECT k.id AS keyword_id, k.keyword, k.target_url, k.cluster,
                rs.position, rs.ranking_url
         FROM keywords k
         LEFT JOIN LATERAL (
           SELECT position, ranking_url FROM rank_snapshots
           WHERE keyword_id = k.id AND domain = $2
           ORDER BY snapshot_date DESC LIMIT 1
         ) rs ON true
         WHERE k.client_id = $1 AND k.is_active`,
        [clientId, clientDomain]
      );

      // Build page-keyword mapping
      const pageKeywords = new Map<string, { keyword: string; position: number | null; targetUrl: string | null }[]>();
      for (const kp of keywordPages) {
        const url = kp.ranking_url || kp.target_url;
        if (!url) continue;
        const existing = pageKeywords.get(url) || [];
        existing.push({ keyword: kp.keyword, position: kp.position, targetUrl: kp.target_url });
        pageKeywords.set(url, existing);
      }

      // Find link opportunities: pages that could link to target pages for near-win keywords
      const suggestions: {
        from_url: string;
        to_url: string;
        anchor_text: string;
        reason: string;
        priority: string;
      }[] = [];

      for (const kp of keywordPages) {
        const targetUrl = kp.target_url || kp.ranking_url;
        if (!targetUrl) continue;
        const position = kp.position;

        // Only suggest for keywords in striking distance (11–30)
        if (!position || position < 11 || position > 30) continue;

        const priority =
          position <= 15 ? "high" : position <= 20 ? "medium" : "low";

        // Find other pages that could contextually link to this target
        for (const [pageUrl, pageKws] of pageKeywords) {
          if (pageUrl === targetUrl) continue;

          // Check if pages share cluster or related topic
          const hasRelatedTopic = pageKws.some(
            (pk) =>
              kp.cluster && pk.keyword.includes(kp.cluster?.split(" ")[0]) ||
              pk.keyword.split(" ").some((w) => kp.keyword.includes(w) && w.length > 3)
          );

          if (hasRelatedTopic) {
            suggestions.push({
              from_url: pageUrl,
              to_url: targetUrl,
              anchor_text: kp.keyword,
              reason: `Boost "${kp.keyword}" (currently #${position}) by adding internal link from related page.`,
              priority,
            });
          }
        }

        // Also suggest linking from high-authority pages (pages ranking for multiple keywords)
        for (const [pageUrl, pageKws] of pageKeywords) {
          if (pageUrl === targetUrl) continue;
          if (pageKws.length >= 2) {
            const bestPos = Math.min(...pageKws.map((p) => p.position || 100));
            if (bestPos <= 10 && !suggestions.find((s) => s.from_url === pageUrl && s.to_url === targetUrl)) {
              suggestions.push({
                from_url: pageUrl,
                to_url: targetUrl,
                anchor_text: kp.keyword,
                reason: `Link from high-ranking page (#${bestPos}) to boost "${kp.keyword}" at #${position}.`,
                priority,
              });
            }
          }
        }
      }

      // Insert suggestions (limit to top 20 per client)
      const topSuggestions = suggestions
        .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2))
        .slice(0, 20);

      for (const s of topSuggestions) {
        await pool.query(
          `INSERT INTO internal_link_suggestions
           (client_id, from_url, to_url, anchor_text, reason, priority)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [clientId, s.from_url, s.to_url, s.anchor_text, s.reason, s.priority]
        );
      }

      console.log(`  ✓ ${topSuggestions.length} internal link suggestions for client ${clientId}`);
    }

    console.log(`[${new Date().toISOString()}] ✅ Internal link suggestion generation completed`);
  } catch (error) {
    console.error("Fatal error in internal link generation:", error);
  }
}

// ====================================================================
// 4. CONTENT PLANNER (Topical Map Engine)
// ====================================================================
async function generateContentPlan() {
  console.log(`[${new Date().toISOString()}] 📝 Content plan generation started`);

  try {
    const { rows: activeClients } = await pool.query(
      `SELECT id, domain FROM clients WHERE status = 'active'`
    );

    for (const client of activeClients) {
      const clientId = client.id;
      const clientDomain = client.domain;

      // Clear old pending/dismissed suggestions
      await pool.query(
        `DELETE FROM content_suggestions WHERE client_id = $1 AND status IN ('pending','dismissed')`,
        [clientId]
      );

      // Get all keywords with their clusters and ranking data
      const { rows: keywordData } = await pool.query(
        `SELECT k.id, k.keyword, k.cluster, k.target_url,
                rs.position AS client_position, rs.ranking_url
         FROM keywords k
         LEFT JOIN LATERAL (
           SELECT position, ranking_url FROM rank_snapshots
           WHERE keyword_id = k.id AND domain = $2
           ORDER BY snapshot_date DESC LIMIT 1
         ) rs ON true
         WHERE k.client_id = $1 AND k.is_active`,
        [clientId, clientDomain]
      );

      // Get competitor domains
      const { rows: competitors } = await pool.query(
        `SELECT domain FROM competitors WHERE client_id = $1`,
        [clientId]
      );
      const competitorDomains: string[] = competitors.map((r: any) => r.domain);

      // Group keywords by cluster
      const clusterMap = new Map<string, typeof keywordData>();
      for (const kw of keywordData) {
        const cluster = kw.cluster || extractCluster(kw.keyword);
        const existing = clusterMap.get(cluster) || [];
        existing.push({ ...kw, cluster });
        clusterMap.set(cluster, existing);
      }

      const suggestions: {
        cluster_name: string;
        keyword: string;
        suggested_slug: string;
        reason: string;
        priority: string;
      }[] = [];

      for (const [cluster, keywords] of clusterMap) {
        for (const kw of keywords) {
          // High priority: Competitor ranks, client doesn't
          if (competitorDomains.length > 0) {
            const { rows: compRanks } = await pool.query(
              `SELECT domain, position FROM rank_snapshots
               WHERE keyword_id = $1 AND domain = ANY($2) AND position <= 10
               ORDER BY snapshot_date DESC LIMIT 1`,
              [kw.id, competitorDomains]
            );

            if (compRanks.length > 0 && (!kw.client_position || kw.client_position > 30)) {
              suggestions.push({
                cluster_name: cluster,
                keyword: kw.keyword,
                suggested_slug: generateSlug(kw.keyword),
                reason: `Competitor ${compRanks[0].domain} ranks #${compRanks[0].position}. Create dedicated content to capture this traffic.`,
                priority: "high",
              });
              continue;
            }
          }

          // Medium priority: Has keyword but no dedicated page (no target_url)
          if (!kw.target_url && kw.client_position && kw.client_position > 10) {
            suggestions.push({
              cluster_name: cluster,
              keyword: kw.keyword,
              suggested_slug: generateSlug(kw.keyword),
              reason: `Keyword ranks #${kw.client_position} but has no dedicated target page. Create optimized content.`,
              priority: "medium",
            });
            continue;
          }

          // Low priority: Supporting cluster content
          if (!kw.client_position || kw.client_position > 50) {
            suggestions.push({
              cluster_name: cluster,
              keyword: kw.keyword,
              suggested_slug: generateSlug(kw.keyword),
              reason: `Supporting content for the "${cluster}" topic cluster. Builds topical authority.`,
              priority: "low",
            });
          }
        }
      }

      // Insert suggestions (limit to top 30 per client)
      const topSuggestions = suggestions
        .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2))
        .slice(0, 30);

      for (const s of topSuggestions) {
        await pool.query(
          `INSERT INTO content_suggestions
           (client_id, cluster_name, keyword, suggested_slug, reason, priority)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [clientId, s.cluster_name, s.keyword, s.suggested_slug, s.reason, s.priority]
        );
      }

      console.log(`  ✓ ${topSuggestions.length} content suggestions for client ${clientId}`);
    }

    console.log(`[${new Date().toISOString()}] ✅ Content plan generation completed`);
  } catch (error) {
    console.error("Fatal error in content plan generation:", error);
  }
}

// Helper: Extract cluster from keyword (simple n-gram approach)
function extractCluster(keyword: string): string {
  const words = keyword.toLowerCase().split(/\s+/);
  // Use first 2 words as cluster, or full keyword if short
  return words.slice(0, 2).join(" ");
}

// Helper: Generate URL slug from keyword
function generateSlug(keyword: string): string {
  return "/" + keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

// ====================================================================
// 5. COMBINED DAILY JOB
// ====================================================================
async function dailyJob() {
  await fetchRankings();
  await generateOpportunities();
  await generateInternalLinks();
  await generateContentPlan();
}

// Run daily at 02:00 SGT
cron.schedule("0 2 * * *", dailyJob, {
  timezone: "Asia/Singapore",
});

console.log("🕐 Cron worker started — rank checks, opportunities, links, and content plan daily at 02:00 SGT");

export { fetchRankings, generateOpportunities, generateInternalLinks, generateContentPlan };
