# Webby SEO OS — System Overview & Backend Handoff

> **Version:** v8.0 — Definitive backend handoff document
> **Last updated:** 2026-03-28
> **Purpose:** Single source of truth for architecture, scope, memory model, and backend implementation requirements. Written for the Claude backend developer.

---

## 1. Current Product Scope

**Webby SEO OS** is a multi-tenant digital marketing operating system for agencies.

### Core Workflow (in execution order)

| Step | Module | What It Does |
|------|--------|-------------|
| 1 | **Technical Audit** | Crawl client sites, detect issues, track rechecks, link to evidence |
| 2 | **Competitor Benchmark** | Analyze competitor domains, classify pages, identify gaps |
| 3 | **Keyword Research** | Service-page-first clustering, page mapping, site structure recommendations |
| 4 | **Opportunities** | Surface near-wins, content gaps, and expansion targets from evidence |
| 5 | **SEO Brief Workflow** | Create briefs from mappings/opportunities → generate drafts → review checks |
| 6 | **Approval Workflow** | Client/team approval with review states |
| 7 | **Publishing** | Publish to WordPress/CMS, schedule social posts |
| 8 | **Analytics & Reporting** | GA4/GSC performance, ranking history, scheduled reports |
| 9 | **Lightweight Attribution** | Channel-level conversion attribution (analytics-only, NOT CRM) |

### Additional Modules

- **SEM** — Google Ads campaigns, AI ad copy, budget recommendations
- **SMM** — Social media posts, video assets, GBP/local SEO
- **Content Studio** — Content scoring + AI rewriter
- **AI Visibility** — LLM citation tracking across AI models
- **Command Center** — Cross-channel priorities and weekly action plans
- **Creative Assets** — AI image generation for marketing
- **Topical Maps** — Topic cluster strategy builder

### Explicitly NOT in Scope

**Removed in v6.0 — do NOT implement:**
- CRM (contacts, deals, pipelines, deal stages)
- Inbox / conversations (Chatwoot-style)
- Knowledge Base
- Automations (event-driven rules)
- CSAT / support ticketing
- Helpdesk / support desk features

Attribution data (channel-level conversion reporting) is preserved as **analytics/reporting data only** — it is NOT a CRM module.

---

## 2. Frontend vs Backend Status

### Frontend (✅ Built in Lovable)

| Aspect | Status | Details |
|--------|--------|---------|
| **Technology** | ✅ Complete | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| **All pages/routes** | ✅ Complete | 30+ pages with full UI, navigation, responsive layout |
| **Type contracts** | ✅ Stabilized | All TypeScript interfaces in `src/lib/api.ts` |
| **Demo mode** | ✅ Complete | `src/lib/demo-data.ts` with `matchDemoRoute()` interceptor |
| **Design system** | ✅ Complete | HSL tokens, Space Grotesk typography, mascot system |
| **Planning memory UI** | ✅ Complete | `PlanningMemoryTrail`, `LifecycleStatusBar` components |
| **API client** | ✅ Complete | `request()` utility auto-falls back to demo data when backend unavailable |

### Backend (⏳ Pending — for Claude)

| Aspect | Status | Details |
|--------|--------|---------|
| **Express server** | ⏳ Scaffolded but not functional | `backend/src/index.ts` exists but needs real implementation |
| **PostgreSQL schema** | ⏳ Migration files exist | 40 migration files in `backend/db/migrations/` — need cleanup (remove CRM tables) |
| **Auth** | ⏳ Not functional | JWT + bcrypt scaffolded but not connected |
| **External integrations** | ⏳ Not connected | DataForSEO, GA4, GSC, Google Ads, GBP — all mock-only |
| **Background worker** | ⏳ Not functional | Cron-based job runner scaffolded |
| **AI generation** | ⏳ Not connected | OpenAI/Anthropic providers scaffolded but not wired |

### Mock-Only Workflows (no real data persistence)

Everything in the frontend currently runs on mock data. These workflows need backend implementation:
- Audit crawling and issue detection
- Keyword research job execution
- Competitor benchmark analysis
- Brief/draft AI generation
- Publishing to external CMS
- Analytics data sync (GA4/GSC)
- Rank tracking snapshots
- Google Ads sync
- GBP profile management
- Report PDF generation
- AI Visibility prompt execution

### Frontend Contracts Already Stabilized

The following TypeScript interfaces in `src/lib/api.ts` define the exact data shapes the backend must return:

**Core:** `Client`, `KeywordRanking`, `Competitor`
**Audit:** `AuditRun`, `AuditIssue`, `AuditPage`, `AuditEvidence`, `AuditRecheck`
**Keyword Research:** `KeywordResearchJob`, `KeywordCluster`, `PageMapping`
**Content:** `SeoBrief`, `SeoBriefDraft`, `DraftReviewCheck`, `SeoArticle`, `SocialPost`, `VideoAsset`
**Publishing:** `PublishingJob`, `CmsConnection`
**Analytics:** `AnalyticsConnection`, `PerformanceInsight`, `PerformanceSummaryResponse`, `AttributionOverview`
**Competitor:** `CompetitorBenchmark`
**Ads:** `AdsCampaign`, `AdsRecommendation`, `AdsCopyDraft`, `AdsInsight`, `AdsPerformanceResponse`
**Local SEO:** `GbpConnection`, `GbpProfile`, `GbpPostDraft`, `GbpReviewItem`, `GbpQnaItem`, `LocalSeoInsight`
**AI Visibility:** `AiVisPromptSet`, `AiVisPrompt`, `AiVisRun`, `AiVisObservation`, `AiVisOverview`
**Command Center:** `CommandCenterSummary`, `MarketingPriority`, `CrossChannelRecommendation`, `WeeklyActionPlan`, `MarketingGoal`
**Reports:** `ActivityLogEntry`, `AppNotification`
**Planning Memory:** `OpportunityWithMemory`, `OpportunityLifecycleEvent`, `OpportunityEvidence`, `ContentInventoryItem`, `ContentPerformanceSummary`, `PublishedContentRecord`, `PageRelationship`, `RankSnapshot`

### What Is NOT Truly Persistent Yet

Nothing. All data resets on page reload. The demo-data layer simulates API responses but stores nothing. The backend must implement full persistence for every entity listed above.

---

## 3. Content-Planning Memory Model

### Why This Exists

The platform must store **structured historical planning data** so future AI can make better content decisions. Instead of making recommendations from scratch each time, AI should reason from:

- What was already researched
- What was recommended and why
- What was approved vs ignored
- What was published and where
- How published content performed
- What gaps still remain

### Five Memory Layers

#### Layer 1: Planning Memory

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `keyword_research_runs` | Record of each research execution | seed_keywords, location, language, status, created_at |
| `keyword_clusters` | Grouped keyword themes from research | cluster_name, intent, keywords[], total_volume, research_run_id |
| `page_mapping_recommendations` | Which keyword clusters map to which page types | primary_keyword, page_type, recommended_slug, priority, mapping_status |
| `site_structure_recommendations` | Structural suggestions from keyword analysis | recommendation_type, description, priority, status |

#### Layer 2: Evidence Memory

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `audit_runs` | Record of each technical audit execution | domain, scope, provider, pages_crawled, score, status |
| `audit_issues` | Individual issues found during audits | issue_type, severity, affected_url, status, evidence[], fix_instruction |
| `audit_rechecks` | Verification that fixes were applied | issue_id, previous_status, new_status, diff_summary |
| `competitor_benchmark_runs` | Record of each competitor analysis | competitor_domain, own_domain, status, metrics |
| `competitor_page_classifications` | How competitor pages are categorized | url, page_type, topic, word_count, estimated_traffic |
| `competitor_gap_recommendations` | Gaps found vs competitors | gap_type, description, priority, competitor_domain |

#### Layer 3: Execution Memory

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `opportunities` | Actionable items surfaced from evidence | type, priority, target_url, keyword_id, status, recommended_action |
| `opportunity_evidence` | Links opportunities to their source data | opportunity_id, evidence_source, evidence_type, evidence_value |
| `opportunity_lifecycle_events` | Tracks each stage an opportunity passes through | opportunity_id, event_type, entity_type, entity_id, summary, actor |
| `seo_briefs` | Content briefs created from opportunities/mappings | keyword, title, page_type, sections[], evidence[], priority |
| `seo_brief_drafts` | AI-generated drafts from briefs | brief_id, content, version, status, review_checks[] |
| `client_approvals` | Approval decisions on briefs/drafts/articles | entity_type, entity_id, status, reviewer, feedback |
| `publishing_jobs` | Publishing execution records | asset_type, asset_id, platform, publish_status, scheduled_time |
| `published_content_records` | What was actually published and when | url, title, publish_date, source_brief_id, source_article_id |

#### Layer 4: Performance Memory

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `rank_snapshots` | Historical keyword position tracking | keyword, url, position, previous_position, snapshot_date |
| `analytics_snapshots` | Periodic GA4/GSC metric captures | url, clicks, impressions, ctr, position, sessions, period |
| `content_performance_summaries` | Aggregated performance per published page | url, clicks_7d, clicks_30d, impressions_30d, avg_position, trend |

#### Layer 5: Site/Content Memory

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `content_inventory` | Complete inventory of all site pages | url, title, word_count, last_updated, has_brief, has_article, audit_score |
| `internal_link_suggestions` | Recommended internal links between pages | source_url, target_url, anchor_text, relevance_score, status |
| `page_relationships` | Structural relationships between pages | source_url, target_url, relationship_type (parent/child, sibling, hub-spoke) |

---

## 4. AI Decision Logic

### Core Principle

Future AI planning must **NOT** rely on raw prompting alone. It must reason from stored, structured data.

### What AI Should Reason From

| Data Source | Decision It Informs |
|-------------|---------------------|
| Stored audit evidence | Which technical issues affect content quality |
| Competitor evidence | What competitors rank for that we don't |
| Keyword mapping history | Which pages were already planned for which keywords |
| Opportunity history | Which gaps were identified, which are still open |
| Brief/draft/approval outcomes | What was created, what was rejected and why |
| Publishing status | What actually went live vs what's stuck |
| Ranking & analytics performance | Whether published content improved rankings |
| Internal link & site structure context | How pages relate, where link equity flows |

### The Decision Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Evidence Sources ──→ Opportunity/Recommendation ──→ Brief          │
│       ↑                                                ↓            │
│       │                                             Draft           │
│       │                                                ↓            │
│  Future Planning ←── Performance Feedback ←── Publish ←── Approval  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Each step in this loop creates a record. The AI should:

1. **Detect opportunities** by cross-referencing audit issues, competitor gaps, keyword coverage gaps, and ranking drops
2. **Prioritize** based on historical performance of similar actions (e.g., "pages about X topic gained Y positions after publishing")
3. **Generate briefs** with full evidence context (audit issues, competitor pages, keyword data)
4. **Explain recommendations** by citing stored evidence ("This keyword cluster was identified in research run #12, competitors rank for it, and your audit shows the existing page has thin content")
5. **Learn from outcomes** by comparing pre/post-publish ranking and traffic data
6. **Avoid repetition** by checking what was already recommended, approved, or dismissed

### Lifecycle Event Types

Each opportunity tracks its journey through these event types:
- `created` — opportunity surfaced from evidence
- `brief_created` — a brief was generated for this opportunity
- `draft_generated` — AI draft was created from the brief
- `approved` — content was approved by client/team
- `published` — content was published to CMS
- `performance_checked` — post-publish performance was measured
- `dismissed` — opportunity was deliberately skipped
- `reopened` — dismissed opportunity was reconsidered

---

## 5. Backend Expectations

### What the Backend Must Do

#### 5.1 External API Integration
- **DataForSEO** — technical audits, keyword data, SERP checking, backlink data
- **Google Analytics 4** — traffic, sessions, conversions (via OAuth)
- **Google Search Console** — clicks, impressions, CTR, position (via OAuth)
- **Google Ads** — campaign data, performance metrics (via OAuth)
- **Google Business Profile** — profile data, posts, reviews, Q&A (via OAuth)
- **OpenAI / Anthropic** — content generation (briefs, drafts, ad copy, social posts)
- **WordPress** — publishing via application passwords
- **Image AI providers** — creative asset generation

#### 5.2 Data Normalization
All external API responses must be normalized into the standardized TypeScript interfaces defined in `src/lib/api.ts`. The backend owns the transformation layer.

#### 5.3 Structured Entity Storage (Supabase/PostgreSQL)
Every entity in the five memory layers (Section 3) must be stored with:
- Unique IDs (UUID)
- `client_id` foreign key for multi-tenant isolation
- `created_at` and `updated_at` timestamps
- Status fields with constrained enums
- Foreign keys linking related entities (opportunity → brief → draft → article → publishing_job)

#### 5.4 Stable API Contracts
The backend must expose REST endpoints matching the frontend's `request()` calls. All response shapes must match the TypeScript interfaces in `src/lib/api.ts`.

#### 5.5 Status History & Evidence Links
Every entity that changes status must preserve its history:
- `opportunity_lifecycle_events` for opportunity status changes
- `audit_rechecks` for issue re-verification
- `client_approvals` for approval decisions
- `publishing_jobs` for publish attempts

Every recommendation must link back to its evidence:
- `opportunity_evidence` linking to audit issues, competitor gaps, keyword data
- `seo_briefs` containing `evidence[]`, `audit_context[]`, `competitor_context[]`

#### 5.6 AI Explanation & Prioritization
The backend must store enough context for AI to explain its recommendations:
- Why an opportunity was created (which evidence triggered it)
- Why a keyword was prioritized (search volume, competitor coverage, current gap)
- Why a page was recommended (audit score, content thinness, competitor comparison)

---

## 6. Expected Backend API Endpoints

### Auth
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

### Clients
- `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/:id`

### Keywords & Rankings
- `GET/POST /api/clients/:id/keywords`, `GET /api/rankings?client_id=`

### Keyword Research
- `POST /api/keyword-research/start`
- `GET /api/keyword-research/jobs/:id`
- `GET /api/keyword-research/jobs/:id/clusters`
- `GET /api/keyword-research/jobs/:id/mappings`
- `POST /api/keyword-research/jobs/:id/mappings/:mappingId/create-brief`

### Competitors & Benchmarks
- `GET/POST /api/clients/:id/competitors`
- `GET /api/clients/:id/competitor-benchmarks`, `POST /api/competitor-benchmarks/start`
- `GET /api/competitor-benchmarks/:id`

### Audit
- `GET/POST /api/audit/runs`, `GET /api/audit/runs/:id`
- `GET /api/audit/issues`, `GET/PATCH /api/audit/issues/:id`
- `POST /api/audit/issues/:id/recheck`, `POST /api/audit/runs/:id/recheck`

### SEO Briefs & Drafts
- `GET /api/clients/:id/briefs`, `GET /api/briefs/:id`
- `POST /api/briefs/generate`, `POST /api/briefs/from-mapping`
- `PUT /api/briefs/:id`, `PATCH /api/clients/:id/briefs/:id`
- `POST /api/briefs/:id/generate-draft`, `GET /api/briefs/:id/drafts`
- `PUT /api/drafts/:id`, `PATCH /api/drafts/:id/status`

### Articles
- `GET /api/clients/:id/articles`, `POST /api/articles/generate`
- `PUT /api/articles/:id`, `POST /api/articles/:id/approve`
- `PATCH /api/articles/:id/status`, `POST /api/articles/:id/publish`

### Opportunities (with Planning Memory)
- `GET /api/clients/:id/opportunities` — returns `OpportunityWithMemory[]`
- `GET /api/clients/:id/opportunities/:oppId` — returns single `OpportunityWithMemory`
- `PATCH /api/clients/:id/opportunities/:oppId` — update status

### Content Inventory & Performance
- `GET /api/clients/:id/content-inventory` — returns `ContentInventoryItem[]`
- `GET /api/clients/:id/content-performance` — returns `ContentPerformanceSummary[]`
- `GET /api/clients/:id/published-content` — returns `PublishedContentRecord[]`
- `GET /api/clients/:id/page-relationships` — returns `PageRelationship[]`
- `GET /api/clients/:id/rank-snapshots` — returns `RankSnapshot[]`

### Social & Video
- `GET /api/articles/:id/social-posts`, `POST /api/social/generate`
- `PUT /api/social/:id`, `POST /api/social/:id/approve`
- `GET /api/clients/:id/videos`, `POST /api/videos/generate`

### Publishing
- `POST /api/publishing/schedule`, `POST /api/publishing/:id/retry`
- `POST /api/publishing/:id/cancel`, `PUT /api/publishing/:id/reschedule`
- `GET /api/clients/:id/publishing-jobs`

### AI Generation
- `POST /api/ai/articles/generate`, `POST /api/ai/social/generate`, `POST /api/ai/videos/generate`

### Analytics
- `GET /api/clients/:id/analytics-connections`, `POST /api/analytics/connect`, `POST /api/analytics/sync`
- `GET /api/clients/:id/performance-summary`, `GET /api/clients/:id/page-performance`
- `GET /api/clients/:id/keyword-performance`, `GET /api/clients/:id/asset-performance`
- `GET /api/clients/:id/performance-insights`

### Attribution (analytics-only — NOT CRM)
- `GET /api/clients/:id/attribution/overview`
- `GET /api/clients/:id/attribution/contacts`
- `GET /api/clients/:id/attribution/deals`
- `POST /api/clients/:id/attribution/recompute`

### GBP / Local SEO
- `GET /api/clients/:id/gbp-connection`, `GET /api/clients/:id/gbp-profile`
- `GET /api/clients/:id/gbp-posts`, `GET /api/clients/:id/gbp-reviews`, `GET /api/clients/:id/gbp-qna`
- `POST /api/gbp/sync`, `POST /api/gbp/posts/generate`
- `POST /api/gbp/posts/:id/approve`, `POST /api/gbp/reviews/:id/generate-response`
- `POST /api/gbp/reviews/:id/approve`, `POST /api/gbp/qna/:id/generate-answer`, `POST /api/gbp/qna/:id/approve`

### Google Ads
- `GET /api/clients/:id/ads-campaigns`, `GET /api/clients/:id/ads-recommendations`
- `GET /api/clients/:id/ads-performance`, `GET /api/clients/:id/ads-copy`, `GET /api/clients/:id/ads-insights`
- `POST /api/ads/recommendations/generate`, `POST /api/ads/copy/generate`
- `POST /api/ads/copy/:id/approve`, `PUT /api/ads/recommendations/:id`, `POST /api/ads/sync`

### Creative
- `GET /api/clients/:id/creative-assets`, `GET /api/creative/:id`
- `POST /api/creative/generate`, `POST /api/creative/:id/approve`
- `POST /api/creative/:id/regenerate`, `POST /api/creative/:id/delete`
- `GET /api/creative/brand/:clientId`, `POST /api/creative/brand`

### Command Center
- `GET /api/clients/:id/command-center`, `GET /api/clients/:id/marketing-priorities`
- `GET /api/clients/:id/cross-channel-recommendations`, `GET /api/clients/:id/quick-wins`
- `GET /api/clients/:id/weekly-action-plans`, `GET /api/clients/:id/marketing-goals`
- `POST /api/clients/:id/priorities/recompute`, `POST /api/clients/:id/recommendations/generate`
- `POST /api/clients/:id/weekly-action-plan/generate`
- `PUT /api/command/priorities/:id`, `PUT /api/command/recommendations/:id`, `PUT /api/command/items/:id`

### Reports
- `GET /api/report-templates`, `GET /api/clients/:id/reports`
- `POST /api/reports/generate`, `GET /api/reports/share/:token`
- `GET /api/workspaces/:id/scheduled-reports`
- `POST /api/scheduled-reports`, `PUT /api/scheduled-reports/:id`, `DELETE /api/scheduled-reports/:id`

### AI Visibility
- `GET /api/clients/:id/ai-visibility/prompt-sets`, `POST /api/ai-visibility/prompt-sets`
- `PUT /api/ai-visibility/prompt-sets/:id`, `DELETE /api/ai-visibility/prompt-sets/:id`
- `GET /api/ai-visibility/prompt-sets/:id/prompts`
- `POST /api/ai-visibility/prompts`, `POST /api/ai-visibility/prompts/bulk`, `DELETE /api/ai-visibility/prompts/:id`
- `POST /api/ai-visibility/runs`, `GET /api/clients/:id/ai-visibility/runs`
- `GET /api/ai-visibility/runs/:id/observations`, `GET /api/clients/:id/ai-visibility/overview`

### Onboarding & Setup
- `POST /api/onboarding/start`, `GET /api/onboarding/:id`, `PUT /api/onboarding/:id`
- `POST /api/onboarding/:id/complete`
- `GET /api/templates`, `GET /api/templates/:id`
- `POST /api/setup/run`, `GET /api/setup/:id/status`
- `GET /api/clients/:id/activation-checklist`, `PUT /api/activation-checklist/:id`

### Activity, Notifications & Jobs
- `GET /api/activity`, `GET /api/notifications`, `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`, `GET /api/notifications/unread-count`
- `GET /api/publishing-jobs`

### Content Plan & Internal Links
- `GET /api/clients/:id/content-plan`, `PATCH /api/clients/:id/content-plan/:id`
- `GET /api/clients/:id/internal-links`, `PATCH /api/clients/:id/internal-links/:id`

### CMS
- `GET /api/clients/:id/cms`, `POST /api/clients/:id/cms`, `DELETE /api/clients/:id/cms`
- `POST /api/clients/:id/cms/test`

---

## 7. Database Schema (Backend — Pending)

### Core
`workspaces`, `users`, `user_roles`, `user_permissions`, `invites`, `sessions`

### Clients
`clients`, `client_approvals`

### SEO
`keywords`, `rank_snapshots`, `competitors`, `audit_runs`, `audit_issues`, `seo_opportunities`, `internal_link_suggestions`, `content_suggestions`

### Keyword Research
`keyword_research_jobs`, `keyword_clusters`, `keyword_items`, `page_mappings`

### Competitor Benchmark
`competitor_benchmarks`, `benchmark_metrics`, `benchmark_findings`

### Content
`seo_briefs`, `seo_brief_drafts`, `draft_review_checks`, `seo_articles`, `cms_connections`, `publishing_jobs`, `social_posts`, `video_assets`

### Planning Memory (NEW — required for AI decision loop)
`opportunity_evidence`, `opportunity_lifecycle_events`, `content_inventory`, `content_performance_summaries`, `published_content_records`, `page_relationships`

### Analytics
`analytics_connections`, `performance_snapshots`, `performance_insights`

### Attribution (analytics-only)
`lead_capture_events`, `attribution_records`

### Local SEO
`gbp_connections`, `gbp_profile_snapshots`, `gbp_post_drafts`, `gbp_reviews`, `gbp_qna`, `local_seo_insights`

### Creative
`creative_assets`, `brand_profiles`

### Ads
`google_ads_accounts`, `ads_campaigns`, `ads_recommendations`, `ads_copy_drafts`, `ads_insights`

### Command Center
`command_priorities`, `command_recommendations`, `weekly_action_plans`, `weekly_action_items`, `marketing_goals`

### Reports
`report_templates`, `scheduled_reports`, `report_runs`

### AI Visibility
`ai_vis_prompt_sets`, `ai_vis_prompts`, `ai_vis_runs`, `ai_vis_observations`

### Content Engine
`content_scores`, `topical_maps`, `bulk_content_jobs`

### Onboarding
`onboarding_sessions`, `setup_templates`, `activation_checklist_items`

### SaaS
`subscription_plans`, `workspace_subscriptions`, `usage_records`

### Activity & Notifications
`activity_log`, `notifications`

### Removed Tables (do NOT create)
- ~~`crm_contacts`~~, ~~`crm_deals`~~, ~~`crm_activities`~~, ~~`crm_insights`~~
- ~~`conversations`~~, ~~`messages`~~, ~~`inboxes`~~
- ~~`automation_rules`~~, ~~`canned_responses`~~
- ~~`kb_categories`~~, ~~`kb_articles`~~
- ~~`csat_responses`~~

---

## 8. Non-Goals / Later Phases

These are intentionally deferred and should NOT be built in the initial backend:

| Feature | Why Deferred |
|---------|-------------|
| **Backlink intelligence** | Requires dedicated DataForSEO integration; core SEO workflow works without it |
| **Schema automation** | JSON-LD generator exists in frontend; auto-deployment is a later optimization |
| **Content calendar expansion** | Basic calendar exists; advanced drag-and-drop scheduling is polish |
| **Advanced social publishing automation** | Direct API publishing to social platforms requires per-platform OAuth — later phase |
| **Deeper AI visibility tracking** | Current prompt-based tracking is functional; real-time monitoring is future |
| **Multi-workspace billing** | SaaS packaging tables exist but billing integration (Stripe) is later |
| **Advanced report templates** | Basic report generation first; custom template builder later |

---

## 9. Frontend Implementation Details

### Global Client Context
All modules use a persistent `activeClientId` via `ClientContext` and `GlobalClientSelector` in the header. Selection persists in `localStorage`. Data automatically filters to the selected client.

### Mascot System
3D anime-style mascot cast (NOT a chatbot):

| Character | Role | Module |
|-----------|------|--------|
| **Sera** | SEO Director | SEO pages |
| **Max** | SEM Director | Ads/SEM pages |
| **Kai** | Content Creator | Content pages |

Components: `MascotHeroBanner`, `MascotSectionHeader`, `MascotEmptyState`
Assets: Transparent PNGs in `src/assets/` with ambient glow effects.

### Design System
- **Typography:** Space Grotesk (display), system sans-serif (body)
- **Palette:** Indigo/Violet primary, Cyan accent — "AI Control Tower" aesthetic
- **Mode:** Light-mode first, dark mode supported
- **Tokens:** HSL semantic tokens in `index.css`
- **Motion:** Framer Motion page transitions
- **Components:** Full shadcn/ui library, Recharts for charts

### Demo Mode
- Frontend-only mock data in `src/lib/demo-data.ts`
- `matchDemoRoute(path, method, body)` intercepts all failed API calls
- Same schema as live API endpoints
- When `VITE_API_URL` is set and backend responds, mock data is bypassed automatically

### Planning Memory UI Components
- `PlanningMemoryTrail` — vertical timeline showing decision history for any entity
- `LifecycleStatusBar` — compact icon strip: Brief → Draft → Article → Published → Tracked

---

## 10. Backend Implementation Priorities

### Priority 1: Core API
- Express server with JWT auth, role-based permissions
- PostgreSQL with clean migrations (NO CRM tables)
- Client CRUD with workspace isolation
- Keyword tracking + rank snapshots

### Priority 2: Audit & Research
- Technical audit engine (DataForSEO provider)
- Competitor benchmark engine with gap analysis
- Keyword research engine with service-page-first clustering and page mapping
- Internal link suggestion engine

### Priority 3: Content Pipeline
- Brief generation from keyword mappings
- Draft generation via AI (OpenAI/Anthropic)
- Article CRUD with status workflow
- Approval workflow with review checks
- Publishing to WordPress
- Social post generation from articles

### Priority 4: Planning Memory Infrastructure
- `opportunity_evidence` table linking opportunities to source data
- `opportunity_lifecycle_events` table tracking status changes
- `content_inventory` table for site-wide page tracking
- `content_performance_summaries` table for post-publish metrics
- `published_content_records` table for publication tracking
- `page_relationships` table for site structure mapping

### Priority 5: Channels
- Analytics sync (GA4/GSC via OAuth)
- GBP management
- Google Ads integration
- Creative asset generation

### Priority 6: Infrastructure
- Background worker (rank tracking, analytics sync, scheduled publishing)
- Report generation with PDF/HTML output
- Command Center scoring engine
- Attribution engine (analytics-only)
- AI Visibility run engine
- Activity logging + notifications

### Priority 7: Backend Cleanup
- Remove all CRM-related backend files: `backend/src/services/crm/`, `backend/src/routes/crm.ts`
- Remove inbox/automations/knowledge-base/csat routes
- Remove Chatwoot migration (`037_chatwoot_searchatlas.sql`)
- Clean CRM references from seed data

---

## 11. Remaining Frontend Technical Debt

- Attribution types still reference `deal_name`/`deal_stage` — acceptable for analytics but naming could be refined
- Some backend files on disk reference removed CRM modules — backend cleanup task
- Portal sub-routes (`/portal/articles`, etc.) render `PortalOverview` as placeholder
- Keyword Research and Analytics pages could show more planning memory context (what research led to published content)

---

## 12. Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Route definitions, auth guards |
| `src/lib/api.ts` | All TypeScript interfaces + API client functions |
| `src/lib/demo-data.ts` | Mock data layer with `matchDemoRoute()` |
| `src/contexts/AuthContext.tsx` | Auth state, demo mode flag |
| `src/contexts/ClientContext.tsx` | Global client selection |
| `src/contexts/WorkspaceRestoreContext.tsx` | Workspace state persistence + restore contracts |
| `src/hooks/use-workspace-restore.ts` | Per-page restore hook (filters, entity focus, UI state) |
| `src/components/AppSidebar.tsx` | Navigation structure |
| `src/components/MascotCast.tsx` | Mascot system (Sera, Max, Kai) |
| `src/components/PlanningMemoryTrail.tsx` | Lifecycle trail + status bar components |
| `src/components/AppLayout.tsx` | Main layout wrapper |
| `src/index.css` | Design tokens (HSL semantic colors) |
| `tailwind.config.ts` | Tailwind theme extensions |
| `backend/src/index.ts` | Express server entry point (needs implementation) |
| `backend/db/migrations/` | 40 migration files (includes deprecated CRM ones to remove) |

---

## 12. Session Persistence & Workspace Restore

### 12.1 Key Distinction

| Concern | What It Solves | Where It Lives |
|---------|---------------|----------------|
| **Session / Auth Persistence** | User stays signed in across browser restarts | Auth token (JWT or session cookie) + backend session store |
| **Workspace Restore** | User returns to the same page, client, filters, and open work item | Dedicated `workspace_state` table + frontend local cache |

These are **separate systems** that work together. Auth persistence keeps the door open; workspace restore puts the user back at their desk.

### 12.2 Target User Experience

1. User is working on a brief for Client X with filters applied
2. User closes the browser (or laptop sleeps)
3. User returns hours/days later
4. **If session is still valid** → app loads directly, restores workspace context, user lands on the same brief
5. **If session expired** → user signs in again → after auth, workspace context is still restored from backend
6. The experience should feel like "the app remembers me"

### 12.3 Workspace State Model

#### Frontend Contract (implemented in `src/contexts/WorkspaceRestoreContext.tsx`)

```typescript
interface UserWorkspaceState {
  userId: string;
  lastRoute: string;             // e.g. "/brief-workflow"
  selectedClientId: string;
  moduleKey: string;              // e.g. "briefs", "audit", "keywords"
  entityFocus: {
    entityType: "opportunity" | "brief" | "draft" | "audit_run" | "audit_issue" | "keyword_job" | "article" | null;
    entityId: string | null;
  };
  filters: Record<string, string | string[] | boolean | number | undefined>;
  uiState: {
    activeTab?: string;
    panelOpen?: boolean;
    panelEntityId?: string;
    expandedIds?: string[];
  };
  updatedAt: string;              // ISO timestamp of last state change
}
```

This stores **meaningful workflow context**, not auth state or sensitive data.

#### Backend Table (for future implementation)

```sql
CREATE TABLE workspace_state (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  state      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only read/write their own row
ALTER TABLE workspace_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own state"
  ON workspace_state FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 12.4 What Should Be Restored

| Restore Target | Example | Priority |
|---------------|---------|----------|
| Last route/page | `/brief-workflow` | High |
| Selected client | Client X active in header selector | High |
| Active module | `briefs`, `audit`, `keywords` | High |
| Active filters | severity=critical, status=draft | High |
| Open entity | Brief #abc is selected/expanded | High |
| Active tab | "Clusters" tab in Keyword Research | Medium |
| Panel state | Side panel open with issue detail | Medium |
| Sort preferences | Sort by volume descending | Low |

**Do NOT restore:** scroll position, hover states, modal/dialog open state, form input mid-typing, or any sensitive data.

### 12.5 Storage Architecture

```
┌─────────────────────────────────────────────────┐
│                  Auth Layer                      │
│  JWT / session token → keeps user signed in      │
│  Stored: httpOnly cookie or localStorage token   │
│  Managed by: AuthContext + backend /auth/me       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│           Backend Persistent Layer               │
│  workspace_state table (Supabase/Postgres)       │
│  Source of truth for cross-device continuity     │
│  Synced via GET/PUT /api/workspace-state          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│           Frontend Local Cache                   │
│  localStorage key: webby_workspace_state         │
│  Provides instant restore before API responds    │
│  Falls back gracefully if cleared                │
└─────────────────────────────────────────────────┘
```

**Why local storage alone is not enough:**
- Cleared when user clears browser data
- Not available on a different device
- No server-side validation of referenced entity IDs

**Local cache is still valuable** as a fast restore layer before the API responds.

### 12.6 Backend Endpoints (expected)

```
GET  /api/workspace-state
  → Returns: UserWorkspaceState (from JSONB column)
  → Auth: requires valid session, scoped to auth.uid()

PUT  /api/workspace-state
  → Body: Partial<UserWorkspaceState>
  → Upserts the user's row, merges with existing state
  → Sets updated_at = now()
  → Auth: requires valid session, scoped to auth.uid()
```

Frontend should **debounce** upserts (e.g. 2-second trailing debounce) to avoid excessive writes during active navigation.

### 12.7 Restore Flow

```
App Load
  ├─ 1. Check auth token (localStorage or cookie)
  ├─ 2. Call GET /api/auth/me → validate session
  │     ├─ Valid → user is signed in
  │     └─ Expired → redirect to /login → after login, continue from step 3
  ├─ 3. Call GET /api/workspace-state
  │     ├─ State exists → navigate to lastRoute with context
  │     └─ No state → land on default Dashboard
  └─ 4. As user works, debounce PUT /api/workspace-state
```

### 12.8 Frontend Implementation Status

| Component | Status |
|-----------|--------|
| `WorkspaceRestoreContext` + `WorkspaceRestoreProvider` | ✅ Implemented |
| `usePageRestore(moduleKey)` hook | ✅ Implemented |
| localStorage persistence layer | ✅ Implemented |
| Route auto-tracking | ✅ Implemented |
| Client selection tracking | ✅ Implemented |
| Backend API integration | ❌ Pending backend |
| Cross-device sync | ❌ Pending backend |
| Login redirect to lastRoute | ❌ Pending backend |

#### Pages with Restore Support

| Page | Tracked State |
|------|--------------|
| Brief Workflow | selectedBriefId, activeTab, status/pageType/priority filters |
| Audit | mainTab, selectedRunId, selectedIssueId, severity filter |
| Keyword Research | activeTab, selectedJob, intent filter, sort key/direction |
| Opportunities | expandedId (focused opportunity) |

#### Pages Pending Restore Support

| Page | What Should Be Tracked |
|------|----------------------|
| Dashboard / Command Center | Active date range, widget collapse state |
| Reports | Selected report, date range, export format |
| Analytics | Active GA4/GSC tab, date comparison range |
| Competitor Benchmark | Selected competitor, active comparison tab |

### 12.9 Non-Goals

- ❌ Restore every tiny visual detail (scroll position, hover states)
- ❌ Store sensitive data (passwords, tokens, PII) in workspace state
- ❌ Rely solely on browser localStorage for long-term continuity
- ❌ Simulate multi-device sync before backend exists
- ❌ Confuse session persistence (auth) with workflow persistence (workspace state)
- ❌ Auto-restore modal/dialog open states (disorienting on return)

---

*Last updated: 2026-03-28*
*Version: v8.2 — Comprehensive session persistence and workspace restore architecture*
