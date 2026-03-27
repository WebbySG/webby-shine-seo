# Webby SEO OS — System Overview

> **Purpose:** Single source of truth for the platform's architecture, scope, and implementation status. Separates frontend (Lovable) from backend (pending Claude build).

---

## 1. Product Identity

**Webby SEO OS** is a multi-tenant digital marketing operating system for agencies, focused on:

- **SEO** — technical audit, keyword research, competitor benchmarking, rankings
- **SEM** — Google Ads campaign management, ad copy generation
- **SMM** — social media content, video assets, GBP/local SEO
- **Content** — briefs, drafts, approvals, publishing
- **Analytics & Reporting** — GA4/GSC performance, attribution, scheduled reports

**NOT in scope:** CRM, helpdesk, inbox, deal pipelines, contact management, support ticketing. These were removed in v6.0.

---

## 2. Architecture Split

| Layer | Status | Technology |
|-------|--------|-----------|
| **Frontend** | ✅ Built in Lovable | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| **Backend** | ⏳ Pending (Claude) | Express.js (TypeScript), PostgreSQL |
| **Worker** | ⏳ Pending (Claude) | Node.js background job runner (cron-based) |
| **Auth** | ⏳ Pending (Claude) | Self-hosted JWT + bcrypt |
| **Demo Mode** | ✅ Built in Lovable | Frontend mock data layer (`demo-data.ts`) with identical schema to live API |

The frontend works fully in **demo/mock mode** using intercepted API calls. When a backend is connected via `VITE_API_URL`, mock data is bypassed.

---

## 3. Frontend Modules (Implemented in Lovable)

### Core
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | KPI cards, visibility trend, channel distribution, client health, quick actions |
| Command Center | `/command-center` | Marketing priorities, cross-channel recommendations, weekly plans |

### SEO
| Page | Route | Description |
|------|-------|-------------|
| Keyword Research | `/keyword-research` | Service-page-first keyword research with clustering, page mapping, structure recommendations |
| Rankings | `/rankings` | Keyword position tracking with history |
| Site Audit | `/audit` | Technical SEO audit with issues, rechecks, evidence; Internal Links tab |
| Competitor Benchmark | `/competitor-benchmark` | Public-site benchmarking, gap detection, strategic recommendations |
| Opportunities | `/opportunities` | Near-wins, content gaps, page expansion opportunities |
| Backlinks | `/backlinks` | Backlink monitoring and analysis |
| Site Explorer | `/site-explorer` | Domain overview and competitive analysis |
| SERP Checker | `/serp-checker` | SERP position checker |
| Schema Creator | `/schema-creator` | JSON-LD structured data generator |
| AI Visibility | `/ai-visibility` | AI/LLM citation tracking across models |

### Content & Publishing
| Page | Route | Description |
|------|-------|-------------|
| Brief Workflow | `/brief-workflow` | Service-page brief creation → draft → review → approval workflow |
| Topical Maps | `/topical-maps` | Topic cluster strategy builder |
| Articles | `/articles` | Article management with status workflow |
| Content Studio | `/content-studio` | Content scoring + AI rewriter (unified) |
| Bulk Content | `/bulk-content` | Batch AI content generation |
| Content Calendar | `/calendar` | Unified calendar with drag-and-drop rescheduling |
| Social Media | `/social-media` | Social post management |
| Videos | `/videos` | AI video script & asset management |
| Creative | `/creative` | AI creative asset generation |

### Channels
| Page | Route | Description |
|------|-------|-------------|
| Analytics | `/analytics` | GA4/GSC performance analytics |
| Local SEO | `/local-seo` | Google Business Profile management |
| Google Ads | `/google-ads` | Campaign management and AI ad copy |

### Business
| Page | Route | Description |
|------|-------|-------------|
| Clients | `/clients` | Client management list |
| Client Detail | `/clients/:id` | Individual client detail with tabs |
| Reports | `/reports` | Report builder and scheduled reports |

### System
| Page | Route | Description |
|------|-------|-------------|
| Operations | `/operations` | Job center + activity log (unified) |
| Settings | `/settings` | Workspace, branding, team, billing |
| QA Checklist | `/qa` | Dev-only QA test checklist |

### Portal (Client-facing)
| Page | Route | Description |
|------|-------|-------------|
| Portal Overview | `/portal` | Client portal dashboard |
| Portal Performance | `/portal/performance` | Client-facing performance view |
| Portal Settings | `/portal/settings` | Client portal settings |

---

## 4. Global Client Context

All modules use a persistent `activeClientId` via `ClientContext` and `GlobalClientSelector` in the header. Selection persists in `localStorage`. Data automatically filters to the selected client without per-page re-selection.

---

## 5. Frontend Type Contracts

These TypeScript interfaces in `src/lib/api.ts` define the data contracts the backend must implement:

### Core Entities
- `Client` — id, name, domain, keywords_count, competitors_count, health_score, status
- `KeywordRanking` — keyword, current_position, last_position, change, ranking_url
- `Competitor` — domain, label, source, confirmed

### Audit
- `AuditRun` — domain, scope, provider, pages_crawled, score, status, issue counts
- `AuditIssue` — issue_type, severity, affected_url, description, fix_instruction, status, evidence[], rechecks[]
- `AuditPage` — url, status_code, title, meta_description, word_count, load_time_ms
- `AuditEvidence` — evidence_type, key, value, expected_value
- `AuditRecheck` — previous_status, new_status, diff_summary

### Content Lifecycle
- `SeoBrief` — keyword, title, page_type, secondary_keywords, search_intent, target_audience, page_goal, cta_angle, sections[], competitor_context[], audit_context[], evidence[], priority
- `SeoBriefDraft` — brief_id, title, slug, content, version, status, review_checks[], internal_link_suggestions[]
- `DraftReviewCheck` — check_type, label, status (pass/fail/warning/pending), detail
- `SeoArticle` — brief_id, title, content, status, target_keyword, slug, publish_date
- `SocialPost` — platform, content, status, scheduled_time
- `VideoAsset` — platform, video_script, scene_breakdown, status

### Publishing & Approvals
- `PublishingJob` — asset_type, asset_id, platform, job_type, publish_status, provider
- `CmsConnection` — cms_type, site_url, username

### Analytics & Attribution
- `AnalyticsConnection` — provider (gsc/ga4), status
- `PerformanceInsight` — insight_type, priority, title, description, status
- `PerformanceSummaryResponse` — clicks, impressions, ctr, position, sessions
- `AttributionOverview` — byChannel[], dealAttribution[] (analytics-only, NOT CRM)

### Local SEO
- `GbpConnection`, `GbpProfile`, `GbpPostDraft`, `GbpReviewItem`, `GbpQnaItem`, `LocalSeoInsight`

### Google Ads
- `AdsCampaign`, `AdsRecommendation`, `AdsCopyDraft`, `AdsInsight`, `AdsPerformanceResponse`

### Command Center
- `CommandCenterSummary`, `MarketingPriority`, `CrossChannelRecommendation`, `WeeklyActionPlan`, `MarketingGoal`

### Competitor Benchmark
- `CompetitorBenchmark` — competitor_domain, own_domain, status, metrics, findings, gap analysis

---

## 6. Expected Backend API Endpoints

### Auth
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

### Clients
- `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/:id`

### Keywords & Rankings
- `GET/POST /api/clients/:id/keywords`, `GET /api/rankings?client_id=`

### Competitors
- `GET/POST /api/clients/:id/competitors`

### Audit
- `GET/POST /api/audit/runs`, `GET /api/audit/runs/:id`
- `GET /api/audit/issues`, `GET/PATCH /api/audit/issues/:id`
- `POST /api/audit/issues/:id/recheck`, `POST /api/audit/runs/:id/recheck`

### Competitor Benchmark
- `GET /api/clients/:id/competitor-benchmarks`, `POST /api/competitor-benchmarks/start`
- `GET /api/competitor-benchmarks/:id`

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

### Social & Video
- `GET /api/articles/:id/social-posts`, `POST /api/social/generate`
- `PUT /api/social/:id`, `POST /api/social/:id/approve`
- `GET /api/clients/:id/videos`, `POST /api/videos/generate`

### Publishing
- `POST /api/publishing/schedule`, `POST /api/publishing/:id/retry`
- `POST /api/publishing/:id/cancel`, `PUT /api/publishing/:id/reschedule`
- `GET /api/clients/:id/publishing-jobs`, `GET /api/publishing-jobs`

### AI Generation
- `POST /api/ai/articles/generate`, `POST /api/ai/social/generate`, `POST /api/ai/videos/generate`

### Analytics
- `GET /api/clients/:id/analytics-connections`, `POST /api/analytics/connect`
- `POST /api/analytics/sync`
- `GET /api/clients/:id/performance-summary`, `GET /api/clients/:id/page-performance`
- `GET /api/clients/:id/keyword-performance`, `GET /api/clients/:id/asset-performance`
- `GET /api/clients/:id/performance-insights`

### Attribution (analytics-only)
- `GET /api/clients/:id/attribution/overview`
- `GET /api/clients/:id/attribution/contacts`
- `GET /api/clients/:id/attribution/deals`
- `POST /api/clients/:id/attribution/recompute`

### GBP / Local SEO
- `GET /api/clients/:id/gbp-connection`, `GET /api/clients/:id/gbp-profile`
- `GET /api/clients/:id/gbp-posts`, `GET /api/clients/:id/gbp-reviews`
- `POST /api/gbp/sync`, `POST /api/gbp/posts/generate`

### Google Ads
- `GET /api/clients/:id/ads-campaigns`, `GET /api/clients/:id/ads-recommendations`
- `GET /api/clients/:id/ads-performance`
- `POST /api/ads/recommendations/generate`, `POST /api/ads/copy/generate`

### Creative
- `GET /api/clients/:id/creative-assets`, `POST /api/creative/generate`
- `GET/POST /api/creative/brand/:id`

### Command Center
- `GET /api/clients/:id/command-center`, `GET /api/clients/:id/marketing-priorities`
- `GET /api/clients/:id/cross-channel-recommendations`
- `POST /api/clients/:id/priorities/recompute`

### Reports
- `GET /api/report-templates`, `GET /api/clients/:id/reports`
- `POST /api/reports/generate`, `GET /api/reports/share/:token`

### AI Visibility
- `GET /api/clients/:id/ai-visibility/prompt-sets`, `POST /api/ai-visibility/prompt-sets`
- `POST /api/ai-visibility/runs/trigger`, `GET /api/clients/:id/ai-visibility/runs`
- `GET /api/ai-visibility/runs/:id/observations`

### Onboarding
- `POST /api/onboarding/start`, `GET /api/onboarding/:id`
- `POST /api/onboarding/:id/complete`

### Activity & Notifications
- `GET /api/activity`, `GET /api/notifications`, `PUT /api/notifications/:id/read`

---

## 7. Database Schema (Backend — Pending)

Tables needed (from existing migrations 001–040):

### Core: `workspaces`, `users`, `user_roles`, `user_permissions`, `invites`, `sessions`
### Clients: `clients`, `client_approvals`
### SEO: `keywords`, `rank_snapshots`, `competitors`, `audit_runs`, `audit_issues`, `seo_opportunities`, `internal_link_suggestions`, `content_suggestions`
### Content: `seo_briefs`, `seo_articles`, `cms_connections`, `publishing_jobs`, `social_posts`, `video_assets`
### Analytics: `analytics_connections`, `performance_snapshots`, `performance_insights`
### Local SEO: `gbp_connections`, `gbp_profile_snapshots`, `gbp_post_drafts`, `local_seo_insights`
### Creative: `creative_assets`, `brand_profiles`
### Ads: `google_ads_accounts`, `ads_campaigns`, `ads_recommendations`
### Command: `command_priorities`, `command_recommendations`
### Attribution: `lead_capture_events`, `attribution_records` (analytics-only — no CRM tables)
### Reports: `report_templates`, `scheduled_reports`, `report_runs`
### AI Visibility: `ai_visibility_snapshots`, `ai_visibility_queries`
### Content Engine: `content_scores`, `topical_maps`, `bulk_content_jobs`
### Onboarding: `onboarding_sessions`, `setup_templates`, `activation_checklist_items`
### SaaS: `subscription_plans`, `workspace_subscriptions`, `usage_records`

**Removed tables** (CRM/inbox — fully de-scoped):
- ~~`crm_contacts`~~, ~~`crm_deals`~~, ~~`crm_activities`~~, ~~`crm_insights`~~
- ~~`conversations`~~, ~~`messages`~~, ~~`inboxes`~~
- ~~`automation_rules`~~, ~~`canned_responses`~~
- ~~`kb_categories`~~, ~~`kb_articles`~~
- ~~`csat_responses`~~

---

## 8. Demo Mode

- Frontend-only mock data in `src/lib/demo-data.ts`
- Intercepts all failed API calls and returns realistic demo data
- Same schema as live API endpoints
- Auth fallback to demo user (`demo@webby.seo`) when no backend token
- `isDemoMode` flag in AuthContext
- QA checklist at `/qa` for manual testing

---

## 9. Design System

- HSL semantic color tokens in `index.css`
- Dark/light mode via ThemeProvider
- Module accent colors: SEO=emerald, Content=blue, Social=purple, Video=pink, GBP=amber, Analytics=cyan, Ads=orange, Command=indigo
- Framer Motion page transitions and stagger animations
- Full shadcn/ui component library
- Recharts for data visualization

---

## 10. What Is Fully Built (Frontend)

1. ✅ Dashboard with KPIs, charts, quick actions
2. ✅ Command Center with priorities and recommendations
3. ✅ Keyword Research with clustering, page mapping, structure view
4. ✅ Rankings tracking
5. ✅ Technical SEO Audit with issues, rechecks, evidence, internal links
6. ✅ Competitor Benchmark with gap analysis
7. ✅ Opportunities management
8. ✅ Brief Workflow (create → edit → generate draft → review → approve)
9. ✅ Articles management
10. ✅ Content Studio (scoring + rewriter)
11. ✅ Topical Maps
12. ✅ Bulk Content
13. ✅ Content Calendar with drag-and-drop
14. ✅ Social Media management
15. ✅ Video Assets
16. ✅ Creative Assets
17. ✅ Analytics (GA4/GSC performance)
18. ✅ AI Visibility (LLM citation tracking)
19. ✅ Local SEO / GBP management
20. ✅ Google Ads management
21. ✅ Reports with scheduling
22. ✅ Client management
23. ✅ Client Portal (overview, performance, settings)
24. ✅ Operations (job center + activity log)
25. ✅ Workspace Settings (team, branding, billing)
26. ✅ Onboarding wizard
27. ✅ Global client context (persistent selection)
28. ✅ Attribution reporting (analytics-only)
29. ✅ Backlinks, Site Explorer, SERP Checker, Schema Creator
30. ✅ Demo mode with comprehensive mock data

---

## 11. Removed (v6.0)

- CRM module (contacts, deals, activities, pipeline)
- Inbox/conversation module
- Knowledge Base
- Automations (event-driven rules)
- CSAT Dashboard
- All CRM-related sidebar navigation, dashboard widgets, routes
- CRM permissions (`view_crm`, `manage_crm`)

---

## 12. Backend Tasks for Claude

### Priority 1: Core API
- Express server with JWT auth, role-based permissions
- PostgreSQL with migrations
- Client CRUD
- Keyword tracking + rank snapshots

### Priority 2: Audit & Research
- Technical audit engine (mock → DataForSEO provider)
- Competitor benchmark engine
- Keyword research engine with clustering

### Priority 3: Content Pipeline
- Brief generation and management
- Draft generation via AI (OpenAI/Anthropic)
- Article CRUD with status workflow
- Approval workflow
- Publishing to WordPress

### Priority 4: Channels
- Analytics sync (GA4/GSC)
- GBP management
- Google Ads integration
- Social/video generation

### Priority 5: Infrastructure
- Background worker with cron jobs
- Report generation
- Command Center scoring engine
- Attribution engine (analytics-only)

---

## 13. Remaining Frontend Technical Debt

- Stub page files still exist for CRM.tsx, Inbox.tsx, Automations.tsx, KnowledgeBase.tsx, CSATDashboard.tsx (redirect-only)
- Some pages reference `crm` in module badge color maps (harmless, just unused keys)
- Attribution types still reference `deal_name`/`deal_stage` — acceptable for analytics reporting but naming could be refined
- Backend service files in `/backend/src/services/crm/` still exist on disk (backend cleanup for Claude)

---

*Last updated: 2026-03-27*
*Version: v6.1 — Frontend-only, backend-ready*
