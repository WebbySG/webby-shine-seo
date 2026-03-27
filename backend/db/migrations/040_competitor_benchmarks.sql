-- Competitor Benchmark Audit System
-- Extends the audit system with competitor-specific benchmarking

-- ============================================================
-- competitor_benchmark_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_benchmark_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  target_domain   TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  scope           TEXT NOT NULL DEFAULT 'full_crawl'
    CHECK (scope IN ('homepage_only','top_pages','full_crawl')),
  provider        TEXT NOT NULL DEFAULT 'mock'
    CHECK (provider IN ('mock','dataforseo_onpage','pagespeed_insights','screaming_frog_import')),
  status          TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','failed')),
  own_audit_run_id UUID REFERENCES audit_runs(id) ON DELETE SET NULL,
  pages_crawled   INTEGER NOT NULL DEFAULT 0,
  indexable_pages INTEGER NOT NULL DEFAULT 0,
  avg_crawl_depth NUMERIC(3,1),
  broken_links    INTEGER NOT NULL DEFAULT 0,
  redirect_issues INTEGER NOT NULL DEFAULT 0,
  duplicate_titles INTEGER NOT NULL DEFAULT 0,
  missing_titles  INTEGER NOT NULL DEFAULT 0,
  missing_meta    INTEGER NOT NULL DEFAULT 0,
  missing_h1      INTEGER NOT NULL DEFAULT 0,
  canonical_issues INTEGER NOT NULL DEFAULT 0,
  avg_load_time_ms INTEGER,
  lcp_avg_ms      INTEGER,
  cls_avg         NUMERIC(4,3),
  fid_avg_ms      INTEGER,
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_bench_client ON competitor_benchmark_runs (client_id, created_at DESC);

-- ============================================================
-- competitor_page_classifications
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_page_classifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_run_id UUID NOT NULL REFERENCES competitor_benchmark_runs(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  page_type       TEXT NOT NULL DEFAULT 'utility'
    CHECK (page_type IN ('homepage','core_service','sub_service','location','blog_article','faq','comparison','contact_conversion','utility')),
  title           TEXT,
  meta_description TEXT,
  h1              TEXT,
  word_count      INTEGER,
  status_code     INTEGER,
  load_time_ms    INTEGER,
  internal_links_count INTEGER DEFAULT 0,
  classification_confidence NUMERIC(3,2) DEFAULT 0.80,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_pages_run ON competitor_page_classifications (benchmark_run_id, page_type);

-- ============================================================
-- competitor_gap_recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_gap_recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_run_id UUID NOT NULL REFERENCES competitor_benchmark_runs(id) ON DELETE CASCADE,
  priority        TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high','medium','low')),
  title           TEXT NOT NULL,
  why_it_matters  TEXT NOT NULL,
  evidence        TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  recommended_page_type TEXT,
  impact_area     TEXT DEFAULT 'service_rankings'
    CHECK (impact_area IN ('service_rankings','local_rankings','content_support','technical')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_gaps_run ON competitor_gap_recommendations (benchmark_run_id, priority);
