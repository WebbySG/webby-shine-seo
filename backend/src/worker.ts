import cron from "node-cron";
import pool from "./db.js";
import dotenv from "dotenv";
dotenv.config();

// Placeholder for SERP API integration (Phase 3)
async function fetchRankings() {
  console.log(`[${new Date().toISOString()}] 🔄 Rank check job started`);

  const { rows: keywords } = await pool.query(
    `SELECT k.id, k.keyword, k.search_engine, k.locale, k.location, c.domain
     FROM keywords k JOIN clients c ON c.id = k.client_id
     WHERE k.is_active AND c.status = 'active'`
  );

  console.log(`  Found ${keywords.length} active keywords to check`);

  // TODO: Call SERP API for each keyword batch
  // For each result, INSERT INTO rank_snapshots

  console.log(`[${new Date().toISOString()}] ✅ Rank check job completed`);
}

// Run every Monday at 6am SGT
cron.schedule("0 6 * * 1", fetchRankings, {
  timezone: "Asia/Singapore",
});

console.log("🕐 Cron worker started — rank checks every Monday 6am SGT");
