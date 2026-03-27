# Webby SEO OS — Full System Overview

> **Purpose of this document:** Provide a complete understanding of the platform's architecture, features, and current implementation status so that any AI or developer can reason about what exists, what works, and what areas remain to be built.

---

## 1. Product Identity

**Webby SEO OS** is a self-hosted, multi-tenant SEO and digital marketing operating system built for agencies. It manages the full lifecycle of SEO, content, social media, video, local SEO, Google Ads, analytics, CRM, and client reporting — all from a single platform.

- **Architecture:** React + Vite + Tailwind frontend, Express + PostgreSQL backend, background worker
- **Deployment:** Docker Compose (frontend, API, database, worker)
- **Auth:** Self-hosted (JWT sessions, bcrypt passwords, role-based access)
- **Design system:** Premium dark-mode-first UI with HSL semantic tokens, Framer Motion animations, shadcn/ui components

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| Backend | Express.js (TypeScript), PostgreSQL |
| Worker | Node.js background job runner (cron-based) |
| Auth | Self-hosted JWT + bcrypt |
| Containerization | Docker, Docker Compose |
| External APIs | DataForSEO, Google Search Console, Google Analytics 4, Google Business Profile, Google Ads, OpenAI/Anthropic |

---

## 3. Database Schema (37 Migrations)

### Core & Multi-Tenancy
| Table | Purpose |
|-------|---------|
| `workspaces` | Agency/client/partner tenants (slug, type, status, branding) |
| `users` | User accounts with workspace association |
| `user_roles` | Role assignments (owner, admin, manager, seo, content, designer, ads, client_admin, client_user, viewer) |
| `user_permissions` | Granular permission keys per user per workspace |
| `invites` | Team invitation system with token, expiry, status |
| `sessions` | JWT session tracking |

### Clients & Projects
| Table | Purpose |
|-------|---------|
| `clients` | Client records linked to workspaces |
| `client_approvals` | Approval workflow for content/articles/social sent to clients |

### SEO & Keywords
| Table | Purpose |
|-------|---------|
| `keywords` | Tracked keywords per client (volume, difficulty, intent, clusters) |
| `rank_snapshots` | Daily rank position history per keyword |
| `competitors` | Competitor domains per client |
| `audit_runs` | Technical SEO audit executions |
| `audit_issues` | Individual audit findings (critical/warning/info) |
| `seo_opportunities` | AI-generated SEO opportunities |
| `internal_link_suggestions` | Internal linking recommendations |
| `content_suggestions` | Content gap and topic suggestions |

### Content Lifecycle
| Table | Purpose |
|-------|---------|
| `seo_briefs` | Content briefs with target keywords, outline, requirements |
| `seo_articles` | Generated/written articles with status workflow |
| `cms_connections` | CMS integration configs (WordPress, etc.) |
| `publishing_jobs` | Async publishing job queue |

### Social Media
| Table | Purpose |
|-------|---------|
| `social_posts` | Social media post drafts with platform targeting |

### Video
| Table | Purpose |
|-------|---------|
| `video_assets` | AI-generated video scripts and assets |

### Local SEO / GBP
| Table | Purpose |
|-------|---------|
| `gbp_connections` | Google Business Profile connections |
| `gbp_profile_snapshots` | GBP profile data snapshots |
| `gbp_post_drafts` | GBP post drafts |
| `local_seo_insights` | Local SEO analysis and recommendations |

### Analytics
| Table | Purpose |
|-------|---------|
| `analytics_connections` | GA4/GSC connection configs |
| `performance_snapshots` | Page-level performance data (clicks, impressions, CTR, position) |
| `performance_insights` | AI-generated performance insights |

### Creative
| Table | Purpose |
|-------|---------|
| `creative_assets` | AI-generated images, banners, social graphics |
| `brand_profiles` | Brand identity settings (colors, fonts, tone) |

### Google Ads
| Table | Purpose |
|-------|---------|
| `google_ads_accounts` | Google Ads account connections |
| `ads_campaigns` | Campaign tracking |
| `ads_recommendations` | AI-generated ads optimization recommendations |

### Command Center
| Table | Purpose |
|-------|---------|
| `command_priorities` | Weekly/daily priority actions |
| `command_recommendations` | AI-generated strategic recommendations |

### CRM
| Table | Purpose |
|-------|---------|
| `crm_contacts` | CRM contact records |
| `crm_deals` | Sales pipeline deals with stages |
| `crm_activities` | Activity log (calls, emails, meetings, notes) |
| `lead_capture_events` | Inbound lead tracking |
| `attribution_records` | Marketing attribution data |
| `crm_insights` | AI-generated CRM insights |

### Onboarding & Templates
| Table | Purpose |
|-------|---------|
| `onboarding_sessions` | Wizard progress tracking |
| `setup_templates` | Industry template configurations |
| `activation_checklist_items` | Post-setup activation tracking |

### SaaS Packaging
| Table | Purpose |
|-------|---------|
| `subscription_plans` | Plan definitions (starter, growth, agency, enterprise) |
| `workspace_subscriptions` | Active subscriptions per workspace |
| `usage_records` | Feature usage metering |

### Reporting
| Table | Purpose |
|-------|---------|
| `report_templates` | Report layout/section definitions |
| `scheduled_reports` | Recurring report schedules |
| `report_runs` | Generated report instances |

### AI Visibility (Migration 035)
| Table | Purpose |
|-------|---------|
| `ai_visibility_snapshots` | AI citation tracking across LLMs |
| `ai_visibility_queries` | Tracked queries for AI search engines |

### Content Engine (Migration 036)
| Table | Purpose |
|-------|---------|
| `content_scores` | NLP-based content quality scores |
| `topical_maps` | Seed-to-cluster topic strategy maps |
| `bulk_content_jobs` | Batch article generation job queue |

### Omnichannel Support (Migration 037)
| Table | Purpose |
|-------|---------|
| `conversations` | Multi-channel inbox threads |
| `messages` | Individual messages within conversations |
| `inboxes` | Channel configurations (email, chat, social) |
| `automation_rules` | Event-driven workflow automations |
| `canned_responses` | Reusable reply templates |
| `kb_categories` | Knowledge base category hierarchy |
| `kb_articles` | Knowledge base articles |
| `backlinks` | Backlink monitoring records |
| `schema_markups` | Structured data / schema markup templates |
| `content_rewrites` | AI content rewriting history |
| `domain_overviews` | Site explorer domain analysis cache |
| `serp_checks` | SERP position checker results |
| `csat_responses` | Customer satisfaction survey responses |

---

## 4. Backend Services

### `/backend/src/services/`

| Service | Purpose |
|---------|---------|
| `auth/authService.ts` | Registration, login, password reset, JWT management |
| `auth/sessionService.ts` | Session creation, validation, cleanup |
| `auth/permissionService.ts` | Role/permission checks, middleware helpers |
| `auth/inviteService.ts` | Team invitations, acceptance, expiry |
| `billing/usageService.ts` | Usage metering and plan limit enforcement |
| `ai/provider.ts` | AI provider abstraction (OpenAI/Anthropic) |
| `ai/articleGenerator.ts` | SEO article generation from briefs |
| `ai/socialGenerator.ts` | Social media post generation |
| `ai/videoScriptGenerator.ts` | Video script generation |
| `ads/googleAdsService.ts` | Google Ads API integration |
| `ads/adCopyGenerator.ts` | AI ad copy generation |
| `analytics/ga4Service.ts` | Google Analytics 4 data fetching |
| `analytics/gscService.ts` | Google Search Console data fetching |
| `analytics/insightEngine.ts` | AI performance insight generation |
| `command/commandCenterService.ts` | Priority and recommendation management |
| `command/scoringEngine.ts` | Priority scoring algorithm |
| `creative/assetGenerator.ts` | AI image/banner generation |
| `creative/imageProvider.ts` | Image generation API abstraction |
| `creative/promptBuilder.ts` | Creative prompt construction |
| `creative/storageProvider.ts` | Asset storage management |
| `crm/activityService.ts` | CRM activity tracking |
| `crm/attributionService.ts` | Marketing attribution engine |
| `crm/insightService.ts` | CRM AI insights |
| `local/gbpService.ts` | Google Business Profile management |
| `onboarding/onboardingService.ts` | Onboarding wizard logic |
| `onboarding/setupEngine.ts` | Auto-setup from templates |
| `onboarding/templateService.ts` | Template CRUD |
| `publishing/wordpressPublisher.ts` | WordPress CMS publishing |
| `publishing/socialPublisher.ts` | Social media publishing |
| `reports/reportService.ts` | Report generation and scheduling |
| `video/videoRenderer.ts` | Video rendering pipeline |
| `video/ttsProvider.ts` | Text-to-speech for videos |
| `video/subtitleGenerator.ts` | Subtitle generation |
| `dataforseo.ts` | DataForSEO API client |

---

## 5. API Endpoints

### Auth & Users
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user info
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password

### Workspaces
- `POST /api/workspaces` — Create workspace
- `GET /api/workspaces/:id` — Get workspace
- `PUT /api/workspaces/:id` — Update workspace
- `GET /api/workspaces/:id/users` — List workspace members
- `PUT /api/workspaces/:id/users/:userId/role` — Update member role
- `PUT /api/workspaces/:id/users/:userId/permissions` — Update permissions
- `PUT /api/workspaces/:id/users/:userId/status` — Enable/disable member
- `PUT /api/workspaces/:id/branding` — Update white-label branding
- `GET /api/workspaces/:id/usage` — Usage stats
- `GET /api/workspaces/:id/subscription` — Subscription info

### Invites
- `POST /api/workspaces/:id/invites` — Send invite
- `GET /api/workspaces/:id/invites` — List invites
- `POST /api/invites/:token/accept` — Accept invite

### Clients
- `GET /api/clients` — List clients
- `POST /api/clients` — Create client
- `GET /api/clients/:id` — Get client detail
- `PUT /api/clients/:id` — Update client
- `DELETE /api/clients/:id` — Delete client

### Keywords & Rankings
- `GET /api/keywords?client_id=` — List keywords
- `POST /api/keywords` — Add keyword
- `PUT /api/keywords/:id` — Update keyword
- `DELETE /api/keywords/:id` — Delete keyword
- `GET /api/rankings?client_id=` — Rank history

### Competitors
- `GET /api/competitors?client_id=` — List competitors
- `POST /api/competitors` — Add competitor
- `DELETE /api/competitors/:id` — Remove competitor

### Audit
- `GET /api/audit/issues?client_id=` — List audit issues

### Opportunities
- `GET /api/opportunities?client_id=` — List SEO opportunities
- `PUT /api/opportunities/:id` — Update opportunity status

### Internal Links
- `GET /api/internal-links?client_id=` — List suggestions
- `PUT /api/internal-links/:id` — Update suggestion

### Content & Articles
- `GET /api/content-plan?client_id=` — Content suggestions
- `GET /api/briefs?client_id=` — List briefs
- `POST /api/briefs` — Create brief
- `GET /api/articles?client_id=` — List articles
- `POST /api/articles` — Create/generate article
- `PUT /api/articles/:id` — Update article
- `DELETE /api/articles/:id` — Delete article

### Social Media
- `GET /api/social?client_id=` — List social posts
- `POST /api/social` — Create social post
- `PUT /api/social/:id` — Update social post
- `DELETE /api/social/:id` — Delete social post

### Videos
- `GET /api/videos?client_id=` — List videos
- `POST /api/videos` — Create video
- `PUT /api/videos/:id` — Update video

### Publishing
- `POST /api/publishing/publish` — Publish content to CMS
- `GET /api/publishing/jobs?client_id=` — List publishing jobs

### CMS
- `GET /api/cms?client_id=` — List CMS connections
- `POST /api/cms` — Add CMS connection

### Analytics
- `GET /api/analytics/snapshots?client_id=` — Performance snapshots
- `GET /api/analytics/insights?client_id=` — Performance insights
- `GET /api/analytics/connections?client_id=` — Analytics connections
- `POST /api/analytics/connections` — Add analytics connection

### Google Business Profile (GBP)
- `GET /api/gbp/connections?client_id=` — GBP connections
- `POST /api/gbp/connections` — Add GBP connection
- `GET /api/gbp/snapshots?client_id=` — GBP snapshots
- `GET /api/gbp/posts?client_id=` — GBP post drafts
- `POST /api/gbp/posts` — Create GBP post
- `GET /api/gbp/insights?client_id=` — Local SEO insights

### Google Ads
- `GET /api/ads/accounts?client_id=` — Ads accounts
- `GET /api/ads/campaigns?client_id=` — Campaigns
- `GET /api/ads/recommendations?client_id=` — Ads recommendations
- `POST /api/ads/recommendations` — Generate recommendations

### Creative Assets
- `GET /api/creative?client_id=` — List assets
- `POST /api/creative` — Generate asset
- `DELETE /api/creative/:id` — Delete asset

### Command Center
- `GET /api/command/priorities?client_id=` — Priorities
- `POST /api/command/priorities` — Create priority
- `PUT /api/command/priorities/:id` — Update priority
- `GET /api/command/recommendations?client_id=` — Recommendations

### CRM
- `GET /api/crm/contacts?client_id=` — List contacts
- `POST /api/crm/contacts` — Create contact
- `PUT /api/crm/contacts/:id` — Update contact
- `DELETE /api/crm/contacts/:id` — Delete contact
- `GET /api/crm/deals?client_id=` — List deals
- `POST /api/crm/deals` — Create deal
- `PUT /api/crm/deals/:id` — Update deal
- `DELETE /api/crm/deals/:id` — Delete deal
- `GET /api/crm/activities?client_id=` — List activities
- `POST /api/crm/activities` — Log activity
- `DELETE /api/crm/activities/:id` — Delete activity
- `GET /api/crm/insights?client_id=` — CRM insights
- `GET /api/crm/attribution?client_id=` — Attribution overview
- `GET /api/crm/attribution/contacts?client_id=` — Attributed contacts
- `GET /api/crm/attribution/deals?client_id=` — Attributed deals

### Approvals
- `GET /api/clients/:id/approvals` — Client approval items
- `POST /api/approvals/:id/approve` — Approve item
- `POST /api/approvals/:id/reject` — Reject item

### Onboarding & Templates
- `POST /api/onboarding/start` — Start onboarding
- `GET /api/onboarding/:workspaceId` — Get onboarding state
- `PUT /api/onboarding/:workspaceId` — Update onboarding
- `POST /api/onboarding/:workspaceId/complete` — Complete onboarding
- `GET /api/templates` — List setup templates
- `GET /api/templates/:id` — Get template detail
- `POST /api/setup/run` — Run auto-setup
- `GET /api/setup/:workspaceId/status` — Setup status
- `GET /api/clients/:id/activation-checklist` — Activation checklist
- `PUT /api/activation-checklist/:id` — Update checklist item

### Reports
- `GET /api/reports/templates` — Report templates
- `POST /api/reports/generate` — Generate report
- `GET /api/reports?client_id=` — List generated reports
- `GET /api/reports/:id` — Get report
- `POST /api/reports/schedule` — Create schedule
- `GET /api/reports/schedules?client_id=` — List schedules

---

## 6. Frontend Pages & Components

### Global Client Context Architecture
The platform uses a persistent `activeClientId` managed via `ClientContext` (`src/contexts/ClientContext.tsx`) and a `GlobalClientSelector` dropdown in the `AppLayout` header. Selection is stored in `localStorage` and accessed via the `useActiveClient()` hook, so all module data automatically filters to the selected client without per-page re-selection.

### Pages (src/pages/) — 30+ Modules
| Page | Route | Purpose |
|------|-------|---------|
| `Index.tsx` | `/` | Landing/redirect |
| `Login.tsx` | `/login` | Login form |
| `Register.tsx` | `/register` | Registration form |
| `ForgotPassword.tsx` | `/forgot-password` | Password reset request |
| `Dashboard.tsx` | `/dashboard` | Main dashboard with KPIs, charts, activity |
| `Rankings.tsx` | `/rankings` | Keyword tracking and rank history |
| `Audit.tsx` | `/audit` | Technical SEO audit + Internal Links tab |
| `Opportunities.tsx` | `/opportunities` | SEO opportunity management |
| `Analytics.tsx` | `/analytics` | GA4/GSC performance analytics |
| `AiVisibility.tsx` | `/ai-visibility` | AI citation tracking across LLMs |
| `Backlinks.tsx` | `/backlinks` | Backlink monitoring and analysis |
| `SiteExplorer.tsx` | `/site-explorer` | Domain overview and competitive analysis |
| `SerpChecker.tsx` | `/serp-checker` | SERP position checker |
| `TopicalMaps.tsx` | `/topical-maps` | Topic cluster strategy builder |
| `ContentStudio.tsx` | `/content-studio` | Content scoring + AI rewriter (unified) |
| `BulkContent.tsx` | `/bulk-content` | Bulk AI article generation |
| `Articles.tsx` | `/articles` | SEO article management |
| `SocialMedia.tsx` | `/social` | Social post scheduling & publishing |
| `VideoAssets.tsx` | `/videos` | AI video script & rendering |
| `ContentCalendar.tsx` | `/calendar` | Unified calendar with drag-and-drop rescheduling |
| `SchemaCreator.tsx` | `/schema-creator` | JSON-LD structured data generator |
| `LocalSEO.tsx` | `/local-seo` | GBP management and local insights |
| `GoogleAds.tsx` | `/google-ads` | Google Ads campaigns and recommendations |
| `CreativeAssets.tsx` | `/creative` | AI creative asset generation |
| `CommandCenter.tsx` | `/command-center` | Strategic priorities and recommendations |
| `CRM.tsx` | `/crm` | Contacts, deals, activities, attribution |
| `Inbox.tsx` | `/inbox` | Omnichannel conversation inbox |
| `KnowledgeBase.tsx` | `/knowledge-base` | Help center article management |
| `Automations.tsx` | `/automations` | Event-driven workflow rules |
| `CSATDashboard.tsx` | `/csat` | Customer satisfaction analytics |
| `Reports.tsx` | `/reports` | Report builder and scheduled reports |
| `Operations.tsx` | `/operations` | Job center + activity log (unified) |
| `ClientList.tsx` | `/clients` | Client management list |
| `ClientDetail.tsx` | `/clients/:id` | Individual client detail with tabs |
| `OnboardingWizard.tsx` | `/onboarding` | 7-step onboarding wizard |
| `SetupComplete.tsx` | `/setup-complete` | Post-onboarding confirmation |
| `WorkspaceSettings.tsx` | `/settings` | Workspace, branding, team, billing settings |
| `DemoQA.tsx` | `/qa` | Dev-only QA test checklist |
| `NotFound.tsx` | `*` | 404 page |

### Portal Pages (src/pages/portal/)
| Page | Route | Purpose |
|------|-------|---------|
| `PortalOverview.tsx` | `/portal` | Client portal dashboard |
| `PortalPerformance.tsx` | `/portal/performance` | Client-facing performance view |
| `PortalSettings.tsx` | `/portal/settings` | Client portal settings |

### Key Components
| Component | Purpose |
|-----------|---------|
| `AppLayout.tsx` | Main authenticated layout with sidebar + global client selector |
| `AppSidebar.tsx` | Navigation sidebar with 8 module groups |
| `GlobalClientSelector.tsx` | Persistent client dropdown in header |
| `ClientPortalLayout.tsx` | Client portal layout wrapper |
| `ThemeProvider.tsx` | Dark/light theme management |
| `ThemeToggle.tsx` | Theme switch button |
| `ActivationChecklist.tsx` | Post-onboarding activation widget |
| `motion.tsx` | Framer Motion animation primitives (FadeIn, StaggerContainer, SlideIn, ScaleIn, PageTransition) |
| `NavLink.tsx` | Navigation link component |
| `RankChangeIndicator.tsx` | Rank position change display |

### Navigation Groups (AppSidebar)
| Group | Modules |
|-------|---------|
| Core | Dashboard, Command Center |
| SEO | Rankings, Audit, Opportunities, Backlinks, Site Explorer, SERP Checker, AI Visibility |
| Content | Content Studio, Topical Maps, Bulk Content, Articles |
| Publish | Social Media, Videos, Calendar, Schema Creator |
| Channels | Creative Assets, Local SEO, Google Ads |
| Support | Inbox, Knowledge Base, Automations, CSAT |
| Business | CRM, Clients, Reports |
| System | Operations, Settings |

---

## 7. Worker Jobs

The background worker (`backend/src/worker.ts`) runs scheduled jobs:

| Job | Schedule | Purpose |
|-----|----------|---------|
| `rank_check` | Daily 03:00 SGT | Fetch fresh keyword rankings |
| `audit_scan` | Weekly Mon 02:00 SGT | Run technical SEO audits |
| `insight_generation` | Daily 06:00 SGT | Generate AI performance insights |
| `gbp_sync` | Daily 04:00 SGT | Sync Google Business Profile data |
| `analytics_sync` | Daily 05:00 SGT | Pull GA4/GSC performance data |
| `command_recompute` | Daily 07:00 SGT | Recompute command center priorities |
| `crm_insight_refresh` | Daily 08:00 SGT | Refresh CRM insights |
| `crm_attribution_sync` | Every 6 hours | Sync attribution data |
| `invite_expiry_check` | Daily 00:30 SGT | Expire old invitations |
| `usage_rollup` | Daily 01:00 SGT | Roll up usage metrics |
| `approval_reminder` | Daily 09:00 SGT | Send approval reminders |
| `scheduled_reports` | Daily 09:30 SGT | Process scheduled report runs |
| `onboarding_setup_run` | Every 5 min | Process pending setup tasks |
| `activation_recompute` | Daily 10:00 SGT | Recompute activation checklists |

---

## 8. Design System

### Theme
- Dark-mode-first with light mode support
- HSL-based semantic color tokens in `index.css`
- Custom Tailwind config extending shadcn/ui defaults
- Module-specific accent colors (SEO=emerald, Content=blue, Social=purple, Video=pink, GBP=amber, Analytics=cyan, Ads=orange, CRM=rose, Command=indigo)

### Animations
- Framer Motion page transitions on all routes
- Staggered card entrance effects
- Fade, slide, and scale animation primitives
- Smooth hover/press states

### UI Components
- Full shadcn/ui component library (40+ components)
- Recharts for data visualization
- Custom form dialogs for CRUD operations
- Loading skeletons across async pages
- Empty states with CTAs
- Responsive sidebar with mobile sheet

---

## 9. Demo Mode

- Demo seed data creates a complete agency + client environment
- Demo credentials: `demo@webby.seo` / `DemoPass123!`
- `isDemoMode` flag in AuthContext for fallback behavior
- QA checklist page at `/qa` with 48 test items across 17 categories
- Reset demo script: `backend/db/reset-demo.sql`

---

## 10. Templates

### Digital Agency Template (Seeded)
- Industry: Marketing / Agency
- 10 starter keywords (Singapore market)
- 10-page service map
- 6 content clusters
- 4 Google Ads campaign suggestions
- 6-stage CRM pipeline (New Lead → Won/Lost)
- Weekly action plan defaults

---

## 11. What Is Fully Built

1. ✅ Multi-tenant workspace architecture
2. ✅ Self-hosted auth with JWT, roles, permissions
3. ✅ Client management CRUD
4. ✅ Keyword tracking with rank history
5. ✅ Competitor tracking
6. ✅ Technical SEO audit system
7. ✅ SEO opportunity engine
8. ✅ Internal link suggestion system
9. ✅ Content suggestion engine
10. ✅ SEO brief creation
11. ✅ AI article generation pipeline
12. ✅ CMS publishing (WordPress)
13. ✅ Social media post generation
14. ✅ Video asset generation
15. ✅ Google Business Profile management
16. ✅ GA4 + GSC analytics integration
17. ✅ AI performance insights
18. ✅ Google Ads campaign management
19. ✅ AI ad copy generation
20. ✅ Creative asset generation
21. ✅ Command Center with priorities
22. ✅ CRM with contacts, deals, activities
23. ✅ Lead capture and attribution engine
24. ✅ Client approval workflows
25. ✅ Onboarding wizard (7 steps)
26. ✅ Industry template system
27. ✅ Auto-setup engine
28. ✅ Activation checklist
29. ✅ Report builder with scheduling
30. ✅ White-label branding support
31. ✅ SaaS plan/subscription structure
32. ✅ Usage metering
33. ✅ Team invitation system
34. ✅ Client portal (overview, performance, settings)
35. ✅ Demo mode with seed data
36. ✅ Premium dark/light UI with animations
37. ✅ Background worker with 14 scheduled jobs
38. ✅ Docker Compose deployment
39. ✅ Omnichannel inbox (Chatwoot-style conversations)
40. ✅ Knowledge base with categories
41. ✅ Event-driven automation rules
42. ✅ CSAT survey dashboard
43. ✅ Backlink monitoring
44. ✅ Site explorer / domain overview
45. ✅ SERP position checker
46. ✅ Schema markup generator
47. ✅ AI content rewriter
48. ✅ Content scoring engine (NLP-based)
49. ✅ Topical map creator with clustering
50. ✅ Bulk AI content generation
51. ✅ AI visibility tracking (LLM citations)
52. ✅ Content calendar with drag-and-drop rescheduling
53. ✅ Global client context (persistent selection across all modules)
54. ✅ Consolidated Operations page (jobs + activity log)
55. ✅ Consolidated Content Studio (scoring + rewriter)

---

## 12. Known Gaps / Areas to Extend

### Not Yet Built
- **Billing/payments integration** (Stripe checkout, invoice generation)
- **Email delivery system** (transactional emails for invites, reports, alerts)
- **Notification system** (in-app notifications, real-time alerts)
- **Activity/audit log** (user action tracking for compliance)
- **API rate limiting and throttling**
- **Webhook system** (inbound/outbound event hooks)
- **Multi-language / i18n support**
- **Advanced RBAC UI** (permission matrix editor)
- **File/document management** (beyond creative assets)
- **Client communication/messaging** (in-app chat or notes)
- **A/B testing integration**
- **Schema markup / structured data tools**
- **Backlink monitoring**
- **Content calendar view** (visual Kanban/calendar for content pipeline)
- **Competitive analysis dashboard** (beyond basic competitor tracking)
- **Custom dashboard builder** (user-configurable widgets)
- **Integration marketplace** (Zapier, Make, custom integrations)
- **White-label custom domain support**
- **SSO / SAML authentication**
- **Data export / import tools**
- **Mobile native app or PWA**
- **Real-time collaboration** (multi-user editing)
- **AI chat assistant** (conversational SEO advisor)
- **Automated testing suite** (E2E tests beyond demo QA checklist)

### Partially Built (Need Enhancement)
- Dashboard charts use some aggregated data but could pull more live module data
- Analytics charts work but lack date range comparison
- Some pages may still reference `src/data/dummy.ts` for non-critical display data
- PDF export for reports (architecture exists, renderer not yet connected)
- Email scheduling for reports (job exists, email sender not connected)
- Client portal has basic views but limited interactivity

---

## 13. File Structure Summary

```
├── backend/
│   ├── db/migrations/          # 33 SQL migrations
│   ├── src/
│   │   ├── routes/             # 28 route files
│   │   ├── services/           # 14 service directories
│   │   ├── middleware/auth.ts   # JWT auth middleware
│   │   ├── db.ts               # Database pool
│   │   ├── index.ts            # Express server entry
│   │   └── worker.ts           # Background job runner
│   ├── Dockerfile
│   └── package.json
├── src/
│   ├── pages/                  # 23 page components + 3 portal pages
│   ├── components/             # Layout, nav, theme, motion, 40+ UI components
│   ├── contexts/AuthContext.tsx # Auth state management
│   ├── hooks/use-api.ts        # API hooks for all modules
│   ├── lib/api.ts              # API client
│   ├── data/dummy.ts           # Legacy dummy data (being phased out)
│   ├── index.css               # Design system tokens
│   └── App.tsx                 # Router configuration
├── docker-compose.yml
├── tailwind.config.ts
└── vite.config.ts
```

---

## 14. How to Run Locally

```bash
# Start all services
docker compose up -d --build

# Access
# Frontend: http://localhost:5173
# API: http://localhost:3001
# Database: localhost:5432

# Demo login
# Email: demo@webby.seo
# Password: DemoPass123!

# Reset demo data
docker compose exec db psql -U postgres -d webbyseo -f /docker-entrypoint-initdb.d/reset-demo.sql
```

---

*Last updated: 2026-03-25*
*Version: v3.2*
