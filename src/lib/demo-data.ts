/**
 * Demo data layer for Webby SEO OS.
 * Returns realistic sample data when backend is unavailable.
 * Used only in demo/preview mode — never in production with a live backend.
 * 
 * 🔌 API INTEGRATION POINTS:
 * Each section below maps to a real backend endpoint.
 * When the backend is live, this file is bypassed entirely.
 */

const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_CLIENT_2 = "00000000-0000-0000-0000-000000000002";
const DEMO_CLIENT_3 = "00000000-0000-0000-0000-000000000003";
const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000010";
const now = new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

// ─── Clients ───
// 🔌 API: GET /api/clients
const clients = [
  { id: DEMO_CLIENT_ID, name: "Webby SG", domain: "webby.sg", keywords_count: 42, competitors_count: 5, health_score: 78, status: "active", created_at: daysAgo(90), updated_at: now },
  { id: DEMO_CLIENT_2, name: "TechStart Asia", domain: "techstart.asia", keywords_count: 28, competitors_count: 3, health_score: 65, status: "active", created_at: daysAgo(60), updated_at: now },
  { id: DEMO_CLIENT_3, name: "Green Living Co", domain: "greenliving.co", keywords_count: 15, competitors_count: 4, health_score: 52, status: "active", created_at: daysAgo(30), updated_at: now },
];

// ─── Keywords ───
// 🔌 API: GET /api/clients/:id/keywords
const keywords = [
  { id: "kw1", keyword: "seo agency singapore", current_position: 4, last_position: 7, change: 3, ranking_url: "/seo-agency", tracked_date: daysAgo(1) },
  { id: "kw2", keyword: "digital marketing services", current_position: 8, last_position: 6, change: -2, ranking_url: "/services", tracked_date: daysAgo(1) },
  { id: "kw3", keyword: "web design singapore", current_position: 12, last_position: 15, change: 3, ranking_url: "/web-design", tracked_date: daysAgo(1) },
  { id: "kw4", keyword: "google ads management", current_position: 6, last_position: 8, change: 2, ranking_url: "/google-ads", tracked_date: daysAgo(1) },
  { id: "kw5", keyword: "content marketing agency", current_position: 18, last_position: 22, change: 4, ranking_url: "/content-marketing", tracked_date: daysAgo(1) },
  { id: "kw6", keyword: "local seo services", current_position: 3, last_position: 5, change: 2, ranking_url: "/local-seo", tracked_date: daysAgo(1) },
  { id: "kw7", keyword: "social media management", current_position: 14, last_position: 11, change: -3, ranking_url: "/social-media", tracked_date: daysAgo(1) },
  { id: "kw8", keyword: "ecommerce seo", current_position: 21, last_position: 25, change: 4, ranking_url: "/ecommerce-seo", tracked_date: daysAgo(1) },
  { id: "kw9", keyword: "website audit singapore", current_position: 5, last_position: 9, change: 4, ranking_url: "/audit", tracked_date: daysAgo(1) },
  { id: "kw10", keyword: "ppc management singapore", current_position: 9, last_position: 12, change: 3, ranking_url: "/ppc", tracked_date: daysAgo(1) },
  { id: "kw11", keyword: "best seo company", current_position: 7, last_position: 7, change: 0, ranking_url: "/about", tracked_date: daysAgo(1) },
  { id: "kw12", keyword: "link building service", current_position: 16, last_position: 20, change: 4, ranking_url: "/link-building", tracked_date: daysAgo(1) },
];

// ─── Competitors ───
// 🔌 API: GET /api/clients/:id/competitors
const competitors = [
  { id: "comp1", domain: "competitor-one.com", label: "Competitor One", source: "manual", confirmed: true },
  { id: "comp2", domain: "rival-agency.sg", label: "Rival Agency", source: "dataforseo", confirmed: true },
  { id: "comp3", domain: "seo-pros.asia", label: "SEO Pros Asia", source: "dataforseo", confirmed: false },
];

// ─── Audit Issues (extended) ───
// 🔌 API: GET /api/audit/issues?client_id=:id
const auditIssues = [
  { id: "aud1", audit_run_id: "arun1", issue_type: "missing_meta_description", severity: "critical" as const, affected_url: "/services", description: "Missing meta description tag on service page", fix_instruction: "Add a unique meta description between 120-160 characters that includes the target keyword and a call to action.", why_it_matters: "Meta descriptions directly impact click-through rates in search results.", status: "open" as const, provider: "mock", category: "meta", first_seen_at: daysAgo(14), last_checked_at: daysAgo(1), recheck_count: 1 },
  { id: "aud2", audit_run_id: "arun1", issue_type: "slow_lcp", severity: "warning" as const, affected_url: "/blog/seo-tips", description: "Largest Contentful Paint is 4.2s (target: <2.5s)", fix_instruction: "Optimize hero image, preload critical fonts, defer non-essential JS.", why_it_matters: "LCP is a Core Web Vital used as a Google ranking factor. Slow LCP increases bounce rates.", status: "open" as const, provider: "mock", category: "performance", first_seen_at: daysAgo(10), last_checked_at: daysAgo(2), recheck_count: 0 },
  { id: "aud3", audit_run_id: "arun1", issue_type: "broken_link", severity: "critical" as const, affected_url: "/about", description: "Broken internal link to /old-partner-page returns 404", fix_instruction: "Update link to correct destination or set up a 301 redirect.", why_it_matters: "Broken links waste crawl budget, degrade UX, and can prevent important pages from being indexed.", status: "in_progress" as const, provider: "mock", category: "links", first_seen_at: daysAgo(21), last_checked_at: daysAgo(3), recheck_count: 2 },
  { id: "aud4", audit_run_id: "arun1", issue_type: "missing_alt_text", severity: "info" as const, affected_url: "/portfolio", description: "5 images missing alt text on portfolio page", fix_instruction: "Add descriptive alt text to all images that describes their content.", why_it_matters: "Alt text helps search engines understand images and is required for accessibility.", status: "open" as const, provider: "mock", category: "accessibility", first_seen_at: daysAgo(14), last_checked_at: daysAgo(1), recheck_count: 0 },
  { id: "aud5", audit_run_id: "arun1", issue_type: "duplicate_title", severity: "warning" as const, affected_url: "/blog/page/2", description: "Duplicate title tag shared with /blog/page/3", fix_instruction: "Add unique title with pagination info, e.g. 'Blog — Page 2'.", why_it_matters: "Duplicate titles confuse search engines about which page to rank.", status: "fixed" as const, provider: "mock", category: "meta", first_seen_at: daysAgo(30), last_checked_at: daysAgo(5), recheck_count: 1 },
  { id: "aud6", audit_run_id: "arun1", issue_type: "no_schema_markup", severity: "warning" as const, affected_url: "/services/seo", description: "No structured data found on SEO service page", fix_instruction: "Add FAQ schema markup using JSON-LD to enable rich snippets.", why_it_matters: "Schema markup can enable rich snippets and improve CTR by up to 30%.", status: "open" as const, provider: "mock", category: "structured_data", first_seen_at: daysAgo(14), last_checked_at: daysAgo(1), recheck_count: 0 },
  { id: "aud7", audit_run_id: "arun1", issue_type: "redirect_chain", severity: "warning" as const, affected_url: "/old-services", description: "3-hop redirect chain: /old-services → /services-v2 → /services", fix_instruction: "Update to direct 301 redirect from /old-services to /services.", why_it_matters: "Redirect chains slow page loading and lose link equity at each hop.", status: "open" as const, provider: "mock", category: "links", first_seen_at: daysAgo(20), last_checked_at: daysAgo(2), recheck_count: 0 },
  { id: "aud8", audit_run_id: "arun2", issue_type: "missing_canonical", severity: "warning" as const, affected_url: "/blog/seo-guide", description: "No canonical tag specified on blog post", fix_instruction: "Add a self-referencing canonical tag to prevent duplicate content issues.", why_it_matters: "Without canonical tags, search engines may index duplicate versions.", status: "open" as const, provider: "mock", category: "indexation", first_seen_at: daysAgo(7), last_checked_at: daysAgo(1), recheck_count: 0 },
  { id: "aud9", audit_run_id: "arun2", issue_type: "mixed_content", severity: "critical" as const, affected_url: "/contact", description: "HTTP image loaded on HTTPS page: http://cdn.example.com/map.jpg", fix_instruction: "Update image source to use HTTPS protocol.", why_it_matters: "Mixed content triggers browser security warnings and blocks resources.", status: "open" as const, provider: "mock", category: "security", first_seen_at: daysAgo(7), last_checked_at: daysAgo(1), recheck_count: 0 },
  { id: "aud10", audit_run_id: "arun2", issue_type: "missing_h1", severity: "warning" as const, affected_url: "/pricing", description: "No H1 tag found on pricing page", fix_instruction: "Add a single descriptive H1 that includes the primary keyword.", why_it_matters: "H1 tags establish content hierarchy and help search engines identify the main topic.", status: "open" as const, provider: "mock", category: "content", first_seen_at: daysAgo(7), last_checked_at: daysAgo(1), recheck_count: 0 },
];

// ─── Audit Runs ───
const auditRuns = [
  { id: "arun1", client_id: DEMO_CLIENT_ID, domain: "webby.sg", scope: "full_crawl", provider: "mock", pages_crawled: 47, pages_limit: 500, score: 72, status: "completed", total_issues: 7, critical_count: 2, warning_count: 4, info_count: 1, started_at: daysAgo(14), completed_at: daysAgo(14), created_at: daysAgo(14) },
  { id: "arun2", client_id: DEMO_CLIENT_ID, domain: "webby.sg", scope: "top_pages", provider: "mock", pages_crawled: 12, pages_limit: 50, score: 68, status: "completed", total_issues: 3, critical_count: 1, warning_count: 2, info_count: 0, started_at: daysAgo(7), completed_at: daysAgo(7), created_at: daysAgo(7) },
];

// ─── Audit Pages ───
const auditPages = [
  { id: "ap1", audit_run_id: "arun1", url: "https://webby.sg/", status_code: 200, title: "Webby SG - SEO Agency", meta_description: "Leading SEO agency in Singapore", word_count: 1250, load_time_ms: 1820, issues_count: 0 },
  { id: "ap2", audit_run_id: "arun1", url: "https://webby.sg/services", status_code: 200, title: "Our Services", meta_description: null, word_count: 890, load_time_ms: 2100, issues_count: 1 },
  { id: "ap3", audit_run_id: "arun1", url: "https://webby.sg/about", status_code: 200, title: "About Us", meta_description: "About Webby SG", word_count: 650, load_time_ms: 1650, issues_count: 1 },
  { id: "ap4", audit_run_id: "arun1", url: "https://webby.sg/blog/seo-tips", status_code: 200, title: "SEO Tips", meta_description: "Top SEO tips", word_count: 2100, load_time_ms: 4200, issues_count: 1 },
  { id: "ap5", audit_run_id: "arun1", url: "https://webby.sg/portfolio", status_code: 200, title: "Portfolio", meta_description: "Our work", word_count: 450, load_time_ms: 3100, issues_count: 1 },
];

// ─── Audit Evidence ───
const auditEvidence: Record<string, any[]> = {
  aud1: [{ id: "ev1", audit_issue_id: "aud1", evidence_type: "snapshot", key: "meta_description", value: null, expected_value: "120-160 character description", captured_at: daysAgo(1) }],
  aud2: [{ id: "ev2", audit_issue_id: "aud2", evidence_type: "metric", key: "lcp_ms", value: "4200", expected_value: "<2500", captured_at: daysAgo(2) }, { id: "ev3", audit_issue_id: "aud2", evidence_type: "metric", key: "fcp_ms", value: "1800", expected_value: "<1800", captured_at: daysAgo(2) }],
  aud3: [{ id: "ev4", audit_issue_id: "aud3", evidence_type: "snapshot", key: "link_target", value: "/old-partner-page", expected_value: "200 OK", captured_at: daysAgo(3) }, { id: "ev5", audit_issue_id: "aud3", evidence_type: "snapshot", key: "http_status", value: "404", expected_value: "200", captured_at: daysAgo(3) }],
  aud9: [{ id: "ev6", audit_issue_id: "aud9", evidence_type: "snapshot", key: "insecure_resource", value: "http://cdn.example.com/map.jpg", expected_value: "https://...", captured_at: daysAgo(1) }],
};

// ─── Audit Rechecks ───
const auditRechecks: Record<string, any[]> = {
  aud1: [{ id: "rc1", audit_issue_id: "aud1", audit_run_id: "arun2", provider: "mock", previous_status: "open", new_status: "open", previous_evidence: { meta_description: null }, new_evidence: { meta_description: null }, diff_summary: "Issue persists — meta description still missing.", checked_at: daysAgo(7) }],
  aud3: [
    { id: "rc2", audit_issue_id: "aud3", audit_run_id: "arun1", provider: "mock", previous_status: "open", new_status: "open", previous_evidence: { http_status: "404" }, new_evidence: { http_status: "404" }, diff_summary: "Link still returns 404.", checked_at: daysAgo(14) },
    { id: "rc3", audit_issue_id: "aud3", audit_run_id: "arun2", provider: "mock", previous_status: "open", new_status: "in_progress", previous_evidence: { http_status: "404" }, new_evidence: { http_status: "301" }, diff_summary: "Redirect added but chain detected. Status changed to in_progress.", checked_at: daysAgo(7) },
  ],
  aud5: [{ id: "rc4", audit_issue_id: "aud5", audit_run_id: "arun2", provider: "mock", previous_status: "open", new_status: "fixed", previous_evidence: { title: "Blog" }, new_evidence: { title: "Blog — Page 2" }, diff_summary: "Title updated with pagination. Issue resolved.", checked_at: daysAgo(5) }],
};

// ─── Opportunities ───
// 🔌 API: GET /api/clients/:id/opportunities
const opportunities = [
  { id: "opp1", type: "near_win" as const, keyword: "seo agency singapore", target_url: "/seo-agency", current_position: 4, recommended_action: "Add FAQ schema and improve internal linking", priority: "high" as const, status: "open" as const, created_at: daysAgo(5) },
  { id: "opp2", type: "content_gap" as const, keyword: "ai seo tools", target_url: null, current_position: null, recommended_action: "Create comprehensive guide on AI SEO tools", priority: "medium" as const, status: "open" as const, created_at: daysAgo(3) },
  { id: "opp3", type: "page_expansion" as const, keyword: "web design singapore price", target_url: "/web-design", current_position: 12, recommended_action: "Add pricing section and comparison table", priority: "high" as const, status: "in_progress" as const, created_at: daysAgo(7) },
  { id: "opp4", type: "technical_fix" as const, keyword: null, target_url: "/blog", current_position: null, recommended_action: "Implement breadcrumb schema markup", priority: "low" as const, status: "open" as const, created_at: daysAgo(10) },
];

// ─── Internal Links ───
const internalLinks = [
  { id: "il1", from_url: "/blog/seo-tips", to_url: "/seo-agency", anchor_text: "professional SEO agency", reason: "Topic relevance", priority: "high" as const, status: "pending" as const, created_at: daysAgo(3) },
  { id: "il2", from_url: "/services", to_url: "/web-design", anchor_text: "web design services", reason: "Service cross-link", priority: "medium" as const, status: "implemented" as const, created_at: daysAgo(5) },
];

// ─── Content Plan ───
const contentPlan = {
  total: 4,
  clusters: [
    { cluster_name: "SEO Services", suggestions: [
      { id: "cs1", cluster_name: "SEO Services", keyword: "seo audit checklist 2025", suggested_slug: "/blog/seo-audit-checklist", reason: "High search volume, low competition", priority: "high" as const, status: "pending" as const, created_at: daysAgo(2) },
      { id: "cs2", cluster_name: "SEO Services", keyword: "technical seo guide", suggested_slug: "/blog/technical-seo-guide", reason: "Supporting content for main service page", priority: "medium" as const, status: "planned" as const, created_at: daysAgo(4) },
    ], high_priority_count: 1 },
    { cluster_name: "Web Design", suggestions: [
      { id: "cs3", cluster_name: "Web Design", keyword: "responsive web design best practices", suggested_slug: "/blog/responsive-design", reason: "Content gap opportunity", priority: "medium" as const, status: "pending" as const, created_at: daysAgo(1) },
      { id: "cs4", cluster_name: "Web Design", keyword: "web design trends 2025", suggested_slug: "/blog/web-design-trends", reason: "Trending topic", priority: "high" as const, status: "pending" as const, created_at: daysAgo(6) },
    ], high_priority_count: 1 },
  ],
  flat: [],
};

// ─── Briefs ───
const briefs = [
  { id: "br1", keyword: "seo agency singapore", title: "Best SEO Agency in Singapore — Complete Guide", meta_description: "Find the best SEO agency in Singapore. Compare services, pricing, and results.", headings: [{ level: "H2", text: "What Makes a Great SEO Agency" }, { level: "H2", text: "Top SEO Services to Look For" }], faq: [{ question: "How much does SEO cost in Singapore?", answer: "SEO services in Singapore typically range from $500-$5000/month." }], entities: ["Singapore", "SEO"], internal_links: [], status: "approved" as const, created_at: daysAgo(14) },
];

// ─── Articles ───
// 🔌 API: GET /api/clients/:id/articles
const articles = [
  { id: "art1", brief_id: "br1", title: "Best SEO Agency in Singapore — Complete Guide", meta_description: "Find the best SEO agency in Singapore.", content: "# Best SEO Agency in Singapore\n\nFinding the right SEO partner is critical for business growth...", status: "published" as const, target_keyword: "seo agency singapore", slug: "best-seo-agency-singapore", publish_date: daysAgo(7), cms_post_id: "wp-123", cms_post_url: "https://webby.sg/blog/best-seo-agency-singapore", created_at: daysAgo(14), updated_at: daysAgo(7) },
  { id: "art2", brief_id: null, title: "10 Local SEO Tips for Singapore Businesses", meta_description: "Boost your local visibility with these proven tips.", content: "# 10 Local SEO Tips\n\nLocal SEO is essential for businesses targeting customers in their area...", status: "review" as const, target_keyword: "local seo singapore", slug: "local-seo-tips-singapore", publish_date: null, cms_post_id: null, cms_post_url: null, created_at: daysAgo(5), updated_at: daysAgo(2) },
  { id: "art3", brief_id: null, title: "Google Ads vs SEO: Which Is Right for Your Business?", meta_description: "Compare Google Ads and SEO to find the best strategy.", content: "# Google Ads vs SEO\n\nBoth channels have their strengths...", status: "draft" as const, target_keyword: "google ads vs seo", slug: "google-ads-vs-seo", publish_date: null, cms_post_id: null, cms_post_url: null, created_at: daysAgo(3), updated_at: daysAgo(1) },
];

// ─── Social Posts ───
const socialPosts = [
  { id: "sp1", client_id: DEMO_CLIENT_ID, article_id: "art1", platform: "facebook" as const, content: "🚀 Just published our comprehensive guide to finding the best SEO agency in Singapore! Check it out 👉", status: "published" as const, scheduled_time: daysAgo(6), created_at: daysAgo(7) },
  { id: "sp2", client_id: DEMO_CLIENT_ID, article_id: "art1", platform: "linkedin" as const, content: "We've put together everything you need to know about choosing an SEO agency in Singapore. Read the full guide:", status: "approved" as const, scheduled_time: null, created_at: daysAgo(7) },
  { id: "sp3", client_id: DEMO_CLIENT_ID, article_id: "art2", platform: "instagram" as const, content: "10 Local SEO tips that actually work for Singapore businesses 📍 Save this for later!", status: "draft" as const, scheduled_time: null, created_at: daysAgo(3) },
];

// ─── Videos ───
const videos = [
  { id: "vid1", client_id: DEMO_CLIENT_ID, article_id: "art1", social_post_id: null, platform: "youtube_shorts" as const, video_script: "Looking for the best SEO agency in Singapore? Here are the top 5 things to look for...", scene_breakdown: [{ scene_number: 1, duration: "5s", visual: "Title card", voiceover: "Best SEO Agency Singapore" }], caption_text: "Top 5 things to look for in an SEO agency", avatar_type: "professional", voice_type: "en-US-male", video_url: null, thumbnail_url: null, status: "draft" as const, created_at: daysAgo(4) },
];

// ─── CMS Connection ───
const cmsConnection = { id: "cms1", cms_type: "wordpress" as const, site_url: "https://webby.sg", username: "admin", created_at: daysAgo(60) };

// ─── Publishing Jobs ───
// 🔌 API: GET /api/publishing-jobs, GET /api/clients/:id/publishing-jobs
const publishingJobs = [
  { id: "pj1", client_id: DEMO_CLIENT_ID, asset_type: "article" as const, asset_id: "art1", platform: "wordpress", scheduled_time: null, job_type: "publish" as const, publish_status: "published" as const, provider: "wordpress", external_post_id: "wp-123", published_url: "https://webby.sg/blog/best-seo-agency-singapore", error_message: null, retry_count: 0, created_at: daysAgo(7), updated_at: daysAgo(7), client_name: "Webby SG" },
  { id: "pj2", client_id: DEMO_CLIENT_ID, asset_type: "social_post" as const, asset_id: "sp1", platform: "facebook", scheduled_time: null, job_type: "publish" as const, publish_status: "published" as const, provider: "meta", external_post_id: "fb-456", published_url: null, error_message: null, retry_count: 0, created_at: daysAgo(6), updated_at: daysAgo(6), client_name: "Webby SG" },
  { id: "pj3", client_id: DEMO_CLIENT_ID, asset_type: "social_post" as const, asset_id: "sp3", platform: "instagram", scheduled_time: daysAgo(-2), job_type: "schedule" as const, publish_status: "scheduled" as const, provider: "meta", external_post_id: null, published_url: null, error_message: null, retry_count: 0, created_at: daysAgo(1), updated_at: daysAgo(1), client_name: "Webby SG" },
  { id: "pj4", client_id: DEMO_CLIENT_2, asset_type: "article" as const, asset_id: "art-x", platform: "wordpress", scheduled_time: null, job_type: "publish" as const, publish_status: "failed" as const, provider: "wordpress", external_post_id: null, published_url: null, error_message: "Connection refused: CMS endpoint unreachable", retry_count: 2, created_at: daysAgo(2), updated_at: daysAgo(1), client_name: "TechStart Asia" },
  { id: "pj5", client_id: DEMO_CLIENT_ID, asset_type: "article" as const, asset_id: "art2", platform: "wordpress", scheduled_time: daysAgo(-5), job_type: "schedule" as const, publish_status: "queued" as const, provider: "wordpress", external_post_id: null, published_url: null, error_message: null, retry_count: 0, created_at: daysAgo(3), updated_at: daysAgo(3), client_name: "Webby SG" },
];

// ─── Analytics (Rich data for charts) ───
// 🔌 API: GET /api/clients/:id/performance-summary, page-performance, keyword-performance
const pagePerformance = [
  { page_url: "https://webby.sg/seo-agency", clicks: 3200, impressions: 45000, ctr: 0.071, average_position: 4.2, sessions: 2800, source: "gsc" },
  { page_url: "https://webby.sg/web-design", clicks: 1800, impressions: 32000, ctr: 0.056, average_position: 8.1, sessions: 1600, source: "gsc" },
  { page_url: "https://webby.sg/blog/seo-tips", clicks: 1200, impressions: 28000, ctr: 0.043, average_position: 12.5, sessions: 1100, source: "gsc" },
  { page_url: "https://webby.sg/local-seo", clicks: 980, impressions: 18000, ctr: 0.054, average_position: 5.8, sessions: 850, source: "gsc" },
  { page_url: "https://webby.sg/google-ads", clicks: 750, impressions: 15000, ctr: 0.05, average_position: 7.3, sessions: 680, source: "gsc" },
  { page_url: "https://webby.sg/blog/local-seo-guide", clicks: 620, impressions: 14000, ctr: 0.044, average_position: 9.1, sessions: 550, source: "gsc" },
  { page_url: "https://webby.sg/services", clicks: 540, impressions: 12000, ctr: 0.045, average_position: 11.4, sessions: 480, source: "gsc" },
  { page_url: "https://webby.sg/about", clicks: 420, impressions: 8500, ctr: 0.049, average_position: 15.2, sessions: 380, source: "gsc" },
  { page_url: "https://webby.sg/blog/google-ads-guide", clicks: 380, impressions: 9200, ctr: 0.041, average_position: 14.6, sessions: 340, source: "gsc" },
  { page_url: "https://webby.sg/contact", clicks: 310, impressions: 6000, ctr: 0.052, average_position: 18.3, sessions: 290, source: "gsc" },
];

const keywordPerformance = [
  { keyword: "seo agency singapore", clicks: 2100, impressions: 18000, ctr: 0.117, average_position: 4.0, rank_change: 3 },
  { keyword: "web design singapore", clicks: 980, impressions: 15000, ctr: 0.065, average_position: 8.1, rank_change: 2 },
  { keyword: "local seo services singapore", clicks: 750, impressions: 12000, ctr: 0.063, average_position: 5.3, rank_change: 4 },
  { keyword: "google ads management", clicks: 620, impressions: 11000, ctr: 0.056, average_position: 6.8, rank_change: 1 },
  { keyword: "digital marketing agency", clicks: 540, impressions: 14000, ctr: 0.039, average_position: 12.3, rank_change: -2 },
  { keyword: "content marketing services", clicks: 420, impressions: 9500, ctr: 0.044, average_position: 15.1, rank_change: 3 },
  { keyword: "seo audit singapore", clicks: 380, impressions: 7200, ctr: 0.053, average_position: 7.5, rank_change: 5 },
  { keyword: "website optimization", clicks: 290, impressions: 8800, ctr: 0.033, average_position: 18.7, rank_change: -1 },
];

const performanceSummary = {
  summary: { total_clicks: 12450, total_impressions: 285000, avg_ctr: 0.0437, avg_position: 14.2, total_sessions: 8920 },
  topPages: pagePerformance.slice(0, 5),
  topKeywords: keywordPerformance.slice(0, 5),
  insightCounts: [{ priority: "high", count: 3 }, { priority: "medium", count: 5 }, { priority: "low", count: 2 }],
};

// 🔌 API: GET /api/clients/:id/performance-insights
const performanceInsights = [
  { id: "pi1", client_id: DEMO_CLIENT_ID, asset_type: "page", asset_id: null, insight_type: "winning_content", priority: "high", title: "/seo-agency page is a top performer", description: "This page drives 26% of all organic clicks. Consider expanding with related subtopics.", recommended_action: "Add FAQ section and internal links to supporting content", status: "open", created_at: daysAgo(2) },
  { id: "pi2", client_id: DEMO_CLIENT_ID, asset_type: "page", asset_id: null, insight_type: "declining_content", priority: "high", title: "/blog/seo-tips traffic declining 15%", description: "Page has lost 15% clicks over the past 14 days. May need content refresh.", recommended_action: "Update stats, add 2025 data, refresh examples", status: "open", created_at: daysAgo(3) },
  { id: "pi3", client_id: DEMO_CLIENT_ID, asset_type: "keyword", asset_id: null, insight_type: "low_ctr", priority: "medium", title: "Low CTR on 'digital marketing agency'", description: "Ranking at position 12.3 with only 3.9% CTR. Title tag may not be compelling enough.", recommended_action: "A/B test new title tag with stronger value proposition", status: "open", created_at: daysAgo(1) },
  { id: "pi4", client_id: DEMO_CLIENT_ID, asset_type: "page", asset_id: null, insight_type: "content_expansion", priority: "medium", title: "Expand /google-ads page with case studies", description: "Page ranks position 7.3 but could reach top 5 with more content depth.", recommended_action: "Add 2 case studies and ROI calculator section", status: "open", created_at: daysAgo(4) },
  { id: "pi5", client_id: DEMO_CLIENT_ID, asset_type: "page", asset_id: null, insight_type: "repurpose_opportunity", priority: "low", title: "Repurpose /blog/local-seo-guide into video", description: "This guide performs well organically. A video version could capture YouTube traffic.", recommended_action: "Generate video script from article content", status: "open", created_at: daysAgo(5) },
];

// ─── GBP ───
// 🔌 API: GET /api/clients/:id/gbp-connection, gbp-profile, gbp-posts, gbp-reviews
const gbpConnection = { id: "gbp1", client_id: DEMO_CLIENT_ID, location_id: "loc-123", account_id: "acc-456", business_name: "Webby SG", primary_category: "SEO Agency", site_url: "https://webby.sg", status: "active", created_at: daysAgo(90), updated_at: now };
const gbpProfile = { business_name: "Webby SG", primary_category: "SEO Agency", reviews_count: 47, average_rating: 4.8, photos_count: 23, posts_count: 12, qna_count: 8, completeness: { score: 85, missingItems: ["Business hours need update"], priorityActions: ["Add more photos", "Post weekly updates"] } };
const gbpPosts = [
  { id: "gbp-p1", client_id: DEMO_CLIENT_ID, article_id: "art1", title: "New Blog Post: SEO Guide", content: "Check out our latest guide on finding the best SEO agency in Singapore.", cta_type: "LEARN_MORE", cta_url: "https://webby.sg/blog/best-seo-agency-singapore", image_prompt: null, status: "published", scheduled_time: daysAgo(5), created_at: daysAgo(7) },
];
const gbpReviews = [
  { id: "gbp-r1", client_id: DEMO_CLIENT_ID, review_id: "rev-1", reviewer_name: "John T.", rating: 5, review_text: "Excellent SEO work! Our rankings improved significantly.", review_date: daysAgo(10), response_draft: "Thank you John! We're glad to hear about your results.", response_status: "approved", created_at: daysAgo(10) },
  { id: "gbp-r2", client_id: DEMO_CLIENT_ID, review_id: "rev-2", reviewer_name: "Sarah L.", rating: 4, review_text: "Good service, communication could be faster.", review_date: daysAgo(3), response_draft: null, response_status: "pending", created_at: daysAgo(3) },
];

// ─── CRM ───
// 🔌 API: GET /api/clients/:id/crm/contacts, crm/deals, crm/activities, crm/insights
const crmContacts = [
  { id: "crm-c1", client_id: DEMO_CLIENT_ID, first_name: "Michael", last_name: "Chen", full_name: "Michael Chen", email: "michael@techcorp.sg", phone: "+65 9123 4567", company_name: "TechCorp SG", job_title: "Marketing Director", status: "qualified", source_type: "organic", lead_source: "Website Contact Form", notes: "Interested in monthly SEO retainer", created_at: daysAgo(20), updated_at: daysAgo(5) },
  { id: "crm-c2", client_id: DEMO_CLIENT_ID, first_name: "Lisa", last_name: "Wong", full_name: "Lisa Wong", email: "lisa@greenstart.co", phone: "+65 8765 4321", company_name: "GreenStart Co", job_title: "CEO", status: "lead", source_type: "referral", lead_source: "Partner Referral", notes: "Needs local SEO + GBP management", created_at: daysAgo(7), updated_at: daysAgo(2) },
  { id: "crm-c3", client_id: DEMO_CLIENT_ID, first_name: "David", last_name: "Tan", full_name: "David Tan", email: "david@retailhub.sg", phone: null, company_name: "RetailHub SG", job_title: "E-commerce Manager", status: "customer", source_type: "paid", lead_source: "Google Ads", notes: null, created_at: daysAgo(45), updated_at: daysAgo(10) },
  { id: "crm-c4", client_id: DEMO_CLIENT_ID, first_name: "Rachel", last_name: "Lim", full_name: "Rachel Lim", email: "rachel@beautyhq.sg", phone: "+65 9876 5432", company_name: "BeautyHQ SG", job_title: "Owner", status: "new", source_type: "organic", lead_source: "Website Contact Form", notes: "Interested in social media marketing", created_at: daysAgo(2), updated_at: daysAgo(1) },
  { id: "crm-c5", client_id: DEMO_CLIENT_ID, first_name: "James", last_name: "Ng", full_name: "James Ng", email: "james@lawfirm.sg", phone: "+65 8234 5678", company_name: "Ng & Associates", job_title: "Managing Partner", status: "contacted", source_type: "referral", lead_source: "Client Referral", notes: "Law firm, needs content marketing", created_at: daysAgo(10), updated_at: daysAgo(4) },
];

const crmDeals = [
  { id: "crm-d1", client_id: DEMO_CLIENT_ID, contact_id: "crm-c1", deal_name: "TechCorp Monthly SEO", deal_value: 3500, deal_stage: "proposal_sent", pipeline_name: "Sales Pipeline", expected_close_date: daysAgo(-14), won_date: null, lost_reason: null, notes: "Proposal sent, awaiting feedback", contact_name: "Michael Chen", contact_email: "michael@techcorp.sg", created_at: daysAgo(15), updated_at: daysAgo(3) },
  { id: "crm-d2", client_id: DEMO_CLIENT_ID, contact_id: "crm-c3", deal_name: "RetailHub E-commerce SEO", deal_value: 5000, deal_stage: "won", pipeline_name: "Sales Pipeline", expected_close_date: daysAgo(10), won_date: daysAgo(10), lost_reason: null, notes: "6-month contract signed", contact_name: "David Tan", contact_email: "david@retailhub.sg", created_at: daysAgo(45), updated_at: daysAgo(10) },
  { id: "crm-d3", client_id: DEMO_CLIENT_ID, contact_id: "crm-c2", deal_name: "GreenStart Local SEO Package", deal_value: 2000, deal_stage: "qualified", pipeline_name: "Sales Pipeline", expected_close_date: daysAgo(-30), won_date: null, lost_reason: null, notes: "Discovery call scheduled", contact_name: "Lisa Wong", contact_email: "lisa@greenstart.co", created_at: daysAgo(5), updated_at: daysAgo(1) },
  { id: "crm-d4", client_id: DEMO_CLIENT_ID, contact_id: "crm-c4", deal_name: "BeautyHQ Social Media Package", deal_value: 1500, deal_stage: "lead", pipeline_name: "Sales Pipeline", expected_close_date: daysAgo(-21), won_date: null, lost_reason: null, notes: "Initial inquiry via website", contact_name: "Rachel Lim", contact_email: "rachel@beautyhq.sg", created_at: daysAgo(2), updated_at: daysAgo(1) },
  { id: "crm-d5", client_id: DEMO_CLIENT_ID, contact_id: "crm-c5", deal_name: "Ng & Associates Content Marketing", deal_value: 4200, deal_stage: "negotiation", pipeline_name: "Sales Pipeline", expected_close_date: daysAgo(-7), won_date: null, lost_reason: null, notes: "Negotiating scope and pricing", contact_name: "James Ng", contact_email: "james@lawfirm.sg", created_at: daysAgo(8), updated_at: daysAgo(2) },
];

const crmActivities = [
  { id: "crm-a1", client_id: DEMO_CLIENT_ID, contact_id: "crm-c1", deal_id: "crm-d1", activity_type: "call", title: "Follow-up call with Michael", description: "Discuss proposal details and pricing", due_date: daysAgo(-1), completed_at: null, created_at: daysAgo(3) },
  { id: "crm-a2", client_id: DEMO_CLIENT_ID, contact_id: "crm-c2", deal_id: "crm-d3", activity_type: "meeting", title: "Discovery call with Lisa", description: "Initial consultation for local SEO needs", due_date: daysAgo(-3), completed_at: null, created_at: daysAgo(5) },
  { id: "crm-a3", client_id: DEMO_CLIENT_ID, contact_id: "crm-c3", deal_id: "crm-d2", activity_type: "email", title: "Send onboarding materials to David", description: null, due_date: daysAgo(2), completed_at: daysAgo(2), created_at: daysAgo(8) },
  { id: "crm-a4", client_id: DEMO_CLIENT_ID, contact_id: "crm-c5", deal_id: "crm-d5", activity_type: "follow_up", title: "Send revised proposal to James", description: "Updated scope based on negotiation call", due_date: daysAgo(-2), completed_at: null, created_at: daysAgo(4) },
  { id: "crm-a5", client_id: DEMO_CLIENT_ID, contact_id: "crm-c4", deal_id: "crm-d4", activity_type: "email", title: "Welcome email to Rachel", description: "Send intro email with capabilities deck", due_date: daysAgo(-1), completed_at: null, created_at: daysAgo(1) },
];

const crmInsights = [
  { id: "ci1", client_id: DEMO_CLIENT_ID, insight_type: "deal_velocity", priority: "high", title: "TechCorp deal stalled in proposal stage", description: "Deal has been in proposal stage for 12 days with no activity", recommended_action: "Schedule follow-up call this week", status: "open", created_at: daysAgo(2) },
  { id: "ci2", client_id: DEMO_CLIENT_ID, insight_type: "lead_quality", priority: "medium", title: "2 leads from referrals converting well", description: "Referral leads have 50% higher qualification rate than organic leads", recommended_action: "Consider launching a formal referral program", status: "open", created_at: daysAgo(3) },
  { id: "ci3", client_id: DEMO_CLIENT_ID, insight_type: "pipeline_health", priority: "low", title: "Pipeline weighted value is $16,200", description: "5 active deals in various stages with good distribution", recommended_action: "Focus on moving negotiation-stage deals to close", status: "open", created_at: daysAgo(1) },
];

const attributionOverview = {
  byChannel: [
    { channel: "organic", attribution_model: "first_touch", total_credit: 4, contacts: 4 },
    { channel: "referral", attribution_model: "first_touch", total_credit: 2, contacts: 2 },
    { channel: "paid", attribution_model: "first_touch", total_credit: 1, contacts: 1 },
    { channel: "direct", attribution_model: "first_touch", total_credit: 1, contacts: 1 },
  ],
  dealAttribution: [
    { channel: "organic", attribution_model: "first_touch", attributed_revenue: 8500, deals: 2 },
    { channel: "paid", attribution_model: "first_touch", attributed_revenue: 5000, deals: 1 },
    { channel: "referral", attribution_model: "first_touch", attributed_revenue: 6200, deals: 2 },
  ],
};

// ─── Google Ads ───
// 🔌 API: GET /api/clients/:id/ads-campaigns, ads-performance
const adsCampaigns = [
  { id: "ac1", client_id: DEMO_CLIENT_ID, name: "SEO Services - Singapore", campaign_type: "search", status: "active", budget_daily: 50, location_targets: ["Singapore"], created_at: daysAgo(60) },
  { id: "ac2", client_id: DEMO_CLIENT_ID, name: "Web Design - Remarketing", campaign_type: "display", status: "paused", budget_daily: 30, location_targets: ["Singapore"], created_at: daysAgo(45) },
  { id: "ac3", client_id: DEMO_CLIENT_ID, name: "Local SEO - Singapore", campaign_type: "search", status: "active", budget_daily: 35, location_targets: ["Singapore"], created_at: daysAgo(30) },
];

const adsPerformance = {
  summary: { total_impressions: 45000, total_clicks: 1800, avg_ctr: 4.0, avg_cpc: 2.50, total_cost: 4500, total_conversions: 24, cost_per_conversion: 187.50 },
  campaigns: [
    { name: "SEO Services - Singapore", impressions: 35000, clicks: 1400, ctr: 4.0, cpc: 2.30, cost: 3220, conversions: 18 },
    { name: "Web Design - Remarketing", impressions: 10000, clicks: 400, ctr: 4.0, cpc: 3.20, cost: 1280, conversions: 6 },
    { name: "Local SEO - Singapore", impressions: 8500, clicks: 380, ctr: 4.5, cpc: 1.90, cost: 722, conversions: 8 },
  ],
};

// ─── Command Center ───
// 🔌 API: GET /api/clients/:id/command-center
const commandSummary = {
  totalPriorities: 12, highPriorityCount: 4, quickWinsCount: 3, repurposeCount: 2,
  decliningAssetsCount: 1, nearPage1Count: 2, gbpIssuesCount: 1, adsOpportunitiesCount: 2,
  weeklyTasksDue: 8, weeklyTasksCompleted: 5,
  topGrowthChannels: [{ channel: "Organic SEO", score: 85 }, { channel: "Local SEO", score: 72 }, { channel: "Content", score: 68 }],
  topUnderperformingChannels: [{ channel: "Social Media", score: 35 }, { channel: "Paid Ads", score: 48 }],
};

const marketingPriorities = [
  { id: "mp1", client_id: DEMO_CLIENT_ID, priority_type: "near_win", source_module: "rankings", source_id: "kw1", title: "Push 'seo agency singapore' to position 1-3", description: "Currently at position 4, within striking distance", recommended_action: "Add FAQ schema, improve internal linking, build 2 backlinks", priority_score: 92, impact_score: 95, effort_score: 40, confidence_score: 85, status: "open", due_date: daysAgo(-7), created_at: daysAgo(5) },
  { id: "mp2", client_id: DEMO_CLIENT_ID, priority_type: "content_gap", source_module: "content", source_id: null, title: "Create AI SEO tools comparison article", description: "High-volume keyword with no existing content", recommended_action: "Generate brief and draft article", priority_score: 78, impact_score: 70, effort_score: 60, confidence_score: 75, status: "open", due_date: daysAgo(-14), created_at: daysAgo(3) },
  { id: "mp3", client_id: DEMO_CLIENT_ID, priority_type: "declining_asset", source_module: "analytics", source_id: null, title: "Refresh declining /blog/seo-tips page", description: "Traffic down 15% in 14 days", recommended_action: "Update content with 2025 statistics and examples", priority_score: 75, impact_score: 65, effort_score: 45, confidence_score: 80, status: "open", due_date: daysAgo(-10), created_at: daysAgo(2) },
];

// ─── Creative Assets ───
const creativeAssets = [
  { id: "ca1", client_id: DEMO_CLIENT_ID, asset_type: "social_graphic", source_type: "article", source_id: "art1", platform: "facebook", title: "SEO Agency Guide Social Card", prompt: "Modern social media graphic for SEO agency guide", aspect_ratio: "1:1", style_preset: "professional", provider: "template", file_url: null, thumbnail_url: null, status: "approved", metadata_json: {}, created_at: daysAgo(7), updated_at: daysAgo(6) },
];

// ─── Activity Log ───
// 🔌 API: GET /api/activity
const activityLog = [
  { id: "al1", workspace_id: DEMO_WORKSPACE_ID, client_id: DEMO_CLIENT_ID, user_id: null, actor_name: "Demo Admin", action: "article_published", entity_type: "article", entity_id: "art1", summary: "Published 'Best SEO Agency in Singapore' to WordPress", metadata_json: {}, created_at: daysAgo(7) },
  { id: "al2", workspace_id: DEMO_WORKSPACE_ID, client_id: DEMO_CLIENT_ID, user_id: null, actor_name: "System", action: "rank_check_completed", entity_type: "client", entity_id: DEMO_CLIENT_ID, summary: "Rank check completed: 42 keywords tracked, 6 improved", metadata_json: {}, created_at: daysAgo(1) },
  { id: "al3", workspace_id: DEMO_WORKSPACE_ID, client_id: DEMO_CLIENT_ID, user_id: null, actor_name: "Demo Admin", action: "deal_created", entity_type: "deal", entity_id: "crm-d1", summary: "Created deal 'TechCorp Monthly SEO' worth $3,500", metadata_json: {}, created_at: daysAgo(15) },
  { id: "al4", workspace_id: DEMO_WORKSPACE_ID, client_id: DEMO_CLIENT_ID, user_id: null, actor_name: "System", action: "social_post_published", entity_type: "social_post", entity_id: "sp1", summary: "Published social post to Facebook", metadata_json: {}, created_at: daysAgo(6) },
  { id: "al5", workspace_id: DEMO_WORKSPACE_ID, client_id: null, user_id: null, actor_name: "Demo Admin", action: "client_created", entity_type: "client", entity_id: DEMO_CLIENT_3, summary: "Created client 'Green Living Co'", metadata_json: {}, created_at: daysAgo(30) },
  { id: "al6", workspace_id: DEMO_WORKSPACE_ID, client_id: DEMO_CLIENT_ID, user_id: null, actor_name: "Demo Admin", action: "crm_lead_captured", entity_type: "contact", entity_id: "crm-c4", summary: "New lead captured: Rachel Lim from BeautyHQ SG", metadata_json: {}, created_at: daysAgo(2) },
];

// ─── Notifications ───
const notifications = [
  { id: "n1", workspace_id: DEMO_WORKSPACE_ID, user_id: null, type: "info", category: "publishing", title: "Article Published Successfully", message: "'Best SEO Agency in Singapore' is now live on WordPress", entity_type: "article", entity_id: "art1", is_read: false, created_at: daysAgo(7) },
  { id: "n2", workspace_id: DEMO_WORKSPACE_ID, user_id: null, type: "warning", category: "publishing", title: "Publishing Job Failed", message: "WordPress connection refused for TechStart Asia article", entity_type: "publishing_job", entity_id: "pj4", is_read: false, created_at: daysAgo(2) },
  { id: "n3", workspace_id: DEMO_WORKSPACE_ID, user_id: null, type: "info", category: "seo", title: "Rank Check Complete", message: "42 keywords checked — 6 improved, 2 declined", entity_type: "client", entity_id: DEMO_CLIENT_ID, is_read: true, created_at: daysAgo(1) },
  { id: "n4", workspace_id: DEMO_WORKSPACE_ID, user_id: null, type: "info", category: "crm", title: "New Lead Captured", message: "Rachel Lim from BeautyHQ SG submitted a contact form", entity_type: "contact", entity_id: "crm-c4", is_read: false, created_at: daysAgo(2) },
];

// ─── AI Visibility ───
// 🔌 API: GET /api/clients/:id/ai-visibility/prompt-sets, runs, overview
const aiVisPromptSets = [
  { id: "avps1", client_id: DEMO_CLIENT_ID, name: "SEO Services Visibility", description: "Track mentions of Webby SG in SEO-related AI queries", topic_cluster: "SEO Services", intent_type: "commercial", status: "active", prompt_count: 3, run_count: 2, created_at: daysAgo(14) },
  { id: "avps2", client_id: DEMO_CLIENT_ID, name: "Web Design Queries", description: "Monitor AI recommendations for web design in Singapore", topic_cluster: "Web Design", intent_type: "commercial", status: "active", prompt_count: 2, run_count: 1, created_at: daysAgo(10) },
];

const aiVisRuns = [
  { id: "avr1", client_id: DEMO_CLIENT_ID, prompt_set_id: "avps1", prompt_set_name: "SEO Services Visibility", provider: "manual", status: "completed", total_prompts: 3, prompts_with_mention: 1, prompts_with_citation: 0, started_at: daysAgo(7), completed_at: daysAgo(7), created_at: daysAgo(7) },
  { id: "avr2", client_id: DEMO_CLIENT_ID, prompt_set_id: "avps1", prompt_set_name: "SEO Services Visibility", provider: "manual", status: "completed", total_prompts: 3, prompts_with_mention: 2, prompts_with_citation: 1, started_at: daysAgo(1), completed_at: daysAgo(1), created_at: daysAgo(1) },
  { id: "avr3", client_id: DEMO_CLIENT_ID, prompt_set_id: "avps2", prompt_set_name: "Web Design Queries", provider: "manual", status: "completed", total_prompts: 2, prompts_with_mention: 1, prompts_with_citation: 1, started_at: daysAgo(3), completed_at: daysAgo(3), created_at: daysAgo(3) },
];

const aiVisOverview = {
  summary: { visibility_rate: 55, citation_rate: 33, total_runs: 3, total_prompts_checked: 8 },
  trend: [
    { created_at: daysAgo(14), total_prompts: 3, prompts_with_mention: 0, prompts_with_citation: 0 },
    { created_at: daysAgo(7), total_prompts: 3, prompts_with_mention: 1, prompts_with_citation: 0 },
    { created_at: daysAgo(3), total_prompts: 2, prompts_with_mention: 1, prompts_with_citation: 1 },
    { created_at: daysAgo(1), total_prompts: 3, prompts_with_mention: 2, prompts_with_citation: 1 },
  ],
  byPromptSet: [
    { name: "SEO Services Visibility", avg_visibility_rate: 50, avg_citation_rate: 17 },
    { name: "Web Design Queries", avg_visibility_rate: 50, avg_citation_rate: 50 },
  ],
  competitorMentions: [
    { competitor: "competitor-one.com", mention_count: 4 },
    { competitor: "rival-agency.sg", mention_count: 2 },
    { competitor: "seo-pros.asia", mention_count: 3 },
  ],
};

// ─── Report Templates ───
const reportTemplates = [
  { id: "rt1", workspace_id: DEMO_WORKSPACE_ID, name: "Monthly SEO Report", description: "Comprehensive SEO performance overview", report_type: "seo", sections: ["rankings", "traffic", "audit", "opportunities"], is_default: true, created_at: daysAgo(60) },
  { id: "rt2", workspace_id: DEMO_WORKSPACE_ID, name: "Full Marketing Report", description: "Cross-channel marketing performance", report_type: "full", sections: ["rankings", "traffic", "content", "social", "ads", "crm"], is_default: false, created_at: daysAgo(60) },
];

const reportRuns = [
  { id: "rr1", workspace_id: DEMO_WORKSPACE_ID, client_id: DEMO_CLIENT_ID, template_id: "rt1", date_from: daysAgo(30), date_to: now, status: "completed", sections_json: {}, generated_at: daysAgo(2), share_token: "demo-share-token-1", created_at: daysAgo(2) },
];

// ─── Onboarding / Templates / Setup ───
const setupTemplates = [
  { id: "tmpl1", name: "Digital Agency", industry: "marketing", niche: "digital_agency", template_type: "full_setup", description: "Complete setup for digital marketing agencies", is_active: true, config_json: {}, created_at: daysAgo(90) },
  { id: "tmpl2", name: "Local Business", industry: "local", niche: "local_business", template_type: "full_setup", description: "Setup optimized for local service businesses", is_active: true, config_json: {}, created_at: daysAgo(90) },
];

const activationChecklist = [
  { id: "ack1", item_key: "add_keywords", label: "Add target keywords", status: "completed" },
  { id: "ack2", item_key: "connect_gsc", label: "Connect Google Search Console", status: "pending" },
  { id: "ack3", item_key: "run_audit", label: "Run first technical audit", status: "pending" },
  { id: "ack4", item_key: "generate_brief", label: "Generate first content brief", status: "completed" },
  { id: "ack5", item_key: "connect_cms", label: "Connect CMS for publishing", status: "completed" },
];

// ═══════════════════════════════════════════════
// URL Pattern Matcher
// ═══════════════════════════════════════════════

type DemoRoute = { pattern: RegExp; method?: string; handler: (match: RegExpMatchArray, body?: any) => any };

const routes: DemoRoute[] = [
  // ── Clients ──
  { pattern: /^\/clients$/, handler: () => clients },
  { pattern: /^\/clients\/([^/]+)$/, method: "GET", handler: (m) => clients.find(c => c.id === m[1]) || clients[0] },
  { pattern: /^\/clients$/, method: "POST", handler: (_m, body) => ({ ...body, id: crypto.randomUUID(), keywords_count: 0, competitors_count: 0, health_score: 50, status: "active", created_at: now, updated_at: now }) },
  { pattern: /^\/clients\/([^/]+)$/, method: "DELETE", handler: () => ({ deleted: true }) },

  // ── Keywords ──
  { pattern: /^\/clients\/[^/]+\/keywords$/, handler: () => keywords },
  { pattern: /^\/clients\/[^/]+\/keywords$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), keyword: body?.keyword, current_position: null, last_position: null, change: null, ranking_url: null, tracked_date: now }) },

  // ── Competitors ──
  { pattern: /^\/clients\/[^/]+\/competitors$/, handler: () => competitors },
  { pattern: /^\/clients\/[^/]+\/competitors$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), domain: body?.domain, label: body?.label || null, source: "manual", confirmed: true }) },

  // ── Audit ──
  { pattern: /^\/audit\/issues/, handler: () => auditIssues },

  // ── Opportunities ──
  { pattern: /^\/clients\/[^/]+\/opportunities\/[^/]+$/, method: "PATCH", handler: (_m, body) => ({ ...opportunities[0], status: body?.status || "done" }) },
  { pattern: /^\/clients\/[^/]+\/opportunities$/, handler: () => opportunities },

  // ── Internal Links ──
  { pattern: /^\/clients\/[^/]+\/internal-links\/[^/]+$/, method: "PATCH", handler: (_m, body) => ({ ...internalLinks[0], status: body?.status || "implemented" }) },
  { pattern: /^\/clients\/[^/]+\/internal-links$/, handler: () => internalLinks },

  // ── Content Plan ──
  { pattern: /^\/clients\/[^/]+\/content-plan\/[^/]+$/, method: "PATCH", handler: (_m, body) => ({ ...contentPlan.clusters[0].suggestions[0], status: body?.status }) },
  { pattern: /^\/clients\/[^/]+\/content-plan$/, handler: () => contentPlan },

  // ── Briefs ──
  { pattern: /^\/briefs\/generate$/, method: "POST", handler: (_m, body) => ({ ...briefs[0], id: crypto.randomUUID(), keyword: body?.keyword || "new keyword", title: `Guide to ${body?.keyword || "new keyword"}`, status: "draft", created_at: now }) },
  { pattern: /^\/clients\/[^/]+\/briefs\/[^/]+$/, method: "PATCH", handler: (_m, body) => ({ ...briefs[0], status: body?.status }) },
  { pattern: /^\/clients\/[^/]+\/briefs$/, handler: () => briefs },

  // ── Articles ──
  { pattern: /^\/articles\/generate$/, method: "POST", handler: () => ({ ...articles[2], id: crypto.randomUUID(), status: "draft", created_at: now }) },
  { pattern: /^\/articles\/[^/]+\/approve$/, method: "POST", handler: () => ({ ...articles[1], status: "approved" }) },
  { pattern: /^\/articles\/[^/]+\/status$/, method: "PATCH", handler: (_m, body) => ({ ...articles[0], status: body?.status }) },
  { pattern: /^\/articles\/[^/]+\/publish$/, method: "POST", handler: () => ({ article: { ...articles[0], status: "published" }, wordpress: { id: 999, url: "https://webby.sg/blog/new-post", status: "publish" } }) },
  { pattern: /^\/articles\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...articles[0], ...body }) },
  { pattern: /^\/clients\/[^/]+\/articles$/, handler: () => articles },

  // ── CMS ──
  { pattern: /^\/clients\/[^/]+\/cms\/test$/, method: "POST", handler: () => ({ success: true, message: "Connection successful (demo)" }) },
  { pattern: /^\/clients\/[^/]+\/cms$/, method: "POST", handler: (_m, body) => ({ ...cmsConnection, ...body }) },
  { pattern: /^\/clients\/[^/]+\/cms$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/clients\/[^/]+\/cms$/, handler: () => cmsConnection },

  // ── Social Posts ──
  { pattern: /^\/social\/generate$/, method: "POST", handler: () => socialPosts },
  { pattern: /^\/social\/[^/]+\/approve$/, method: "POST", handler: () => ({ ...socialPosts[0], status: "approved" }) },
  { pattern: /^\/social\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...socialPosts[0], ...body }) },
  { pattern: /^\/articles\/[^/]+\/social-posts$/, handler: () => socialPosts },
  { pattern: /^\/clients\/[^/]+\/social-posts$/, handler: () => socialPosts },

  // ── Videos ──
  { pattern: /^\/videos\/generate$/, method: "POST", handler: () => ({ ...videos[0], id: crypto.randomUUID() }) },
  { pattern: /^\/videos\/[^/]+\/approve$/, method: "POST", handler: () => ({ ...videos[0], status: "approved" }) },
  { pattern: /^\/videos\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...videos[0], ...body }) },
  { pattern: /^\/clients\/[^/]+\/videos$/, handler: () => videos },

  // ── Publishing Jobs ──
  { pattern: /^\/publishing\/schedule$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, publish_status: "queued", retry_count: 0, created_at: now, updated_at: now }) },
  { pattern: /^\/publishing\/[^/]+\/retry$/, method: "POST", handler: () => ({ ...publishingJobs[3], publish_status: "queued", retry_count: 3 }) },
  { pattern: /^\/publishing\/[^/]+\/cancel$/, method: "POST", handler: () => ({ ...publishingJobs[2], publish_status: "cancelled" }) },
  { pattern: /^\/publishing-jobs/, handler: () => publishingJobs },
  { pattern: /^\/clients\/[^/]+\/publishing-jobs$/, handler: () => publishingJobs.filter(j => j.client_id === DEMO_CLIENT_ID) },

  // ── AI Generation ──
  // 🔌 These endpoints connect to OpenAI/Anthropic via backend AI provider
  { pattern: /^\/ai\/articles\/generate$/, method: "POST", handler: () => ({ ...articles[2], id: crypto.randomUUID(), status: "draft" }) },
  { pattern: /^\/ai\/social\/generate$/, method: "POST", handler: () => socialPosts },
  { pattern: /^\/ai\/videos\/generate$/, method: "POST", handler: () => ({ ...videos[0], id: crypto.randomUUID() }) },

  // ── Analytics ──
  // 🔌 These connect to Google Search Console and GA4 APIs
  { pattern: /^\/clients\/[^/]+\/analytics-connections$/, handler: () => [
    { id: "anc1", client_id: DEMO_CLIENT_ID, provider: "gsc", property_id: null, site_url: "https://webby.sg", status: "active", created_at: daysAgo(60), updated_at: now },
    { id: "anc2", client_id: DEMO_CLIENT_ID, provider: "ga4", property_id: "properties/123456", site_url: null, status: "active", created_at: daysAgo(45), updated_at: now },
  ] },
  { pattern: /^\/analytics\/connect$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, status: "active", created_at: now, updated_at: now }) },
  { pattern: /^\/analytics\/sync$/, method: "POST", handler: () => ({ success: true, insights_generated: 5 }) },
  { pattern: /^\/clients\/[^/]+\/performance-summary/, handler: () => performanceSummary },
  { pattern: /^\/clients\/[^/]+\/page-performance/, handler: () => pagePerformance },
  { pattern: /^\/clients\/[^/]+\/keyword-performance/, handler: () => keywordPerformance },
  { pattern: /^\/clients\/[^/]+\/asset-performance/, handler: () => [
    { asset_type: "article", platform: "wordpress", views: 4200, clicks: 1800, engagements: 340, shares: 45, likes: 120 },
    { asset_type: "social_post", platform: "facebook", views: 8500, clicks: 620, engagements: 890, shares: 78, likes: 450 },
    { asset_type: "social_post", platform: "linkedin", views: 3200, clicks: 280, engagements: 420, shares: 34, likes: 180 },
    { asset_type: "video_asset", platform: "youtube_shorts", views: 12000, clicks: 340, engagements: 1500, shares: 120, likes: 890 },
  ] },
  { pattern: /^\/clients\/[^/]+\/performance-insights/, handler: () => performanceInsights },

  // ── GBP ──
  // 🔌 Connects to Google Business Profile API
  { pattern: /^\/gbp\/sync$/, method: "POST", handler: () => ({ success: true }) },
  { pattern: /^\/gbp\/posts\/generate$/, method: "POST", handler: () => gbpPosts[0] },
  { pattern: /^\/gbp\/posts\/[^/]+\/approve$/, method: "POST", handler: () => ({ ...gbpPosts[0], status: "approved" }) },
  { pattern: /^\/gbp\/reviews\/[^/]+\/generate-response$/, method: "POST", handler: () => ({ ...gbpReviews[1], response_draft: "Thank you for your feedback! We appreciate your kind words.", response_status: "draft" }) },
  { pattern: /^\/gbp\/reviews\/[^/]+\/approve$/, method: "POST", handler: () => ({ ...gbpReviews[0], response_status: "approved" }) },
  { pattern: /^\/gbp\/qna\/[^/]+\/generate-answer$/, method: "POST", handler: () => ({ id: "q1", answer_draft: "Yes, we offer comprehensive SEO services for businesses in Singapore.", status: "draft" }) },
  { pattern: /^\/gbp\/qna\/[^/]+\/approve$/, method: "POST", handler: () => ({ id: "q1", status: "approved" }) },
  { pattern: /^\/clients\/[^/]+\/gbp-connection$/, handler: () => gbpConnection },
  { pattern: /^\/clients\/[^/]+\/gbp-profile$/, handler: () => gbpProfile },
  { pattern: /^\/clients\/[^/]+\/gbp-posts$/, handler: () => gbpPosts },
  { pattern: /^\/clients\/[^/]+\/gbp-reviews$/, handler: () => gbpReviews },
  { pattern: /^\/clients\/[^/]+\/gbp-qna$/, handler: () => [] },
  { pattern: /^\/clients\/[^/]+\/local-seo-insights/, handler: () => [
    { id: "lsi1", client_id: DEMO_CLIENT_ID, insight_type: "review_response", priority: "high", title: "1 review awaiting response", description: "Responding to reviews within 24hrs improves local ranking", recommended_action: "Generate and approve response for Sarah L.'s review", status: "open", created_at: daysAgo(3) },
    { id: "lsi2", client_id: DEMO_CLIENT_ID, insight_type: "profile_completeness", priority: "medium", title: "GBP profile 85% complete", description: "Business hours need update for completeness boost", recommended_action: "Update business hours in GBP dashboard", status: "open", created_at: daysAgo(5) },
  ] },

  // ── Creative ──
  { pattern: /^\/creative\/generate$/, method: "POST", handler: () => creativeAssets[0] },
  { pattern: /^\/creative\/brand\/[^/]+$/, handler: () => ({ id: "bp1", client_id: DEMO_CLIENT_ID, brand_name: "Webby SG", primary_color: "#2563eb", secondary_color: "#7c3aed", font_style: "modern", tone: "professional", logo_url: null, image_style_notes: null }) },
  { pattern: /^\/creative\/brand$/, method: "POST", handler: (_m, body) => ({ id: "bp1", ...body }) },
  { pattern: /^\/clients\/[^/]+\/creative-assets/, handler: () => creativeAssets },

  // ── Ads ──
  // 🔌 Connects to Google Ads API
  { pattern: /^\/ads\/recommendations\/generate$/, method: "POST", handler: () => ({ count: 3 }) },
  { pattern: /^\/ads\/copy\/generate$/, method: "POST", handler: () => ({ id: crypto.randomUUID(), target_keyword: "seo agency singapore", headline_1: "Best SEO Agency Singapore", headline_2: "Proven SEO Results", headline_3: "Free SEO Audit", description_1: "Top-rated SEO agency in Singapore. Get a free audit today.", description_2: "Boost your rankings with our expert SEO team.", final_url: "https://webby.sg", path_1: "seo", path_2: "agency", status: "draft" }) },
  { pattern: /^\/clients\/[^/]+\/ads-campaigns$/, handler: () => adsCampaigns },
  { pattern: /^\/clients\/[^/]+\/ads-recommendations$/, handler: () => [
    { id: "ar1", recommendation_type: "keyword", campaign_name: "SEO Services", ad_group_name: null, keyword_text: "seo consultant singapore", landing_page_url: "/seo-agency", recommended_budget: null, recommended_action: "Add as broad match keyword", priority: "high", status: "open" },
    { id: "ar2", recommendation_type: "budget", campaign_name: "Local SEO - Singapore", ad_group_name: null, keyword_text: null, landing_page_url: null, recommended_budget: 45, recommended_action: "Increase daily budget from $35 to $45 for better impression share", priority: "medium", status: "open" },
  ] },
  { pattern: /^\/clients\/[^/]+\/ads-copy$/, handler: () => [] },
  { pattern: /^\/clients\/[^/]+\/ads-insights$/, handler: () => [] },
  { pattern: /^\/clients\/[^/]+\/ads-performance/, handler: () => adsPerformance },

  // ── Command Center ──
  { pattern: /^\/clients\/[^/]+\/command-center$/, handler: () => commandSummary },
  { pattern: /^\/clients\/[^/]+\/marketing-priorities/, handler: () => marketingPriorities },
  { pattern: /^\/clients\/[^/]+\/quick-wins$/, handler: () => marketingPriorities.filter(p => p.effort_score <= 40) },
  { pattern: /^\/clients\/[^/]+\/cross-channel-recommendations/, handler: () => [] },
  { pattern: /^\/clients\/[^/]+\/weekly-action-plans$/, handler: () => [] },
  { pattern: /^\/clients\/[^/]+\/marketing-goals$/, handler: () => [] },
  { pattern: /^\/clients\/[^/]+\/priorities\/recompute$/, method: "POST", handler: () => ({ success: true, priorities_generated: 5 }) },

  // ── CRM ──
  // 🔌 API: POST /api/crm/contacts, PUT /api/crm/contacts/:id, etc.
  { pattern: /^\/crm\/contacts$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, full_name: `${body?.first_name || ""} ${body?.last_name || ""}`.trim(), status: body?.status || "lead", created_at: now, updated_at: now }) },
  { pattern: /^\/crm\/contacts\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...crmContacts[0], ...body, updated_at: now }) },
  { pattern: /^\/crm\/contacts\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/crm\/deals$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, created_at: now, updated_at: now }) },
  { pattern: /^\/crm\/deals\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...crmDeals[0], ...body, updated_at: now }) },
  { pattern: /^\/crm\/deals\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/crm\/activities$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, completed_at: null, created_at: now }) },
  { pattern: /^\/crm\/activities\/[^/]+\/complete$/, method: "PUT", handler: () => ({ ...crmActivities[2], completed_at: now }) },
  { pattern: /^\/crm\/activities\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/crm\/leads\/capture$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, status: "lead", created_at: now }) },
  { pattern: /^\/crm\/insights\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...crmInsights[0], status: body?.status }) },
  { pattern: /^\/clients\/[^/]+\/crm\/contacts$/, handler: () => crmContacts },
  { pattern: /^\/clients\/[^/]+\/crm\/deals$/, handler: () => crmDeals },
  { pattern: /^\/clients\/[^/]+\/crm\/activities$/, handler: () => crmActivities },
  { pattern: /^\/clients\/[^/]+\/crm\/insights/, handler: () => crmInsights },
  { pattern: /^\/clients\/[^/]+\/crm\/insights\/recompute$/, method: "POST", handler: () => ({ success: true }) },
  { pattern: /^\/clients\/[^/]+\/attribution\/overview$/, handler: () => attributionOverview },
  { pattern: /^\/clients\/[^/]+\/attribution\/contacts$/, handler: () => crmContacts.map(c => ({ ...c, channel: c.source_type, attribution_model: "first_touch", credit: 1, campaign_name: null, contact_status: c.status })) },
  { pattern: /^\/clients\/[^/]+\/attribution\/deals$/, handler: () => crmDeals.map(d => ({ channel: "organic", attribution_model: "first_touch", credit: 1, campaign_name: null, deal_name: d.deal_name, deal_value: d.deal_value, deal_stage: d.deal_stage, won_date: d.won_date, contact_name: d.contact_name })) },
  { pattern: /^\/clients\/[^/]+\/attribution\/recompute$/, method: "POST", handler: () => ({ success: true }) },

  // ── Reports ──
  { pattern: /^\/report-templates/, handler: () => reportTemplates },
  { pattern: /^\/clients\/[^/]+\/reports$/, handler: () => reportRuns },
  { pattern: /^\/reports\/generate$/, method: "POST", handler: () => ({ ...reportRuns[0], id: crypto.randomUUID(), status: "completed", generated_at: now }) },
  { pattern: /^\/reports\/share\//, handler: () => reportRuns[0] },
  { pattern: /^\/workspaces\/[^/]+\/scheduled-reports$/, handler: () => [] },
  { pattern: /^\/scheduled-reports$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, created_at: now }) },

  // ── Onboarding ──
  { pattern: /^\/onboarding\/start$/, method: "POST", handler: () => ({ id: crypto.randomUUID(), status: "in_progress" }) },
  { pattern: /^\/onboarding\/[^/]+\/complete$/, method: "POST", handler: () => ({ status: "completed" }) },
  { pattern: /^\/onboarding\/[^/]+$/, method: "PUT", handler: (_m, body) => body },
  { pattern: /^\/onboarding\/[^/]+$/, handler: () => ({ id: "ob1", status: "completed", current_step: 4 }) },
  { pattern: /^\/templates\/[^/]+$/, handler: (m) => setupTemplates.find(t => t.id === m[1]) || setupTemplates[0] },
  { pattern: /^\/templates/, handler: () => setupTemplates },
  { pattern: /^\/setup\/run$/, method: "POST", handler: () => ({ success: true, steps_completed: 8 }) },
  { pattern: /^\/setup\/[^/]+\/status$/, handler: () => ({ status: "completed", progress: 100 }) },

  // ── Activation Checklist ──
  { pattern: /^\/clients\/[^/]+\/activation-checklist$/, handler: () => activationChecklist },
  { pattern: /^\/activation-checklist\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...activationChecklist[0], status: body?.status }) },

  // ── Activity Log ──
  { pattern: /^\/activity/, handler: () => activityLog },

  // ── Notifications ──
  { pattern: /^\/notifications\/unread-count$/, handler: () => ({ count: notifications.filter(n => !n.is_read).length }) },
  { pattern: /^\/notifications\/read-all$/, method: "PUT", handler: () => ({ success: true }) },
  { pattern: /^\/notifications\/[^/]+\/read$/, method: "PUT", handler: () => ({ ...notifications[0], is_read: true }) },
  { pattern: /^\/notifications/, handler: () => notifications },

  // ── AI Visibility ──
  { pattern: /^\/ai-visibility\/prompt-sets\/[^/]+\/prompts$/, handler: () => [
    { id: "avp1", prompt_set_id: "avps1", prompt_text: "What is the best SEO agency in Singapore?", target_entities: ["Webby SG", "webby.sg"], competitor_entities: ["competitor-one.com"], created_at: daysAgo(14) },
    { id: "avp2", prompt_set_id: "avps1", prompt_text: "Top SEO companies for small business in Singapore", target_entities: ["Webby SG"], competitor_entities: ["rival-agency.sg"], created_at: daysAgo(14) },
    { id: "avp3", prompt_set_id: "avps1", prompt_text: "Which agency should I hire for Google SEO in Singapore?", target_entities: ["Webby SG", "webby.sg"], competitor_entities: ["seo-pros.asia"], created_at: daysAgo(14) },
  ] },
  { pattern: /^\/ai-visibility\/prompt-sets$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, prompt_count: 0, run_count: 0, status: "active", created_at: now }) },
  { pattern: /^\/ai-visibility\/prompt-sets\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/clients\/[^/]+\/ai-visibility\/prompt-sets$/, handler: () => aiVisPromptSets },
  { pattern: /^\/ai-visibility\/prompts$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, created_at: now }) },
  { pattern: /^\/ai-visibility\/prompts\/bulk$/, method: "POST", handler: (_m, body) => (body?.prompts || []).map((p: any) => ({ id: crypto.randomUUID(), prompt_set_id: body?.prompt_set_id, ...p, created_at: now })) },
  { pattern: /^\/ai-visibility\/runs\/trigger$/, method: "POST", handler: () => ({ id: crypto.randomUUID(), status: "completed", total_prompts: 3, prompts_with_mention: 2, prompts_with_citation: 1 }) },
  { pattern: /^\/clients\/[^/]+\/ai-visibility\/runs$/, handler: () => aiVisRuns },
  { pattern: /^\/clients\/[^/]+\/ai-visibility\/overview$/, handler: () => aiVisOverview },
  { pattern: /^\/ai-visibility\/runs\/[^/]+\/observations$/, handler: () => [
    { id: "avo1", run_id: "avr2", prompt_id: "avp1", prompt_text: "What is the best SEO agency in Singapore?", brand_mentioned: true, brand_position: "top_3", prominence: "featured", competitor_mentioned: true, competitor_names: ["competitor-one.com"], citation_present: true, citation_url: "https://webby.sg", sentiment: "positive", raw_excerpt: "Webby SG is a highly-rated SEO agency in Singapore...", created_at: daysAgo(1) },
    { id: "avo2", run_id: "avr2", prompt_id: "avp2", prompt_text: "Top SEO companies for small business in Singapore", brand_mentioned: true, brand_position: "mentioned", prominence: "mentioned", competitor_mentioned: false, competitor_names: [], citation_present: false, citation_url: null, sentiment: "neutral", raw_excerpt: "...including agencies like Webby SG and others...", created_at: daysAgo(1) },
    { id: "avo3", run_id: "avr2", prompt_id: "avp3", prompt_text: "Which agency should I hire for Google SEO in Singapore?", brand_mentioned: false, brand_position: null, prominence: "absent", competitor_mentioned: true, competitor_names: ["seo-pros.asia"], citation_present: false, citation_url: null, sentiment: null, raw_excerpt: null, created_at: daysAgo(1) },
  ] },

  // ── Topical Maps ──
  { pattern: /^\/topical-maps\/generate$/, method: "POST", handler: (_m, body) => ({
    id: crypto.randomUUID(), client_id: body?.client_id, name: body?.name || `${body?.seed_keyword} Topical Map`, seed_keyword: body?.seed_keyword, status: "ready", cluster_count: 5, article_count: 14, created_at: now,
    clusters: [
      { id: "tc1", cluster_name: `${body?.seed_keyword} Fundamentals`, pillar_keyword: `what is ${body?.seed_keyword?.toLowerCase()}`, search_intent: "informational", estimated_volume: 2400, difficulty_score: 35, priority: "high" },
      { id: "tc2", cluster_name: `${body?.seed_keyword} Strategies`, pillar_keyword: `${body?.seed_keyword?.toLowerCase()} strategies`, search_intent: "informational", estimated_volume: 1600, difficulty_score: 45, priority: "high" },
      { id: "tc3", cluster_name: `${body?.seed_keyword} Tools`, pillar_keyword: `best ${body?.seed_keyword?.toLowerCase()} tools`, search_intent: "commercial", estimated_volume: 1900, difficulty_score: 50, priority: "medium" },
    ],
    articles: [
      { id: "ta1", cluster_id: "tc1", title: `What Is ${body?.seed_keyword}? Complete Guide`, target_keyword: `what is ${body?.seed_keyword?.toLowerCase()}`, content_type: "pillar_page", search_intent: "informational", estimated_volume: 2400, difficulty_score: 35, word_count_target: 2500, status: "planned" },
      { id: "ta2", cluster_id: "tc1", title: `${body?.seed_keyword} for Beginners`, target_keyword: `${body?.seed_keyword?.toLowerCase()} for beginners`, content_type: "how_to", search_intent: "informational", estimated_volume: 1200, difficulty_score: 25, word_count_target: 2000, status: "planned" },
      { id: "ta3", cluster_id: "tc2", title: `Top 10 ${body?.seed_keyword} Strategies`, target_keyword: `${body?.seed_keyword?.toLowerCase()} strategies`, content_type: "listicle", search_intent: "informational", estimated_volume: 1600, difficulty_score: 45, word_count_target: 2200, status: "planned" },
      { id: "ta4", cluster_id: "tc3", title: `Best ${body?.seed_keyword} Tools Compared`, target_keyword: `best ${body?.seed_keyword?.toLowerCase()} tools`, content_type: "comparison", search_intent: "commercial", estimated_volume: 1900, difficulty_score: 50, word_count_target: 2500, status: "planned" },
    ],
  }) },
  { pattern: /^\/topical-maps\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/topical-maps\/[^/]+$/, handler: () => ({ id: "tm1", name: "SEO Services Topical Map", seed_keyword: "seo services", status: "ready", cluster_count: 5, article_count: 14, created_at: daysAgo(7), clusters: [
    { id: "tc1", cluster_name: "SEO Fundamentals", pillar_keyword: "what is seo", search_intent: "informational", estimated_volume: 2400, difficulty_score: 35, priority: "high" },
    { id: "tc2", cluster_name: "SEO Strategies", pillar_keyword: "seo strategies", search_intent: "informational", estimated_volume: 1600, difficulty_score: 45, priority: "high" },
  ], articles: [
    { id: "ta1", cluster_id: "tc1", title: "What Is SEO? Complete Guide", target_keyword: "what is seo", content_type: "pillar_page", search_intent: "informational", estimated_volume: 2400, difficulty_score: 35, word_count_target: 2500, status: "planned" },
    { id: "ta2", cluster_id: "tc1", title: "SEO for Beginners", target_keyword: "seo for beginners", content_type: "how_to", search_intent: "informational", estimated_volume: 1200, difficulty_score: 25, word_count_target: 2000, status: "planned" },
    { id: "ta3", cluster_id: "tc2", title: "Top 10 SEO Strategies", target_keyword: "seo strategies", content_type: "listicle", search_intent: "informational", estimated_volume: 1600, difficulty_score: 45, word_count_target: 2200, status: "planned" },
  ] }) },
  { pattern: /^\/clients\/[^/]+\/topical-maps$/, handler: () => [
    { id: "tm1", name: "SEO Services Topical Map", seed_keyword: "seo services", status: "ready", cluster_count: 5, article_count: 14, created_at: daysAgo(7) },
  ] },

  // ── Content Scores ──
  { pattern: /^\/content-score\/analyze$/, method: "POST", handler: (_m, body) => ({
    id: crypto.randomUUID(), client_id: body?.client_id, title: body?.title || "Untitled", target_keyword: body?.target_keyword, overall_score: 72, word_count: (body?.content || "").split(/\s+/).length, word_count_target: 1500, word_count_score: 65, heading_score: 80, keyword_density: 0.018, keyword_score: 85, readability_score: 75, focus_terms_found: 4, focus_terms_total: 6, focus_terms_score: 67, internal_links_count: 2, external_links_count: 1, link_score: 58, meta_title_length: (body?.meta_title || body?.title || "").length, meta_desc_length: (body?.meta_description || "").length, meta_score: 50,
    issues_json: [{ type: "word_count", severity: "medium", message: "Content could be longer for better rankings." }],
    suggestions_json: ["Add more focus terms", "Include authoritative external links"],
    focus_terms_json: [{ term: body?.target_keyword?.toLowerCase(), found: true }, { term: "guide", found: true }, { term: "best practices", found: false }],
    scored_at: now,
  }) },
  { pattern: /^\/clients\/[^/]+\/content-scores$/, handler: () => [
    { id: "cs1", title: "Complete SEO Guide", target_keyword: "seo guide", overall_score: 82, word_count: 2100, word_count_target: 1500, word_count_score: 100, heading_score: 90, keyword_density: 0.019, keyword_score: 88, readability_score: 78, focus_terms_found: 5, focus_terms_total: 6, focus_terms_score: 83, internal_links_count: 4, external_links_count: 2, link_score: 83, meta_title_length: 45, meta_desc_length: 142, meta_score: 100, issues_json: [], suggestions_json: [], focus_terms_json: [], scored_at: daysAgo(2) },
    { id: "cs2", title: "Web Design Best Practices", target_keyword: "web design", overall_score: 58, word_count: 890, word_count_target: 1500, word_count_score: 45, heading_score: 60, keyword_density: 0.012, keyword_score: 70, readability_score: 65, focus_terms_found: 3, focus_terms_total: 7, focus_terms_score: 43, internal_links_count: 1, external_links_count: 0, link_score: 30, meta_title_length: 22, meta_desc_length: 0, meta_score: 25, issues_json: [{ type: "word_count", severity: "high", message: "Content is only 890 words." }], suggestions_json: ["Add more content"], focus_terms_json: [], scored_at: daysAgo(5) },
  ] },

  // ── Bulk Content ──
  { pattern: /^\/bulk-content\/generate$/, method: "POST", handler: (_m, body) => {
    const kws = body?.keywords || [{ keyword: "sample keyword" }];
    return { id: crypto.randomUUID(), name: body?.name || "Bulk Job", status: "completed", total_articles: kws.length, completed_articles: kws.length, failed_articles: 0, created_at: now, items: kws.map((k: any, i: number) => ({ id: `bi${i}`, target_keyword: k.keyword, title: `Guide to ${k.keyword}`, status: "completed", content_score: Math.round(55 + Math.random() * 35), completed_at: now })) };
  } },
  { pattern: /^\/bulk-content\/[^/]+\/cancel$/, method: "POST", handler: () => ({ status: "cancelled" }) },
  { pattern: /^\/bulk-content\/[^/]+$/, handler: () => ({ id: "bj1", name: "SEO Content Pack", status: "completed", total_articles: 5, completed_articles: 5, failed_articles: 0, created_at: daysAgo(3), items: [
    { id: "bi1", target_keyword: "seo agency singapore", title: "Best SEO Agency Singapore", status: "completed", content_score: 78, completed_at: daysAgo(3) },
    { id: "bi2", target_keyword: "web design services", title: "Web Design Services Guide", status: "completed", content_score: 72, completed_at: daysAgo(3) },
    { id: "bi3", target_keyword: "google ads management", title: "Google Ads Management Guide", status: "completed", content_score: 85, completed_at: daysAgo(3) },
    { id: "bi4", target_keyword: "content marketing", title: "Content Marketing Strategies", status: "completed", content_score: 69, completed_at: daysAgo(3) },
    { id: "bi5", target_keyword: "local seo tips", title: "Local SEO Tips for Businesses", status: "completed", content_score: 81, completed_at: daysAgo(3) },
  ] }) },
  { pattern: /^\/clients\/[^/]+\/bulk-jobs$/, handler: () => [
    { id: "bj1", name: "SEO Content Pack", status: "completed", total_articles: 5, completed_articles: 5, failed_articles: 0, created_at: daysAgo(3) },
  ] },

  // ── Rankings (standalone) ──
  { pattern: /^\/rankings/, handler: () => keywords },

  // ── Inbox / Conversations ──
  { pattern: /^\/inbox\/conversations\/[^/]+\/messages$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), conversation_id: body?.conversation_id, message_type: "outgoing", content: body?.content, is_private: false, sender_name: "Demo Admin", time: "Just now", created_at: now }) },
  { pattern: /^\/inbox\/conversations\/[^/]+$/, method: "PATCH", handler: (_m, body) => ({ status: body?.status || "resolved" }) },
  { pattern: /^\/inbox\/conversations\/[^/]+$/, handler: () => ({
    id: "conv1", workspace_id: DEMO_WORKSPACE_ID, inbox_id: "inb1", contact_name: "Michael Chen", contact_email: "michael@techcorp.sg", channel: "live_chat", status: "open", priority: "high", messages_count: 4, assignee_name: "Demo Admin", tags: ["SEO", "Lead"], previous_count: 2, subject: "SEO pricing inquiry",
    messages: [
      { id: "m1", message_type: "incoming", content: "Hi, I'd like to know about your SEO services pricing for a medium-sized e-commerce site.", sender_name: "Michael Chen", time: "10:32 AM", is_private: false },
      { id: "m2", message_type: "outgoing", content: "Hi Michael! Thanks for reaching out. For e-commerce SEO, we offer packages starting from $2,500/month. Could you share your website URL so I can provide a more accurate quote?", sender_name: "Demo Admin", time: "10:35 AM", is_private: false },
      { id: "m3", message_type: "incoming", content: "Sure, it's techcorp.sg. We have about 500 product pages and target Singapore + Malaysia markets.", sender_name: "Michael Chen", time: "10:38 AM", is_private: false },
      { id: "m4", message_type: "note", content: "Check competitor pricing for similar scope. Reviewed their site — good technical foundation, needs content strategy.", sender_name: "Demo Admin", time: "10:42 AM", is_private: true },
    ],
  }) },
  { pattern: /^\/inbox\/conversations/, handler: () => [
    { id: "conv1", workspace_id: DEMO_WORKSPACE_ID, inbox_id: "inb1", contact_name: "Michael Chen", contact_email: "michael@techcorp.sg", channel: "live_chat", status: "open", priority: "high", subject: "SEO pricing inquiry", last_message: "Sure, it's techcorp.sg...", messages_count: 4, assignee_name: "Demo Admin", time_ago: "5m", tags: ["SEO", "Lead"], created_at: daysAgo(0) },
    { id: "conv2", workspace_id: DEMO_WORKSPACE_ID, inbox_id: "inb2", contact_name: "Lisa Wong", contact_email: "lisa@greenstart.co", channel: "email", status: "pending", priority: "medium", subject: "Monthly report request", last_message: "Could you send the latest performance report?", messages_count: 2, assignee_name: null, time_ago: "2h", tags: ["Report"], created_at: daysAgo(0) },
    { id: "conv3", workspace_id: DEMO_WORKSPACE_ID, inbox_id: "inb1", contact_name: "David Tan", contact_email: "david@retailhub.sg", channel: "live_chat", status: "resolved", priority: "low", subject: "GBP listing update", last_message: "Thanks, the update looks great!", messages_count: 6, assignee_name: "Demo Admin", time_ago: "1d", tags: ["GBP"], created_at: daysAgo(1) },
    { id: "conv4", workspace_id: DEMO_WORKSPACE_ID, inbox_id: "inb3", contact_name: "Rachel Lim", contact_email: "rachel@beautyhq.sg", channel: "whatsapp", status: "open", priority: "medium", subject: "Social media ad inquiry", last_message: "Can you help with Instagram ads?", messages_count: 1, assignee_name: null, time_ago: "30m", tags: [], created_at: daysAgo(0) },
    { id: "conv5", workspace_id: DEMO_WORKSPACE_ID, inbox_id: "inb1", contact_name: "James Ng", contact_email: "james@lawfirm.sg", channel: "live_chat", status: "snoozed", priority: "low", subject: "Content strategy discussion", last_message: "I'll get back to you next week.", messages_count: 3, assignee_name: "Demo Admin", time_ago: "3d", tags: ["Content"], created_at: daysAgo(3) },
  ] },
  { pattern: /^\/inbox$/, handler: () => [
    { id: "inb1", workspace_id: DEMO_WORKSPACE_ID, name: "Website Chat", channel: "live_chat", status: "active", widget_color: "#2563eb", welcome_message: "Hi! How can we help you?" },
    { id: "inb2", workspace_id: DEMO_WORKSPACE_ID, name: "Support Email", channel: "email", status: "active" },
    { id: "inb3", workspace_id: DEMO_WORKSPACE_ID, name: "WhatsApp Business", channel: "whatsapp", status: "active" },
  ] },
  { pattern: /^\/inbox\/canned-responses/, handler: () => [
    { id: "cr1", short_code: "greeting", title: "Welcome Greeting", content: "Hi there! Thanks for reaching out. How can I help you today?", category: "General" },
    { id: "cr2", short_code: "pricing", title: "Pricing Info", content: "Our SEO packages start from $1,500/month. Would you like me to prepare a custom quote based on your needs?", category: "Sales" },
    { id: "cr3", short_code: "follow-up", title: "Follow Up", content: "Just checking in on our previous conversation. Do you have any questions?", category: "Sales" },
  ] },

  // ── Automations ──
  { pattern: /^\/automations$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, is_active: true, execution_count: 0, created_at: now }) },
  { pattern: /^\/automations\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/automations/, handler: () => [
    { id: "ar1", workspace_id: DEMO_WORKSPACE_ID, name: "Auto-assign SEO inquiries", description: "Route conversations mentioning SEO to the SEO team", event_type: "message_created", conditions: [{ attribute: "content", operator: "contains", value: "SEO" }], actions: [{ type: "assign", params: { team: "SEO Team" } }, { type: "add_tag", params: { tag: "SEO" } }], is_active: true, execution_count: 23, last_executed_at: daysAgo(0), created_at: daysAgo(30) },
    { id: "ar2", workspace_id: DEMO_WORKSPACE_ID, name: "Welcome new contacts", description: "Send welcome message to new contacts", event_type: "contact_created", conditions: [], actions: [{ type: "send_message", params: { content: "Welcome! How can we help?" } }], is_active: true, execution_count: 15, last_executed_at: daysAgo(1), created_at: daysAgo(45) },
    { id: "ar3", workspace_id: DEMO_WORKSPACE_ID, name: "Escalate urgent conversations", description: "Notify admin for urgent priority conversations", event_type: "conversation_created", conditions: [{ attribute: "priority", operator: "equals", value: "urgent" }], actions: [{ type: "notify", params: { channel: "slack" } }, { type: "assign", params: { user: "admin" } }], is_active: false, execution_count: 5, last_executed_at: daysAgo(7), created_at: daysAgo(20) },
  ] },

  // ── Knowledge Base ──
  { pattern: /^\/knowledge-base\/articles\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...body, updated_at: now }) },
  { pattern: /^\/knowledge-base\/articles\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/knowledge-base\/articles$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, views_count: 0, helpful_count: 0, not_helpful_count: 0, status: "draft", created_at: now }) },
  { pattern: /^\/knowledge-base\/articles/, handler: () => [
    { id: "kb1", title: "How to Track Your SEO Rankings", slug: "track-seo-rankings", category_id: "kbc1", category_name: "Getting Started", status: "published", content: "# How to Track Your SEO Rankings\n\nSEO rankings...", views_count: 245, helpful_count: 32, not_helpful_count: 3, created_at: daysAgo(30) },
    { id: "kb2", title: "Understanding Your Performance Reports", slug: "performance-reports", category_id: "kbc1", category_name: "Getting Started", status: "published", content: "# Performance Reports\n\nYour monthly reports...", views_count: 189, helpful_count: 28, not_helpful_count: 1, created_at: daysAgo(25) },
    { id: "kb3", title: "Setting Up Google Business Profile", slug: "setup-gbp", category_id: "kbc2", category_name: "Local SEO", status: "published", content: "# GBP Setup Guide\n\n...", views_count: 312, helpful_count: 45, not_helpful_count: 5, created_at: daysAgo(20) },
    { id: "kb4", title: "Content Brief Guidelines", slug: "content-briefs", category_id: "kbc3", category_name: "Content", status: "draft", content: "# Content Brief Guidelines\n\n...", views_count: 0, helpful_count: 0, not_helpful_count: 0, created_at: daysAgo(2) },
  ] },
  { pattern: /^\/knowledge-base\/categories$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, articles_count: 0, created_at: now }) },
  { pattern: /^\/knowledge-base\/categories/, handler: () => [
    { id: "kbc1", name: "Getting Started", description: "Basics for new clients", icon: "book", articles_count: 2 },
    { id: "kbc2", name: "Local SEO", description: "GBP and local search guides", icon: "map-pin", articles_count: 1 },
    { id: "kbc3", name: "Content", description: "Content creation and optimization", icon: "file-text", articles_count: 1 },
  ] },

  // ── Backlinks ──
  { pattern: /^\/clients\/[^/]+\/backlinks\/summary$/, handler: () => ({ total: 156, referring_domains: 89, dofollow: 112, nofollow: 44, lost: 8, avg_da: 38.5 }) },
  { pattern: /^\/clients\/[^/]+\/backlinks$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, first_seen: now, last_seen: now, status: "active", created_at: now }) },
  { pattern: /^\/clients\/[^/]+\/backlinks$/, handler: () => [
    { id: "bl1", source_url: "https://techblog.asia/best-seo-tools-2025", target_url: "/seo-agency", anchor_text: "top SEO agency Singapore", link_type: "dofollow", domain_authority: 62, page_authority: 45, source_domain: "techblog.asia", first_seen: daysAgo(45), last_seen: daysAgo(1), status: "active" },
    { id: "bl2", source_url: "https://marketingweekly.com/agency-directory", target_url: "/", anchor_text: "Webby SG", link_type: "dofollow", domain_authority: 55, page_authority: 38, source_domain: "marketingweekly.com", first_seen: daysAgo(90), last_seen: daysAgo(1), status: "active" },
    { id: "bl3", source_url: "https://singaporebiz.sg/digital-marketing-guide", target_url: "/services", anchor_text: "digital marketing services", link_type: "dofollow", domain_authority: 48, page_authority: 32, source_domain: "singaporebiz.sg", first_seen: daysAgo(60), last_seen: daysAgo(1), status: "active" },
    { id: "bl4", source_url: "https://forums.webmaster.com/t/seo-agencies", target_url: "/about", anchor_text: "webby.sg", link_type: "nofollow", domain_authority: 72, page_authority: 28, source_domain: "forums.webmaster.com", first_seen: daysAgo(120), last_seen: daysAgo(3), status: "active" },
    { id: "bl5", source_url: "https://old-partner.com/resources", target_url: "/blog/seo-tips", anchor_text: "SEO tips", link_type: "dofollow", domain_authority: 35, page_authority: 22, source_domain: "old-partner.com", first_seen: daysAgo(180), last_seen: daysAgo(30), status: "lost" },
    { id: "bl6", source_url: "https://business-directory.sg/webby", target_url: "/", anchor_text: "Webby SEO", link_type: "dofollow", domain_authority: 42, page_authority: 18, source_domain: "business-directory.sg", first_seen: daysAgo(200), last_seen: daysAgo(1), status: "active" },
  ] },

  // ── Schema Markup ──
  { pattern: /^\/clients\/[^/]+\/schema-markups$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, status: "draft", validation_errors: [], created_at: now }) },
  { pattern: /^\/schema-markups\/[^/]+$/, method: "PUT", handler: (_m, body) => ({ ...body, updated_at: now }) },
  { pattern: /^\/schema-markups\/[^/]+$/, method: "DELETE", handler: () => ({ deleted: true }) },
  { pattern: /^\/clients\/[^/]+\/schema-markups$/, handler: () => [
    { id: "sm1", page_url: "/seo-agency", schema_type: "FAQ", status: "deployed", created_at: daysAgo(30), updated_at: daysAgo(5) },
    { id: "sm2", page_url: "/", schema_type: "LocalBusiness", status: "validated", created_at: daysAgo(20), updated_at: daysAgo(10) },
    { id: "sm3", page_url: "/blog/seo-tips", schema_type: "Article", status: "draft", created_at: daysAgo(5), updated_at: daysAgo(5) },
  ] },

  // ── Content Rewriter ──
  { pattern: /^\/content-rewriter\/rewrite$/, method: "POST", handler: (_m, body) => ({
    id: crypto.randomUUID(), client_id: body?.client_id, original_text: body?.original_text,
    rewritten_text: body?.rewrite_mode === "simplify" ? body?.original_text?.replace(/\b\w{10,}\b/g, (w: string) => w.slice(0, 6)) + "\n\n[Simplified version — AI would produce a more readable rewrite]" :
      body?.rewrite_mode === "expand" ? body?.original_text + "\n\nAdditionally, it's important to consider the broader context and implications of these points. Research indicates that a comprehensive approach yields better long-term results." :
      body?.rewrite_mode === "shorten" ? body?.original_text?.split(". ").slice(0, 2).join(". ") + "." :
      `${body?.original_text}\n\n[AI-improved version with better flow, clarity, and engagement. The rewriter would optimize sentence structure, eliminate redundancy, and strengthen key points.]`,
    rewrite_mode: body?.rewrite_mode || "improve", target_tone: body?.target_tone, status: "completed", created_at: now,
  }) },
  { pattern: /^\/clients\/[^/]+\/rewrites$/, handler: () => [
    { id: "rw1", original_text: "SEO is good for business. It helps you rank higher.", rewritten_text: "Search engine optimization is a powerful growth driver for businesses, enabling higher search rankings and increased organic visibility.", rewrite_mode: "improve", status: "completed", created_at: daysAgo(3) },
    { id: "rw2", original_text: "Our comprehensive suite of digital marketing services...", rewritten_text: "We offer digital marketing services that...", rewrite_mode: "simplify", status: "completed", created_at: daysAgo(5) },
  ] },

  // ── Site Explorer ──
  { pattern: /^\/clients\/[^/]+\/domain-overview\/history$/, handler: () => [] },
  { pattern: /^\/clients\/[^/]+\/domain-overview\/refresh$/, method: "POST", handler: () => ({ id: crypto.randomUUID(), domain: "webby.sg", domain_authority: 45, organic_keywords: 320, organic_traffic: 8500, backlinks_total: 1200, referring_domains: 180 }) },
  { pattern: /^\/clients\/[^/]+\/domain-overview$/, handler: () => ({
    id: "do1", domain: "webby.sg", domain_authority: 45, page_authority: 52, organic_keywords: 320, organic_traffic: 8500, backlinks_total: 1200, referring_domains: 180,
    top_keywords: [
      { keyword: "seo agency singapore", position: 4, volume: 2400 },
      { keyword: "web design singapore", position: 12, volume: 1800 },
      { keyword: "local seo services", position: 3, volume: 1200 },
      { keyword: "digital marketing agency", position: 8, volume: 3200 },
      { keyword: "google ads management", position: 6, volume: 900 },
    ],
    traffic_trend: Array.from({ length: 12 }, (_, i) => ({ month: new Date(2025, i).toLocaleString("default", { month: "short" }), traffic: Math.round(5000 + Math.random() * 5000) })),
    competitor_overlap: [
      { domain: "competitor-one.com", shared_keywords: 85, overlap_pct: 42 },
      { domain: "rival-agency.sg", shared_keywords: 62, overlap_pct: 31 },
      { domain: "seo-pros.asia", shared_keywords: 48, overlap_pct: 24 },
    ],
  }) },

  // ── SERP Checker ──
  { pattern: /^\/serp-checker\/check$/, method: "POST", handler: (_m, body) => ({
    id: crypto.randomUUID(), keyword: body?.keyword, location: body?.location || "Singapore", device: body?.device || "desktop",
    results: Array.from({ length: 10 }, (_, i) => ({
      position: i + 1, url: `https://example${i + 1}.com/${(body?.keyword || "seo").replace(/\s+/g, "-")}`,
      title: `${body?.keyword || "SEO"} - ${["Complete Guide", "Best Practices", "Expert Tips", "2025 Update", "How To", "Top 10", "Review", "Comparison", "Tutorial", "Resource"][i]}`,
      description: `Comprehensive resource about ${body?.keyword || "SEO"} covering everything you need to know. Updated for 2025.`,
      domain: `example${i + 1}.com`,
    })),
    featured_snippet: { title: `What is ${body?.keyword}?`, text: `${body?.keyword} is a key aspect of digital marketing that focuses on improving online visibility and driving organic results.` },
    people_also_ask: [`What is ${body?.keyword}?`, `How does ${body?.keyword} work?`, `Is ${body?.keyword} worth it?`, `Best ${body?.keyword} tools?`],
    related_searches: [`${body?.keyword} services`, `${body?.keyword} pricing`, `best ${body?.keyword} agency`, `${body?.keyword} tools 2025`],
    checked_at: now,
  }) },
  { pattern: /^\/clients\/[^/]+\/serp-checks$/, handler: () => [
    { id: "sc1", keyword: "seo agency singapore", location: "Singapore", device: "desktop", checked_at: daysAgo(1) },
    { id: "sc2", keyword: "web design services", location: "Singapore", device: "desktop", checked_at: daysAgo(3) },
  ] },

  // ── CSAT ──
  { pattern: /^\/csat\/summary/, handler: () => ({ total: 24, avg_rating: 4.3, satisfied: 19, unsatisfied: 2 }) },
  { pattern: /^\/csat$/, method: "POST", handler: (_m, body) => ({ id: crypto.randomUUID(), ...body, created_at: now }) },
  { pattern: /^\/csat/, handler: () => [
    { id: "csat1", rating: 5, feedback: "Excellent support! Quick response and very knowledgeable.", conversation_subject: "SEO pricing inquiry", created_at: daysAgo(2) },
    { id: "csat2", rating: 4, feedback: "Good service, would appreciate faster turnaround on reports.", conversation_subject: "Monthly report request", created_at: daysAgo(5) },
    { id: "csat3", rating: 5, feedback: "Love the detailed insights in the audit report!", conversation_subject: "Technical audit review", created_at: daysAgo(8) },
    { id: "csat4", rating: 3, feedback: "Support was okay but took a while to resolve my issue.", conversation_subject: "GBP listing issue", created_at: daysAgo(12) },
    { id: "csat5", rating: 5, feedback: null, conversation_subject: "Content strategy call", created_at: daysAgo(15) },
    { id: "csat6", rating: 2, feedback: "Had to follow up multiple times. Not great experience.", conversation_subject: "Billing question", created_at: daysAgo(18) },
    { id: "csat7", rating: 4, feedback: "Very professional team. Clear communication.", conversation_subject: "New project setup", created_at: daysAgo(20) },
  ] },

  // ── Health check ──
  { pattern: /^\/health$/, handler: () => ({ status: "ok", timestamp: now, demo: true }) },
];

/**
 * Match a request path+method to demo data.
 * Returns undefined if no match found.
 */
export function matchDemoRoute(path: string, method: string = "GET", body?: any): any | undefined {
  const cleanPath = path.split("?")[0];
  const upperMethod = method.toUpperCase();

  for (const route of routes) {
    const routeMethod = route.method?.toUpperCase() || "GET";
    if (routeMethod !== upperMethod) continue;
    const match = cleanPath.match(route.pattern);
    if (match) return route.handler(match, body);
  }

  // Fallback for GET routes without explicit method
  if (upperMethod === "GET") {
    for (const route of routes) {
      if (route.method) continue;
      const match = cleanPath.match(route.pattern);
      if (match) return route.handler(match, body);
    }
  }

  return undefined;
}
