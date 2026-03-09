import cron from "node-cron";
import pool from "./db.js";
import { fetchSerpResults, findDomainPosition } from "./services/dataforseo.js";
import dotenv from "dotenv";
dotenv.config();

const BATCH_SIZE = 30; // Max keywords per client as per requirements
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

async function fetchRankings() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] 🔄 Rank check job started`);

  try {
    // Get all active keywords grouped by client (limit 30 per client)
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

    // Group keywords by client
    const keywordsByClient = new Map<string, KeywordData[]>();
    for (const kw of keywords) {
      const clientKeywords = keywordsByClient.get(kw.client_id) || [];
      if (clientKeywords.length < BATCH_SIZE) {
        clientKeywords.push(kw);
        keywordsByClient.set(kw.client_id, clientKeywords);
      }
    }

    // Process each client's keywords
    for (const [clientId, clientKeywords] of keywordsByClient) {
      const clientDomain = clientKeywords[0].domain;
      console.log(`  Processing client ${clientId}: ${clientKeywords.length} keywords`);

      // Get competitors for this client
      const { rows: competitors } = await pool.query<CompetitorData>(
        `SELECT domain, label FROM competitors WHERE client_id = $1`,
        [clientId]
      );

      // All domains to track (client + competitors)
      const domainsToTrack = [clientDomain, ...competitors.map((c) => c.domain)];

      try {
        // Fetch SERP results from DataForSEO
        const serpResults = await fetchSerpResults(
          clientKeywords.map((kw) => ({ id: kw.id, keyword: kw.keyword })),
          "Singapore", // Default location
          "en", // Default language
          10 // Depth
        );

        const snapshotDate = new Date().toISOString().split("T")[0];

        // Process results for each keyword
        for (const kw of clientKeywords) {
          const serpResult = serpResults.get(kw.id);
          if (!serpResult) {
            console.warn(`  No SERP result for keyword: ${kw.keyword}`);
            continue;
          }

          // Track position for each domain
          for (const domain of domainsToTrack) {
            const positionData = findDomainPosition(serpResult, domain);

            // Get previous position for delta calculation
            const { rows: prevRows } = await pool.query(
              `SELECT position FROM rank_snapshots 
               WHERE keyword_id = $1 AND domain = $2 
               ORDER BY snapshot_date DESC LIMIT 1`,
              [kw.id, domain]
            );
            const prevPosition = prevRows[0]?.position || null;
            const currentPosition = positionData?.position || null;

            // Calculate delta (positive = improved, negative = dropped)
            let delta: number | null = null;
            if (prevPosition !== null && currentPosition !== null) {
              delta = prevPosition - currentPosition;
            }

            // Insert snapshot
            await pool.query(
              `INSERT INTO rank_snapshots 
               (keyword_id, domain, position, ranking_url, snapshot_date, serp_provider, delta)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (keyword_id, domain, snapshot_date) 
               DO UPDATE SET position = $3, ranking_url = $4, serp_provider = $6, delta = $7`,
              [
                kw.id,
                domain,
                currentPosition,
                positionData?.url || null,
                snapshotDate,
                SERP_PROVIDER,
                delta,
              ]
            );
          }
        }

        console.log(`  ✓ Completed client ${clientId}`);
      } catch (error) {
        console.error(`  ✗ Error processing client ${clientId}:`, error);
      }

      // Rate limiting - wait between clients
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`[${endTime.toISOString()}] ✅ Rank check job completed in ${duration}s`);
  } catch (error) {
    console.error("Fatal error in rank check job:", error);
  }
}

// Run daily at 02:00 SGT (Singapore Time)
cron.schedule("0 2 * * *", fetchRankings, {
  timezone: "Asia/Singapore",
});

console.log("🕐 Cron worker started — rank checks daily at 02:00 SGT");

// Also export for manual triggering
export { fetchRankings };
