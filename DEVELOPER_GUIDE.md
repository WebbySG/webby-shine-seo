# Webby SEO OS — Developer Implementation Guide

> **Version:** 1.0  
> **Last updated:** 2026-03-31  
> **Audience:** Backend developer implementing the Express/PostgreSQL backend  
> **Companion doc:** `SYSTEM_OVERVIEW.md` (architecture reference)

---

## Table of Contents

1. [What Is This Application?](#1-what-is-this-application)
2. [How the Product Works (User Journey)](#2-how-the-product-works)
3. [Architecture Split: Frontend vs Backend](#3-architecture-split)
4. [API Communication Pattern](#4-api-communication-pattern)
5. [Module-by-Module Implementation Guide](#5-module-by-module-guide)
6. [AI Integration: Token Efficiency Strategy](#6-ai-token-efficiency)
7. [Database → AI → Frontend Data Flow](#7-data-flow)
8. [External API Integration Map](#8-external-apis)
9. [Background Jobs & Workers](#9-background-jobs)
10. [Multi-Tenancy & Authorization](#10-multi-tenancy)
11. [Implementation Priority Order](#11-priority-order)
12. [Common Pitfalls to Avoid](#12-common-pitfalls)

---

## 1. What Is This Application?

**Webby SEO OS** is a multi-tenant digital marketing operating system for agencies. It manages SEO, SEM (Google Ads), and SMM (Social Media) workflows for multiple client websites from a single dashboard.

### Who Uses It

- **Agency operators** managing 5–50+ client websites
- **SEO specialists** running audits, keyword research, content briefs
- **Content teams** writing, reviewing, and publishing articles
- **Account managers** viewing reports and approving content

### What Problem It Solves

Agencies currently use 5–10 separate tools (Ahrefs, SEMrush, GSC, GA4, WordPress, social schedulers, Google Ads, spreadsheets). This platform unifies them into one system where:

1. Data from all sources feeds into a **single decision engine**
2. AI uses **stored historical evidence** (not raw prompting) to recommend what to work on next
3. Every recommendation links back to *why* it was made (audit data, competitor gaps, keyword coverage)
4. The full lifecycle is tracked: Research → Brief → Draft → Approval → Publish → Performance Tracking → Next Decision

### What It Is NOT

- ❌ Not a CRM (no contacts, deals, pipelines)
- ❌ Not a helpdesk (no inbox, conversations, tickets)
- ❌ Not a knowledge base or automation builder
- ❌ Not a chatbot — the mascot characters (Sera, Max, Kai) are UI guides, not conversational AI

---

## 2. How the Product Works (User Journey)

### The Core Workflow Loop

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  1. DISCOVER                                                         │
│     ├── Technical Audit → find site issues                           │
│     ├── Competitor Benchmark → find content gaps                     │
│     └── Keyword Research → find ranking opportunities                │
│                                                                      │
│  2. PLAN                                                             │
│     ├── Opportunities → prioritized list from all evidence           │
│     ├── Page Mapping → which keyword → which page                    │
│     └── Content Plan → what to create/improve                        │
│                                                                      │
│  3. CREATE                                                           │
│     ├── SEO Brief → structured content specification                 │
│     ├── AI Draft → generated from brief + evidence                   │
│     ├── Social Posts → repurposed from article                       │
│     └── Video Script → repurposed from article                       │
│                                                                      │
│  4. APPROVE & PUBLISH                                                │
│     ├── Client Approval → review + feedback workflow                 │
│     ├── WordPress Publish → direct CMS integration                   │
│     ├── Social Publish → scheduled social posts                      │
│     └── GBP Post → Google Business Profile post                      │
│                                                                      │
│  5. MEASURE & LEARN                                                  │
│     ├── Rank Tracking → daily position snapshots                     │
│     ├── Analytics (GA4/GSC) → traffic, clicks, impressions           │
│     ├── Performance Insights → what worked, what didn't              │
│     └── Feed back into step 1 for next cycle                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Concept: The Planning Memory

The system doesn't just execute tasks — it **remembers what happened** so future AI recommendations are smarter. Every action creates a record:

- Audit run → stored issues + evidence
- Keyword research → stored clusters + page mappings
- Opportunity → linked to its evidence sources
- Brief → linked to opportunity + keyword data
- Draft → linked to brief
- Approval → recorded decision + feedback
- Publish → recorded URL + timestamp
- Performance → tracked rankings + traffic post-publish

This chain means the AI can say: *"This keyword cluster was researched 3 weeks ago, a brief was created but the draft was rejected because it lacked depth. Competitor X ranks #2 for this with a 3000-word guide. Recommend creating a more comprehensive draft."*

---

## 3. Architecture Split

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│         FRONTEND (Lovable)       │     │         BACKEND (You Build)      │
│                                  │     │                                  │
│  React 18 + TypeScript + Vite    │     │  Express + PostgreSQL            │
│  Tailwind CSS + shadcn/ui        │     │  JWT Auth + Role-based access    │
│  Recharts + Framer Motion        │     │  AI Provider abstraction         │
│                                  │     │  External API integrations       │
│  ✅ All pages built              │     │  Background job worker           │
│  ✅ All TypeScript contracts     │     │                                  │
│  ✅ Demo data layer              │     │  ⏳ All of this is your job      │
│  ✅ API client functions         │     │                                  │
└──────────────┬───────────────────┘     └──────────────┬───────────────────┘
               │                                        │
               │    HTTP REST (JSON)                     │
               │    Base URL: VITE_API_URL               │
               └────────────────────────────────────────┘
```

### What the Frontend Already Has

| Asset | Location | What It Gives You |
|-------|----------|-------------------|
| **TypeScript interfaces** | `src/lib/api.ts` | Exact response shapes your API must return |
| **API client functions** | `src/lib/api.ts` | Exact endpoints, methods, and request bodies |
| **Demo data** | `src/lib/demo-data.ts` | Example payloads for every endpoint |
| **DB migrations** | `backend/db/migrations/` | Schema starting point (needs CRM cleanup) |
| **Route scaffolds** | `backend/src/routes/` | Express route stubs (need real implementation) |
| **AI provider** | `backend/src/services/ai/provider.ts` | OpenAI/Gemini abstraction layer |

---

## 4. API Communication Pattern

### How Frontend Calls Backend

```typescript
// src/lib/api.ts — the universal API client
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // 1. Attach JWT token from localStorage
  // 2. Call the backend
  // 3. If backend is unreachable → fall back to demo data
  // 4. Return typed response
}
```

**Rules for your backend:**

1. **Base path:** All endpoints are under `/api/...`
2. **Auth:** Every request (except `/api/auth/*`) should include `Authorization: Bearer <jwt>` header
3. **Response format:** Always return JSON matching the TypeScript interfaces in `src/lib/api.ts`
4. **Error format:** `{ "error": "Human-readable message" }` with appropriate HTTP status
5. **Multi-tenant:** Every query must be scoped to the user's workspace/tenant via JWT claims

### How Frontend Handles Missing Backend

When the backend is unreachable, `request()` catches the network error and calls `matchDemoRoute(path, method, body)` which returns mock data. This means:

- The frontend works standalone with demo data
- When your backend responds, demo data is automatically bypassed
- You can test individual endpoints incrementally — the rest still use demo data

---

## 5. Module-by-Module Implementation Guide

### 5.1 Technical Audit

**What it does:** Crawls a client's website, detects SEO issues (missing titles, broken links, slow pages, etc.)

**External API:** DataForSEO On-Page API

**Database tables:** `audit_runs`, `audit_issues`, `audit_pages`, `audit_evidence`, `audit_rechecks`

**Key endpoints:**
```
POST /api/audit/runs          → Start a new audit crawl
GET  /api/audit/runs?client_id=  → List audit runs for a client
GET  /api/audit/runs/:id      → Get run detail with issues
GET  /api/audit/issues?client_id= → Get all issues for a client
PATCH /api/audit/issues/:id   → Update issue status
POST /api/audit/issues/:id/recheck → Re-verify if an issue is fixed
```

**How it feeds AI:** Audit issues become evidence for opportunities. When AI generates a content brief, it should include relevant audit context (e.g., "This page has thin content — 200 words, missing H2 tags, no schema markup").

**Data flow:**
```
DataForSEO crawl → normalize into audit_issues → link as opportunity_evidence → reference in SEO briefs
```

---

### 5.2 Competitor Benchmark

**What it does:** Analyzes competitor websites to find content gaps, technical differences, and ranking opportunities.

**External API:** DataForSEO (competitors discovery, page analysis)

**Database tables:** `competitor_benchmarks`, `benchmark_metrics`, `benchmark_findings`

**Key endpoints:**
```
POST /api/competitor-benchmarks     → Start a benchmark run
GET  /api/competitor-benchmarks/:id → Get benchmark detail
GET  /api/clients/:id/competitor-benchmarks → List benchmarks
```

**How it feeds AI:** Competitor page classifications → content gap recommendations → opportunities. When AI creates a brief, it should cite competitor pages: "Competitor X has a 2500-word guide ranking #3 for this keyword."

---

### 5.3 Keyword Research

**What it does:** Takes seed keywords, clusters them by topic/intent, and maps them to recommended page types and URLs.

**External API:** DataForSEO Keywords Data API

**Database tables:** `keyword_research_jobs`, `keyword_clusters`, `keyword_items`, `page_mappings`

**Key endpoints:**
```
POST /api/keyword-research/start                    → Start research job
GET  /api/keyword-research/jobs/:id                 → Job status + summary
GET  /api/keyword-research/jobs/:id/clusters         → Keyword clusters
GET  /api/keyword-research/jobs/:id/mappings         → Page mapping recommendations
POST /api/keyword-research/jobs/:id/mappings/:mid/create-brief → Create brief from mapping
```

**How it feeds AI:** Page mappings define *what content should exist*. When AI creates a brief, it should pull the keyword cluster data, search intent, and volume metrics. This prevents duplicate briefs for already-mapped keywords.

**Important:** The system uses "service-page-first" clustering — it groups keywords by the type of page they should target (service page, blog post, location page, etc.) rather than just topical similarity.

---

### 5.4 Opportunities

**What it does:** Surfaces prioritized action items from all evidence sources — audit issues, competitor gaps, keyword coverage gaps, ranking drops.

**Database tables:** `seo_opportunities`, `opportunity_evidence`, `opportunity_lifecycle_events`

**Key endpoints:**
```
GET   /api/clients/:id/opportunities      → List with memory (OpportunityWithMemory[])
GET   /api/clients/:id/opportunities/:oid → Single opportunity with full lifecycle
PATCH /api/clients/:id/opportunities/:oid → Update status
```

**Critical:** Each opportunity must include:
- `evidence_records[]` — what data triggered this opportunity
- `lifecycle[]` — what happened to it (brief created? draft rejected? published?)
- `brief_id`, `draft_id`, `article_id` — linked entities if they exist

This is the **hub of the planning memory system**. AI uses this to avoid recommending the same thing twice and to learn from past outcomes.

---

### 5.5 SEO Brief Workflow

**What it does:** Creates structured content specifications from keyword mappings or opportunities, then generates AI drafts from those briefs.

**Database tables:** `seo_briefs`, `seo_brief_drafts`, `draft_review_checks`

**Key endpoints:**
```
POST /api/briefs/generate       → AI-generate a brief from keyword
POST /api/briefs/from-mapping   → Create brief from keyword mapping
POST /api/briefs/:id/generate-draft → AI-generate article draft from brief
GET  /api/briefs/:id/drafts     → List drafts for a brief
```

**How AI generates a brief:** See [Section 6 — Token Efficiency](#6-ai-token-efficiency) for the critical pattern here.

---

### 5.6 Content Publishing

**What it does:** Publishes approved articles to WordPress, schedules social posts, manages GBP posts.

**External APIs:** WordPress REST API (application passwords), social platform APIs

**Database tables:** `publishing_jobs`, `cms_connections`, `social_posts`, `video_assets`

**Key endpoints:**
```
POST /api/publishing/schedule   → Queue a publish job
POST /api/publishing/:id/retry  → Retry a failed job
GET  /api/clients/:id/publishing-jobs → List all jobs
```

---

### 5.7 Analytics & Performance

**What it does:** Syncs data from GA4 and GSC, generates performance insights, tracks ranking changes.

**External APIs:** Google Analytics 4 (OAuth), Google Search Console (OAuth)

**Database tables:** `analytics_connections`, `performance_snapshots`, `performance_insights`, `rank_snapshots`

**Key endpoints:**
```
POST /api/analytics/connect   → OAuth connection
POST /api/analytics/sync      → Pull latest data
GET  /api/clients/:id/performance-summary → Aggregated metrics
GET  /api/clients/:id/performance-insights → AI-generated insights
```

---

### 5.8 Command Center

**What it does:** Unified cross-channel priority dashboard. Aggregates the most important actions across all modules.

**Database tables:** `marketing_priorities`, `cross_channel_recommendations`, `weekly_action_plans`, `weekly_action_items`, `marketing_goals`

**Key endpoints:**
```
GET  /api/clients/:id/command-center  → Summary dashboard data
POST /api/clients/:id/priorities/recompute → Re-score all priorities
POST /api/clients/:id/weekly-action-plan/generate → AI-generate weekly plan
```

**How it works:** The scoring engine pulls data from all modules (audit issues, opportunities, analytics insights, ads recommendations) and ranks them by impact × confidence ÷ effort.

---

### 5.9 Google Ads (SEM)

**What it does:** Syncs Google Ads campaigns, generates AI ad copy, provides budget/bid recommendations.

**External API:** Google Ads API (OAuth)

**Database tables:** `google_ads_accounts`, `ads_campaigns`, `ads_recommendations`, `ads_copy_drafts`, `ads_insights`

---

### 5.10 Local SEO (GBP)

**What it does:** Manages Google Business Profile — posts, reviews, Q&A, local ranking insights.

**External API:** Google Business Profile API (OAuth)

**Database tables:** `gbp_connections`, `gbp_profile_snapshots`, `gbp_post_drafts`, `gbp_reviews`, `gbp_qna`, `local_seo_insights`

---

### 5.11 AI Visibility

**What it does:** Tracks whether the client's brand is mentioned/cited by AI models (ChatGPT, Gemini, Perplexity) when users ask relevant questions.

**External APIs:** OpenAI API, Gemini API (to run test prompts and check responses)

**Database tables:** `ai_vis_prompt_sets`, `ai_vis_prompts`, `ai_vis_runs`, `ai_vis_observations`

---

## 6. AI Integration: Token Efficiency Strategy

### ⚠️ This Is the Most Important Section

AI calls (OpenAI/Gemini) are expensive. Every token in the prompt and response costs money. With potentially hundreds of clients and thousands of briefs, inefficient AI usage will bankrupt the product.

### The Core Principle: Pre-Compute, Don't Prompt-Stuff

**❌ WRONG approach (token-expensive):**
```
System: "You are an SEO expert."
User: "Here is the full audit report (5000 words), 
       here are all competitor pages (3000 words),
       here are all keywords (2000 words),
       here is the full content inventory (4000 words).
       Now generate a brief for 'best coffee grinder singapore'."
```
This burns 14,000+ input tokens per brief. At scale, this is unsustainable.

**✅ CORRECT approach (token-efficient):**
```
System: "You are an SEO brief generator. Generate a structured brief using the provided context."
User: {
  "target_keyword": "best coffee grinder singapore",
  "search_intent": "commercial_investigation",
  "search_volume": 1200,
  "current_position": 18,
  "page_type": "buying_guide",
  "competitor_top_3": [
    {"url": "competitor.com/best-grinders", "word_count": 2800, "position": 2},
    {"url": "rival.com/coffee-grinder-guide", "word_count": 2200, "position": 5}
  ],
  "relevant_audit_issues": [
    "Existing page is 400 words (thin content)",
    "Missing FAQ schema"
  ],
  "related_keywords": ["coffee grinder review sg", "burr grinder singapore"],
  "existing_internal_links": 2,
  "previous_brief_rejected": true,
  "rejection_reason": "Lacked depth and comparison table"
}
```
This is ~500 tokens instead of 14,000. The backend pre-computes the relevant context and sends only what AI needs.

### Token Efficiency Patterns

#### Pattern 1: Summary Layers

Store pre-computed summaries at each level so AI never needs raw data:

```sql
-- Instead of sending 200 audit issues to AI, store a summary
ALTER TABLE audit_runs ADD COLUMN ai_summary TEXT;
-- Example: "Critical: 3 broken canonical tags, 12 missing meta descriptions. 
-- Warning: 45 images without alt text. Thin content on 8 pages (<300 words)."

-- Instead of sending full competitor analysis, store key findings
ALTER TABLE competitor_benchmarks ADD COLUMN ai_summary TEXT;
-- Example: "Competitor ranks for 45 keywords you don't. Top gaps: 
-- 'best X singapore' (vol 2400), 'X vs Y comparison' (vol 1800)."
```

**When to generate summaries:** After every audit run, competitor benchmark, or analytics sync completes, generate an AI summary of the findings. This is a one-time cost that saves tokens on every subsequent brief/recommendation.

#### Pattern 2: Structured Context Objects

Build a standard "AI context packet" for each content generation task:

```typescript
interface AiBriefContext {
  // Target info (~100 tokens)
  target_keyword: string;
  secondary_keywords: string[];       // max 5
  search_intent: string;
  search_volume: number;
  current_position: number | null;
  
  // Competitor context (~150 tokens)  
  competitor_snapshots: {              // max 3
    url: string;
    word_count: number;
    position: number;
    key_sections: string[];            // just headings, not full content
  }[];
  
  // Audit context (~100 tokens)
  relevant_issues: string[];           // max 5, one-line summaries
  
  // History context (~100 tokens)
  previous_brief_exists: boolean;
  previous_rejection_reason: string | null;
  related_published_content: string[]; // max 3 URLs
  
  // Site context (~50 tokens)
  existing_page_url: string | null;
  existing_word_count: number | null;
  internal_links_to_page: number;
}
// Total: ~500 tokens instead of 14,000
```

#### Pattern 3: Tiered AI Calls

Not every AI task needs the same model or context depth:

| Task | Model | Max Input Tokens | Max Output Tokens | Context Needed |
|------|-------|-----------------|-------------------|----------------|
| **Brief generation** | GPT-4o / Gemini Pro | ~800 | ~1500 | Full context packet |
| **Draft generation** | GPT-4o / Gemini Pro | ~2000 | ~4000 | Brief + outline only |
| **Social post from article** | GPT-4o-mini / Gemini Flash | ~500 | ~300 | Article title + summary |
| **Ad copy generation** | GPT-4o-mini / Gemini Flash | ~300 | ~200 | Keyword + landing page |
| **Review response** | GPT-4o-mini / Gemini Flash | ~200 | ~200 | Review text only |
| **Priority scoring** | No AI — use scoring formula | 0 | 0 | Impact × Confidence ÷ Effort |
| **Weekly plan** | GPT-4o-mini / Gemini Flash | ~600 | ~800 | Top 10 priorities summary |

#### Pattern 4: Cache AI Outputs

```sql
-- Store AI generation results so they're never regenerated unnecessarily
CREATE TABLE ai_generation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,        -- e.g., "brief:keyword:best-coffee-grinder:v2"
  input_hash TEXT NOT NULL,       -- hash of the context packet
  output JSONB NOT NULL,
  model TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(client_id, cache_key)
);
```

If the same keyword is researched again and no new evidence has been collected, return the cached brief instead of calling AI again.

#### Pattern 5: Background Pre-Generation

Don't generate AI content on user click. Pre-generate during background jobs:

```
Audit completes → Background job generates:
  1. audit_run.ai_summary (one-time)
  2. New opportunities with pre-computed evidence_text
  3. Updated priority scores (formula, no AI needed)

Analytics sync completes → Background job generates:
  1. Performance insights (template-based, minimal AI)
  2. Updated content_performance_summaries
  3. Declining content alerts (formula-based)
```

This means when a user clicks "Generate Brief," the system already has all the pre-computed context ready. The AI call is small and fast.

#### Pattern 6: Progressive Context Loading

For the Command Center and weekly planning, don't load everything:

```typescript
// Step 1: Load summary counts (no AI, just SQL aggregation)
GET /api/clients/:id/command-center
→ Returns: { totalPriorities: 23, highPriorityCount: 5, quickWinsCount: 8, ... }

// Step 2: Load top priorities (pre-scored, sorted by score)  
GET /api/clients/:id/marketing-priorities?status=open&limit=10
→ Returns: top 10 priorities with pre-computed scores

// Step 3: Only if user clicks "Generate Weekly Plan" → AI call
POST /api/clients/:id/weekly-action-plan/generate
→ Backend sends top 10 priority summaries to AI → generates plan
→ Total AI input: ~600 tokens (just summaries, not raw data)
```

### AI Provider Abstraction

The AI provider layer (`backend/src/services/ai/provider.ts`) already supports:
- **OpenAI** — via standard API
- **Gemini** — via Google AI API
- **Template fallback** — returns empty string, caller uses template logic

Use the factory:
```typescript
import { createAiProvider } from "./services/ai/provider.js";
const ai = createAiProvider(); // reads AI_PROVIDER env var

const result = await ai.complete({
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(contextPacket) }
  ],
  temperature: 0.7,
  maxTokens: 1500,
  jsonMode: true  // forces structured JSON output
});
```

**Always use `jsonMode: true`** for structured outputs (briefs, recommendations, social posts). This ensures parseable responses and reduces wasted tokens on prose formatting.

---

## 7. Database → AI → Frontend Data Flow

### Example: Generating a Brief

```
1. USER clicks "Generate Brief" for keyword "best coffee grinder"
   │
2. BACKEND receives POST /api/briefs/generate { client_id, keyword }
   │
3. BACKEND QUERIES (all parallel SQL, no AI yet):
   │  ├── SELECT current position for this keyword from rank_snapshots
   │  ├── SELECT relevant audit issues for the target URL
   │  ├── SELECT competitor pages ranking for this keyword
   │  ├── SELECT existing briefs/articles for this keyword (avoid duplicates)
   │  ├── SELECT keyword cluster data (volume, intent, related keywords)
   │  └── SELECT previous rejection reasons if any
   │
4. BACKEND BUILDS context packet (~500 tokens)
   │
5. BACKEND CALLS AI with structured prompt + context
   │  ├── System: "Generate an SEO brief as JSON with these fields..."
   │  └── User: { target_keyword, competitors, issues, history... }
   │
6. AI RETURNS structured JSON (~1500 tokens)
   │  ├── title, meta_description, suggested_h1
   │  ├── sections[] with guidance and word_count_target
   │  ├── faq[] with questions and answers
   │  └── evidence[] citing what data drove each recommendation
   │
7. BACKEND STORES the brief in seo_briefs table
   │  ├── Links to opportunity_id if applicable
   │  ├── Creates opportunity_lifecycle_event (brief_created)
   │  └── Stores evidence references
   │
8. BACKEND RETURNS SeoBrief object matching TypeScript interface
   │
9. FRONTEND displays the brief in the Brief Workflow page
```

### Example: Opportunity Detection (Background Job)

```
TRIGGER: Audit run completes OR analytics sync completes OR rank tracking updates

1. BACKGROUND JOB runs opportunity detection
   │
2. SQL QUERIES (no AI needed for detection):
   │  ├── Keywords at positions 4-20 with declining trend → "near_win"
   │  ├── Competitor keywords where we have no page → "content_gap" 
   │  ├── Pages with <500 words where competitor has >2000 → "page_expansion"
   │  ├── Audit issues on high-traffic pages → "technical_fix"
   │  └── Check existing opportunities to avoid duplicates
   │
3. FOR EACH new opportunity:
   │  ├── INSERT into seo_opportunities
   │  ├── INSERT evidence records (what triggered it)
   │  ├── COMPUTE priority score (formula: impact × confidence ÷ effort)
   │  └── INSERT lifecycle event (created)
   │
4. NO AI TOKENS BURNED for opportunity detection
   │  (AI is only used when user acts on an opportunity — e.g., "Generate Brief")
```

### Example: Performance Feedback Loop

```
TRIGGER: Weekly analytics sync

1. For each published article (from published_content_records):
   │  ├── Fetch current position from rank_snapshots
   │  ├── Fetch clicks/impressions from analytics_snapshots
   │  └── Compare to position at publish time
   │
2. COMPUTE performance metrics (SQL, no AI):
   │  ├── position_change = current_position - initial_position
   │  ├── trend = "improving" | "stable" | "declining"
   │  └── clicks_since_publish, impressions_since_publish
   │
3. UPDATE content_performance_summaries
   │
4. GENERATE insights (template-based, minimal AI):
   │  ├── If position improved 10+ spots → "winning_content" insight
   │  ├── If position dropped 5+ spots → "declining_content" insight  
   │  ├── If published 30+ days ago and position > 20 → "refresh_candidate"
   │  └── If high impressions but low CTR → "low_ctr" insight
   │
5. These insights feed back into the Command Center priorities
```

---

## 8. External API Integration Map

| Service | Purpose | Auth Method | Rate Limits | Key Env Vars |
|---------|---------|-------------|-------------|-------------|
| **DataForSEO** | Audit, keywords, SERP, backlinks | API login/password | 2000 req/min | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` |
| **Google Analytics 4** | Traffic, sessions, conversions | OAuth 2.0 | 10 req/sec | `GA4_CLIENT_ID`, `GA4_CLIENT_SECRET` |
| **Google Search Console** | Clicks, impressions, position | OAuth 2.0 | 200 req/min | Same as GA4 (shared Google OAuth) |
| **Google Ads** | Campaigns, performance | OAuth 2.0 | Per-account limits | `GADS_CLIENT_ID`, `GADS_DEVELOPER_TOKEN` |
| **Google Business Profile** | Profile, reviews, posts | OAuth 2.0 | Standard Google limits | Same Google OAuth |
| **OpenAI** | Content generation | API key | TPM/RPM per tier | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| **Gemini** | Content generation (alt) | API key | RPM per tier | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| **WordPress** | Article publishing | Application password | No hard limit | Per-client in `cms_connections` table |

### OAuth Token Management

For Google APIs (GA4, GSC, Ads, GBP), store OAuth tokens per-client in the database:

```sql
-- analytics_connections table handles this
-- Fields: access_token, refresh_token, token_expires_at
-- Backend must auto-refresh expired tokens before API calls
```

---

## 9. Background Jobs & Workers

The worker (`backend/src/worker.ts`) should run these scheduled jobs:

| Job | Frequency | What It Does | AI Tokens? |
|-----|-----------|-------------|------------|
| Rank tracking | Daily | Fetch positions for all active keywords via DataForSEO | None |
| Analytics sync | Daily | Pull GA4/GSC data for all connected clients | None |
| Audit rechecks | Weekly | Re-check previously found issues | None |
| Opportunity detection | After audit/analytics/ranking updates | Surface new opportunities from fresh data | None |
| Performance summaries | Weekly | Compute content performance metrics | None |
| Priority recomputation | After new data arrives | Re-score all open priorities | None |
| Scheduled publishing | Per schedule | Execute queued publish jobs | None |
| AI summary generation | After audit/benchmark completes | Generate `.ai_summary` for completed runs | Minimal (~200 tokens each) |

**Key insight:** Most background jobs use **zero AI tokens**. They're SQL queries and formula computations. AI is only invoked when a user explicitly requests content generation or when generating run summaries.

---

## 10. Multi-Tenancy & Authorization

### Workspace Isolation

```
Workspace (tenant)
  └── Users (with roles: admin, editor, viewer)
       └── Clients (websites being managed)
            └── All data (keywords, audits, briefs, etc.)
```

Every database query must be scoped:

```sql
-- ALWAYS filter by workspace/tenant
SELECT * FROM clients WHERE tenant_id = $1;
SELECT * FROM keywords WHERE client_id IN (SELECT id FROM clients WHERE tenant_id = $1);
```

### JWT Claims

```typescript
interface JwtPayload {
  user_id: string;
  workspace_id: string;    // This is the tenant_id
  role: "admin" | "editor" | "viewer";
  exp: number;
}
```

### Role Permissions

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View dashboards | ✅ | ✅ | ✅ |
| Run audits | ✅ | ✅ | ❌ |
| Generate briefs | ✅ | ✅ | ❌ |
| Approve content | ✅ | ❌ | ❌ |
| Publish content | ✅ | ❌ | ❌ |
| Manage workspace settings | ✅ | ❌ | ❌ |
| Invite users | ✅ | ❌ | ❌ |

---

## 11. Implementation Priority Order

### Phase 1: Foundation (Week 1-2)
1. Express server with JWT auth + role middleware
2. PostgreSQL with clean migrations (remove CRM/inbox/csat tables)
3. Client CRUD with workspace isolation
4. Keyword CRUD + rank snapshot storage
5. Demo data endpoint parity (frontend can toggle off demo mode)

### Phase 2: Evidence Collection (Week 3-4)
1. Technical audit engine (DataForSEO integration)
2. Competitor benchmark engine
3. Keyword research with clustering + page mapping
4. Opportunity detection from evidence (SQL-based, no AI)

### Phase 3: Content Pipeline (Week 5-6)
1. Brief generation (AI with context packets)
2. Draft generation from briefs (AI)
3. Approval workflow
4. WordPress publishing integration
5. Social post generation (AI)

### Phase 4: Analytics & Reporting (Week 7-8)
1. GA4/GSC OAuth + data sync
2. Performance snapshot aggregation
3. Performance insight generation
4. Report generation (HTML/PDF)
5. Command Center scoring engine

### Phase 5: Channels (Week 9-10)
1. Google Ads sync + AI ad copy
2. GBP management
3. Creative asset generation
4. AI Visibility run engine

### Phase 6: Polish (Week 11-12)
1. Background worker (cron jobs)
2. Activity logging + notifications
3. Workspace restore backend (`workspace_state` table)
4. Onboarding flow
5. Scheduled reports

---

## 12. Common Pitfalls to Avoid

### ❌ Don't Send Raw Data to AI
Always pre-compute context packets. Never dump full audit reports or competitor analyses into AI prompts.

### ❌ Don't Call AI for Scoring/Detection
Opportunity detection, priority scoring, and performance categorization should use SQL queries and formulas, not AI. Reserve AI for content generation only.

### ❌ Don't Forget Multi-Tenant Isolation
Every single query must be scoped by `tenant_id`/`workspace_id`. A missing WHERE clause means data leaks between agencies.

### ❌ Don't Skip the Lifecycle Events
Every status change on an opportunity, brief, draft, or article must create a lifecycle record. This is what makes the planning memory work.

### ❌ Don't Build CRM/Inbox Features
These were explicitly removed. The `crm.ts`, `inbox.ts`, `csat.ts`, `automations.ts`, `knowledge-base.ts` routes should be deleted.

### ❌ Don't Break the TypeScript Contracts
The frontend expects exact response shapes from `src/lib/api.ts`. If you change a field name, add a field, or change a type, the frontend will break. Treat these interfaces as your API contract.

### ❌ Don't Use AI Synchronously for Bulk Operations
If a user triggers "recompute all priorities," don't make 50 AI calls in the request handler. Queue it as a background job and return a job ID. The frontend can poll for completion.

### ✅ Do Use `jsonMode: true` for All Structured AI Outputs
This forces the AI to return valid JSON, reducing parsing failures and wasted tokens on prose formatting.

### ✅ Do Store AI Summaries After Every Major Operation
After an audit completes, after a competitor benchmark finishes, after analytics syncs — generate a one-paragraph AI summary and store it. This summary is what gets sent in future prompts instead of raw data.

### ✅ Do Hash Input Context for Caching
Before calling AI, hash the context packet. If the same hash exists in `ai_generation_cache` and isn't expired, return the cached result.

---

## Appendix A: Files to Delete (Backend Cleanup)

```
backend/src/routes/crm.ts
backend/src/routes/inbox.ts
backend/src/routes/csat.ts
backend/src/routes/automations.ts
backend/src/routes/knowledge-base.ts
backend/src/services/crm/           (entire directory)
backend/db/migrations/025_crm_system.sql
backend/db/migrations/037_chatwoot_searchatlas.sql
```

Also remove these imports from `backend/src/index.ts`:
```typescript
// DELETE these lines:
import crmRouter from "./routes/crm.js";
import inboxRouter from "./routes/inbox.js";
import csatRouter from "./routes/csat.js";
import automationsRouter from "./routes/automations.js";
import knowledgeBaseRouter from "./routes/knowledge-base.js";
```

---

## Appendix B: Environment Variables

```env
# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/webby_seo

# Auth
JWT_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=7d

# AI Provider (choose one)
AI_PROVIDER=openai          # or "gemini"
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini    # gpt-4o for premium tasks
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash

# External APIs
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...

# Google OAuth (shared for GA4, GSC, Ads, GBP)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

---

## Appendix C: Quick Reference — Response Shape Rules

Every list endpoint returns an array: `T[]`
Every detail endpoint returns a single object: `T`
Every create/update returns the created/updated object: `T`
Every delete returns: `{ deleted: boolean }`
Every error returns: `{ error: "message" }` with HTTP 4xx/5xx

Status enums are always lowercase strings checked with `CHECK` constraints in PostgreSQL.

Timestamps are always ISO 8601 strings (`TIMESTAMPTZ` in PostgreSQL, serialized as `string` in JSON).

UUIDs are always `string` type (not binary).

---

*This document should be read alongside `SYSTEM_OVERVIEW.md` for the complete architecture reference.*
