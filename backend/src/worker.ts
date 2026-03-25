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
// 5. PUBLISHING JOB PROCESSOR
// ====================================================================
const MAX_RETRIES = 3;

async function processPublishingJobs() {
  console.log(`[${new Date().toISOString()}] 📤 Processing publishing jobs`);

  try {
    // Get queued jobs and scheduled jobs whose time has come
    const { rows: jobs } = await pool.query(
      `SELECT * FROM publishing_jobs
       WHERE publish_status IN ('queued', 'scheduled')
         AND (scheduled_time IS NULL OR scheduled_time <= now())
       ORDER BY created_at ASC
       LIMIT 20`
    );

    if (jobs.length === 0) return;
    console.log(`  Found ${jobs.length} jobs to process`);

    for (const job of jobs) {
      try {
        // Mark as processing
        await pool.query(
          `UPDATE publishing_jobs SET publish_status = 'processing', updated_at = now() WHERE id = $1`,
          [job.id]
        );

        let result: { externalPostId: string; publishedUrl: string } | null = null;

        if (job.asset_type === "article" && job.job_type === "publish") {
          result = await processArticlePublish(job);
        } else if (job.asset_type === "social_post" && job.job_type === "publish") {
          result = await processSocialPublish(job);
        } else if (job.asset_type === "video_asset" && job.job_type === "render") {
          result = await processVideoRender(job);
        } else {
          console.log(`  Unsupported job type: ${job.asset_type}/${job.job_type}`);
          result = { externalPostId: `placeholder-${Date.now()}`, publishedUrl: "" };
        }

        // Mark as published
        await pool.query(
          `UPDATE publishing_jobs
           SET publish_status = 'published', external_post_id = $1, published_url = $2, updated_at = now()
           WHERE id = $3`,
          [result?.externalPostId || null, result?.publishedUrl || null, job.id]
        );

        // Log activity + notification
        const { logAndNotify } = await import("./services/activityLogger.js");
        await logAndNotify(
          { clientId: job.client_id, action: "published", entityType: job.asset_type, entityId: job.asset_id, summary: `Published ${job.asset_type} to ${job.platform}` },
          { type: "success", category: "publish", title: `${job.asset_type} published to ${job.platform}` }
        );

        console.log(`  ✓ Job ${job.id} completed (${job.asset_type}/${job.job_type})`);
      } catch (err: any) {
        const retryCount = (job.retry_count || 0) + 1;
        const newStatus = retryCount >= MAX_RETRIES ? "failed" : "queued";

        await pool.query(
          `UPDATE publishing_jobs
           SET publish_status = $1, error_message = $2, retry_count = $3, updated_at = now()
           WHERE id = $4`,
          [newStatus, err.message || "Unknown error", retryCount, job.id]
        );

        console.error(`  ✗ Job ${job.id} failed (attempt ${retryCount}/${MAX_RETRIES}):`, err.message);
      }
    }
  } catch (error) {
    console.error("Fatal error in publishing job processor:", error);
  }
}

async function processArticlePublish(job: any): Promise<{ externalPostId: string; publishedUrl: string }> {
  const { rows: articleRows } = await pool.query(
    `SELECT * FROM seo_articles WHERE id = $1`, [job.asset_id]
  );
  if (articleRows.length === 0) throw new Error("Article not found");
  const article = articleRows[0];

  const { rows: cmsRows } = await pool.query(
    `SELECT site_url, username, application_password FROM cms_connections WHERE client_id = $1 AND cms_type = 'wordpress'`,
    [job.client_id]
  );
  if (cmsRows.length === 0) throw new Error("No WordPress connection configured");

  // Dynamic import to avoid circular deps at startup
  const { publishToWordPress, markdownToHtml } = await import("./services/publishing/wordpressPublisher.js");

  const result = await publishToWordPress(
    { siteUrl: cmsRows[0].site_url, username: cmsRows[0].username, applicationPassword: cmsRows[0].application_password },
    { title: article.title, content: markdownToHtml(article.content), slug: article.slug || "", metaDescription: article.meta_description, scheduleDate: job.scheduled_time?.toISOString() }
  );

  // Update article status
  await pool.query(
    `UPDATE seo_articles SET status = 'published', cms_post_id = $1, cms_post_url = $2, publish_date = now(), updated_at = now() WHERE id = $3`,
    [result.postId, result.url, job.asset_id]
  );

  return { externalPostId: result.postId, publishedUrl: result.url };
}

async function processSocialPublish(job: any): Promise<{ externalPostId: string; publishedUrl: string }> {
  const { rows } = await pool.query(`SELECT * FROM social_posts WHERE id = $1`, [job.asset_id]);
  if (rows.length === 0) throw new Error("Social post not found");

  const { createSocialPublisher } = await import("./services/publishing/socialPublisher.js");
  const publisher = createSocialPublisher(job.platform);

  const result = await publisher.publish({ content: rows[0].content, platform: job.platform, scheduledTime: job.scheduled_time?.toISOString() });

  await pool.query(
    `UPDATE social_posts SET status = 'published' WHERE id = $1`,
    [job.asset_id]
  );

  return { externalPostId: result.externalPostId, publishedUrl: result.publishedUrl };
}

async function processVideoRender(job: any): Promise<{ externalPostId: string; publishedUrl: string }> {
  const { rows } = await pool.query(`SELECT * FROM video_assets WHERE id = $1`, [job.asset_id]);
  if (rows.length === 0) throw new Error("Video asset not found");
  const video = rows[0];
  const sceneBreakdown = typeof video.scene_breakdown === "string" ? JSON.parse(video.scene_breakdown) : video.scene_breakdown;

  // Update status to rendering
  await pool.query(`UPDATE video_assets SET status = 'rendering' WHERE id = $1`, [job.asset_id]);

  const { createVideoRenderer } = await import("./services/video/videoRenderer.js");
  const renderer = createVideoRenderer();

  const result = await renderer.render({
    videoScript: video.video_script,
    sceneBreakdown,
    avatarType: video.avatar_type,
    voiceType: video.voice_type,
    platform: video.platform,
    captionText: video.caption_text,
  });

  // Update video with rendered URLs
  await pool.query(
    `UPDATE video_assets SET status = 'review', video_url = $1, thumbnail_url = $2 WHERE id = $3`,
    [result.videoUrl, result.thumbnailUrl, job.asset_id]
  );

  return { externalPostId: `render-${Date.now()}`, publishedUrl: result.videoUrl };
}

// ====================================================================
// 6. ANALYTICS SYNC & INSIGHT GENERATION
// ====================================================================
async function syncAnalyticsData() {
  console.log(`[${new Date().toISOString()}] 📊 Analytics sync started`);

  try {
    const { rows: connections } = await pool.query(
      `SELECT ac.*, c.domain FROM analytics_connections ac
       JOIN clients c ON c.id = ac.client_id
       WHERE ac.status = 'active'`
    );

    for (const conn of connections) {
      try {
        if (conn.provider === "gsc" && conn.access_token) {
          const { fetchGscPagePerformance, fetchGscKeywordPerformance } = await import("./services/analytics/gscService.js");
          const endDate = new Date().toISOString().split("T")[0];
          const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

          const pages = await fetchGscPagePerformance(
            { accessToken: conn.access_token, refreshToken: conn.refresh_token, siteUrl: conn.site_url },
            startDate, endDate
          );

          for (const p of pages) {
            await pool.query(
              `INSERT INTO page_performance_snapshots (client_id, page_url, source, clicks, impressions, ctr, average_position, snapshot_date)
               VALUES ($1, $2, 'gsc', $3, $4, $5, $6, CURRENT_DATE)
               ON CONFLICT DO NOTHING`,
              [conn.client_id, p.page, p.clicks, p.impressions, p.ctr, p.position]
            );
          }

          const keywords = await fetchGscKeywordPerformance(
            { accessToken: conn.access_token, refreshToken: conn.refresh_token, siteUrl: conn.site_url },
            startDate, endDate
          );

          for (const k of keywords) {
            // Try to match keyword to existing keyword_id
            const { rows: kwMatch } = await pool.query(
              `SELECT id FROM keywords WHERE client_id = $1 AND keyword ILIKE $2 LIMIT 1`,
              [conn.client_id, k.query]
            );
            await pool.query(
              `INSERT INTO keyword_performance_snapshots (client_id, keyword_id, page_url, clicks, impressions, ctr, average_position, snapshot_date)
               VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
               ON CONFLICT DO NOTHING`,
              [conn.client_id, kwMatch[0]?.id || null, k.page, k.clicks, k.impressions, k.ctr, k.position]
            );
          }

          console.log(`  ✓ GSC sync for client ${conn.client_id}: ${pages.length} pages, ${keywords.length} keywords`);
        }

        if (conn.provider === "ga4" && conn.access_token) {
          const { fetchGa4PagePerformance } = await import("./services/analytics/ga4Service.js");
          const endDate = new Date().toISOString().split("T")[0];
          const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

          const pages = await fetchGa4PagePerformance(
            { accessToken: conn.access_token, refreshToken: conn.refresh_token, propertyId: conn.property_id },
            startDate, endDate
          );

          for (const p of pages) {
            await pool.query(
              `INSERT INTO page_performance_snapshots (client_id, page_url, source, sessions, users, engagement_rate, snapshot_date)
               VALUES ($1, $2, 'ga4', $3, $4, $5, CURRENT_DATE)
               ON CONFLICT DO NOTHING`,
              [conn.client_id, p.pagePath, p.sessions, p.users, p.engagementRate]
            );
          }

          console.log(`  ✓ GA4 sync for client ${conn.client_id}: ${pages.length} pages`);
        }
      } catch (err: any) {
        console.error(`  ✗ Analytics sync error for client ${conn.client_id} (${conn.provider}):`, err.message);
      }
    }

    // Generate insights for all active clients
    const { rows: activeClients } = await pool.query(
      `SELECT DISTINCT client_id FROM analytics_connections WHERE status = 'active'`
    );
    for (const c of activeClients) {
      try {
        const { generatePerformanceInsights } = await import("./services/analytics/insightEngine.js");
        const count = await generatePerformanceInsights(c.client_id);
        console.log(`  ✓ Generated ${count} insights for client ${c.client_id}`);
      } catch (err: any) {
        console.error(`  ✗ Insight generation error for client ${c.client_id}:`, err.message);
      }
    }

    console.log(`[${new Date().toISOString()}] ✅ Analytics sync completed`);
  } catch (error) {
    console.error("Fatal error in analytics sync:", error);
  }
}

// ====================================================================
// 7. GBP SYNC
// ====================================================================
async function syncGbpData() {
  console.log(`[${new Date().toISOString()}] 📍 GBP sync started`);
  try {
    const { rows: conns } = await pool.query(
      `SELECT * FROM gbp_connections WHERE status = 'connected'`
    );
    for (const conn of conns) {
      try {
        const { fetchGbpProfile, calculateCompleteness, fetchGbpReviews, fetchGbpQuestions, generateLocalSeoInsights } =
          await import("./services/local/gbpService.js");

        const profile = await fetchGbpProfile({
          accessToken: conn.access_token, refreshToken: conn.refresh_token,
          accountId: conn.account_id, locationId: conn.location_id,
        });
        const completeness = calculateCompleteness(profile);

        await pool.query(
          `INSERT INTO gbp_profile_snapshots
           (client_id, location_id, business_name, primary_category, additional_categories, address, phone, website_url, business_description, opening_hours, services_count, products_count, photos_count, posts_count, reviews_count, average_rating, qna_count, completeness_score)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [conn.client_id, conn.location_id, profile.businessName, profile.primaryCategory,
            JSON.stringify(profile.additionalCategories), profile.address, profile.phone, profile.websiteUrl,
            profile.businessDescription, profile.openingHours ? JSON.stringify(profile.openingHours) : null,
            profile.servicesCount, profile.productsCount, profile.photosCount, profile.postsCount,
            profile.reviewsCount, profile.averageRating, profile.qnaCount, completeness.score]
        );

        const reviews = await fetchGbpReviews({
          accessToken: conn.access_token, refreshToken: conn.refresh_token,
          accountId: conn.account_id, locationId: conn.location_id,
        });
        for (const r of reviews) {
          await pool.query(
            `INSERT INTO gbp_review_items (client_id, review_id, reviewer_name, rating, review_text, review_date)
             VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
            [conn.client_id, r.reviewId, r.reviewerName, r.rating, r.reviewText, r.reviewDate]
          );
        }

        const questions = await fetchGbpQuestions({
          accessToken: conn.access_token, refreshToken: conn.refresh_token,
          accountId: conn.account_id, locationId: conn.location_id,
        });
        for (const q of questions) {
          await pool.query(
            `INSERT INTO gbp_qna_items (client_id, question_id, question_text)
             VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
            [conn.client_id, q.questionId, q.questionText]
          );
        }

        const insightCount = await generateLocalSeoInsights(conn.client_id);
        console.log(`  ✓ GBP sync for client ${conn.client_id}: score=${completeness.score}, insights=${insightCount}`);
      } catch (err: any) {
        console.error(`  ✗ GBP sync error for client ${conn.client_id}:`, err.message);
      }
    }
    console.log(`[${new Date().toISOString()}] ✅ GBP sync completed`);
  } catch (error) {
    console.error("Fatal error in GBP sync:", error);
  }
}

// ====================================================================
// 8. ADS SYNC
// ====================================================================
async function syncAdsData() {
  console.log(`[${new Date().toISOString()}] 💰 Ads sync started`);
  try {
    const { rows: conns } = await pool.query(`SELECT * FROM google_ads_connections WHERE status = 'connected'`);
    for (const conn of conns) {
      try {
        const { generateAdsInsights } = await import("./services/ads/googleAdsService.js");
        const count = await generateAdsInsights(conn.client_id);
        console.log(`  ✓ Ads insights for client ${conn.client_id}: ${count}`);
      } catch (err: any) {
        console.error(`  ✗ Ads sync error for client ${conn.client_id}:`, err.message);
      }
    }
    console.log(`[${new Date().toISOString()}] ✅ Ads sync completed`);
  } catch (error) {
    console.error("Fatal error in ads sync:", error);
  }
}

// ====================================================================
// 9. COMMAND CENTER RECOMPUTATION
// ====================================================================
async function recomputeCommandCenter() {
  console.log(`[${new Date().toISOString()}] 📊 Command center recomputation started`);

  try {
    const { rows: activeClients } = await pool.query(
      `SELECT id FROM clients WHERE status = 'active'`
    );

    for (const client of activeClients) {
      try {
        const { recomputePriorities, generateCrossChannelRecommendations } =
          await import("./services/command/commandCenterService.js");

        const priorityCount = await recomputePriorities(client.id);
        const recCount = await generateCrossChannelRecommendations(client.id);

        console.log(
          `  ✓ Client ${client.id}: ${priorityCount} priorities, ${recCount} cross-channel recommendations`
        );
      } catch (err: any) {
        console.error(`  ✗ Error for client ${client.id}:`, err.message);
      }
    }

    console.log(`[${new Date().toISOString()}] ✅ Command center recomputation completed`);
  } catch (error) {
    console.error("Fatal error in command center recomputation:", error);
  }
}

// ====================================================================
// 10. WEEKLY PLAN GENERATION
// ====================================================================
async function generateWeeklyPlans() {
  console.log(`[${new Date().toISOString()}] 📅 Weekly plan generation started`);

  try {
    const { rows: activeClients } = await pool.query(
      `SELECT id FROM clients WHERE status = 'active'`
    );

    for (const client of activeClients) {
      try {
        const { generateWeeklyPlan } = await import("./services/command/commandCenterService.js");
        const planId = await generateWeeklyPlan(client.id);
        console.log(`  ✓ Weekly plan generated for client ${client.id}: ${planId}`);
      } catch (err: any) {
        console.error(`  ✗ Error for client ${client.id}:`, err.message);
      }
    }

    console.log(`[${new Date().toISOString()}] ✅ Weekly plan generation completed`);
  } catch (error) {
    console.error("Fatal error in weekly plan generation:", error);
  }
}

// ====================================================================
// 11. CRM AUTOMATION JOBS
// ====================================================================
async function recomputeAttribution() {
  console.log(`[${new Date().toISOString()}] 🔄 Attribution recompute started`);
  try {
    const { rows: activeClients } = await pool.query(`SELECT id FROM clients WHERE status = 'active'`);
    for (const client of activeClients) {
      try {
        const attributionService = await import("./services/crm/attributionService.js");
        await attributionService.computeFirstTouchAttribution(client.id);
        await attributionService.computeLastTouchAttribution(client.id);
        await attributionService.computeLinearAttribution(client.id);
        console.log(`  ✓ Attribution recomputed for client ${client.id}`);
      } catch (err: any) {
        console.error(`  ✗ Attribution error for client ${client.id}:`, err.message);
      }
    }
    console.log(`[${new Date().toISOString()}] ✅ Attribution recompute completed`);
  } catch (error) {
    console.error("Fatal error in attribution recompute:", error);
  }
}

async function recomputeCrmInsights() {
  console.log(`[${new Date().toISOString()}] 💡 CRM insight recompute started`);
  try {
    const { rows: activeClients } = await pool.query(`SELECT id FROM clients WHERE status = 'active'`);
    for (const client of activeClients) {
      try {
        const insightService = await import("./services/crm/insightService.js");
        const count = await insightService.recomputeCrmInsights(client.id);
        console.log(`  ✓ ${count} CRM insights for client ${client.id}`);
      } catch (err: any) {
        console.error(`  ✗ CRM insight error for client ${client.id}:`, err.message);
      }
    }
    console.log(`[${new Date().toISOString()}] ✅ CRM insight recompute completed`);
  } catch (error) {
    console.error("Fatal error in CRM insight recompute:", error);
  }
}

async function sendActivityReminders() {
  console.log(`[${new Date().toISOString()}] ⏰ Activity reminder check started`);
  try {
    const { rows: overdue } = await pool.query(
      `SELECT a.*, c.full_name as contact_name, cl.name as client_name
       FROM crm_activities a
       LEFT JOIN crm_contacts c ON c.id = a.contact_id
       JOIN clients cl ON cl.id = a.client_id
       WHERE a.completed_at IS NULL AND a.due_date < NOW()
       ORDER BY a.due_date ASC`
    );
    if (overdue.length > 0) {
      console.log(`  ⚠ ${overdue.length} overdue activities found`);
      for (const act of overdue) {
        console.log(`    - "${act.title}" for ${act.client_name} (due ${act.due_date})`);
      }
    } else {
      console.log(`  ✓ No overdue activities`);
    }
    console.log(`[${new Date().toISOString()}] ✅ Activity reminder check completed`);
  } catch (error) {
    console.error("Fatal error in activity reminders:", error);
  }
}

// NOTE: Individual jobs are scheduled below on staggered crons.
// Do NOT use a combined dailyJob() — it causes double execution
// since analytics, GBP, ads, command center already have dedicated slots.

// Rank tracking + derivative jobs at 02:00 SGT
cron.schedule("0 2 * * *", async () => {
  await fetchRankings();
  await generateOpportunities();
  await generateInternalLinks();
  await generateContentPlan();
}, { timezone: "Asia/Singapore" });

// Process publishing jobs every minute
cron.schedule("* * * * *", processPublishingJobs);

// Analytics sync daily at 04:00 SGT
cron.schedule("0 4 * * *", syncAnalyticsData, { timezone: "Asia/Singapore" });

// GBP sync daily at 05:00 SGT
cron.schedule("0 5 * * *", syncGbpData, { timezone: "Asia/Singapore" });

// Ads sync daily at 06:00 SGT
cron.schedule("0 6 * * *", syncAdsData, { timezone: "Asia/Singapore" });

// Command center recomputation daily at 07:00 SGT (after all data syncs)
cron.schedule("0 7 * * *", recomputeCommandCenter, { timezone: "Asia/Singapore" });

// Weekly plan generation every Monday at 08:00 SGT
cron.schedule("0 8 * * 1", generateWeeklyPlans, { timezone: "Asia/Singapore" });

// CRM attribution recompute daily at 03:00 SGT
cron.schedule("0 3 * * *", recomputeAttribution, { timezone: "Asia/Singapore" });

// CRM insight recompute daily at 03:30 SGT
cron.schedule("30 3 * * *", recomputeCrmInsights, { timezone: "Asia/Singapore" });

// Activity reminders daily at 09:00 SGT
cron.schedule("0 9 * * *", sendActivityReminders, { timezone: "Asia/Singapore" });

// ====================================================================
// PHASE 20: INVITE EXPIRY, USAGE ROLLUP, APPROVAL REMINDERS
// ====================================================================
async function checkInviteExpiry() {
  console.log(`[${new Date().toISOString()}] 📧 Invite expiry check started`);
  try {
    const { rowCount } = await pool.query(
      `UPDATE invites SET status = 'expired', updated_at = NOW() WHERE status = 'pending' AND expires_at < NOW()`
    );
    console.log(`  ✓ Expired ${rowCount || 0} invites`);
  } catch (error) {
    console.error("Error in invite expiry check:", error);
  }
}

async function usageRollup() {
  console.log(`[${new Date().toISOString()}] 📊 Usage rollup started`);
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM usage_events WHERE created_at < NOW() - INTERVAL '90 days'`
    );
    console.log(`  ✓ Cleaned ${rowCount || 0} old usage events`);
  } catch (error) {
    console.error("Error in usage rollup:", error);
  }
}

async function sendApprovalReminders() {
  console.log(`[${new Date().toISOString()}] 🔔 Approval reminder check started`);
  try {
    const { rows } = await pool.query(
      `SELECT ca.id, ca.asset_type, ca.client_id, c.name as client_name
       FROM client_approvals ca
       JOIN clients c ON c.id = ca.client_id
       WHERE ca.status = 'pending' AND ca.created_at < NOW() - INTERVAL '2 days'`
    );
    console.log(`  ✓ ${rows.length} pending approvals need reminders`);
    // In production: send email/notification reminders
  } catch (error) {
    console.error("Error in approval reminders:", error);
  }
}

// Invite expiry daily at 01:00 SGT
cron.schedule("0 1 * * *", checkInviteExpiry, { timezone: "Asia/Singapore" });

// Usage rollup daily at 01:30 SGT
cron.schedule("30 1 * * *", usageRollup, { timezone: "Asia/Singapore" });

// Approval reminders daily at 10:00 SGT
cron.schedule("0 10 * * *", sendApprovalReminders, { timezone: "Asia/Singapore" });

console.log("🕐 Cron worker started — Phase 21: onboarding setup 01:45, activation recompute 02:30, invite expiry 01:00, usage rollup 01:30, ranks 02:00, attribution 03:00, CRM insights 03:30, analytics 04:00, GBP 05:00, Ads 06:00, Command 07:00, Weekly plans Monday 08:00, activity reminders 09:00, approval reminders 10:00, publishing every minute");

// ====================================================================
// PHASE 21: ONBOARDING & ACTIVATION JOBS
// ====================================================================
async function recomputeActivation() {
  console.log(`[${new Date().toISOString()}] 🚀 Activation recompute started`);
  try {
    // Auto-complete checklist items where integrations exist
    await pool.query(
      `UPDATE activation_checklists ac SET status = 'completed', updated_at = NOW()
       WHERE ac.item_key = 'connect_gsc' AND ac.status = 'pending'
       AND EXISTS (SELECT 1 FROM analytics_connections an WHERE an.client_id = ac.client_id AND an.provider = 'gsc' AND an.status = 'active')`
    );
    await pool.query(
      `UPDATE activation_checklists ac SET status = 'completed', updated_at = NOW()
       WHERE ac.item_key = 'connect_ga4' AND ac.status = 'pending'
       AND EXISTS (SELECT 1 FROM analytics_connections an WHERE an.client_id = ac.client_id AND an.provider = 'ga4' AND an.status = 'active')`
    );
    await pool.query(
      `UPDATE activation_checklists ac SET status = 'completed', updated_at = NOW()
       WHERE ac.item_key = 'connect_gbp' AND ac.status = 'pending'
       AND EXISTS (SELECT 1 FROM gbp_connections g WHERE g.client_id = ac.client_id AND g.status = 'active')`
    );
    await pool.query(
      `UPDATE activation_checklists ac SET status = 'completed', updated_at = NOW()
       WHERE ac.item_key = 'connect_wordpress' AND ac.status = 'pending'
       AND EXISTS (SELECT 1 FROM cms_connections cm WHERE cm.client_id = ac.client_id)`
    );
    await pool.query(
      `UPDATE activation_checklists ac SET status = 'completed', updated_at = NOW()
       WHERE ac.item_key = 'generate_first_article' AND ac.status = 'pending'
       AND EXISTS (SELECT 1 FROM seo_articles sa WHERE sa.client_id = ac.client_id)`
    );
    console.log(`  ✓ Activation checklist auto-complete done`);
  } catch (error) {
    console.error("Error in activation recompute:", error);
  }
}

async function abandonStaleOnboarding() {
  console.log(`[${new Date().toISOString()}] 📋 Stale onboarding check started`);
  try {
    const { rowCount } = await pool.query(
      `UPDATE onboarding_sessions SET status = 'abandoned', updated_at = NOW()
       WHERE status = 'in_progress' AND updated_at < NOW() - INTERVAL '30 days'`
    );
    console.log(`  ✓ Abandoned ${rowCount || 0} stale onboarding sessions`);
  } catch (error) {
    console.error("Error in stale onboarding check:", error);
  }
}

// Activation recompute daily at 02:30 SGT
cron.schedule("30 2 * * *", recomputeActivation, { timezone: "Asia/Singapore" });

// Stale onboarding cleanup daily at 01:45 SGT
cron.schedule("45 1 * * *", abandonStaleOnboarding, { timezone: "Asia/Singapore" });

// ====================================================================
// PHASE 23: SCHEDULED REPORTS
// ====================================================================
async function processScheduledReportsJob() {
  console.log(`[${new Date().toISOString()}] 📊 Scheduled reports job started`);
  try {
    const { processScheduledReports } = await import("./services/reports/reportService.js");
    await processScheduledReports();
    console.log(`  ✓ Scheduled reports processed`);
  } catch (error) {
    console.error("Error in scheduled reports job:", error);
  }
}

// Scheduled reports daily at 09:30 SGT
cron.schedule("30 9 * * *", processScheduledReportsJob, { timezone: "Asia/Singapore" });

export {
  fetchRankings,
  generateOpportunities,
  generateInternalLinks,
  generateContentPlan,
  processPublishingJobs,
  syncAnalyticsData,
  syncGbpData,
  syncAdsData,
  recomputeCommandCenter,
  generateWeeklyPlans,
  recomputeAttribution,
  recomputeCrmInsights,
  sendActivityReminders,
  checkInviteExpiry,
  usageRollup,
  sendApprovalReminders,
  recomputeActivation,
  abandonStaleOnboarding,
  processScheduledReportsJob,
};
