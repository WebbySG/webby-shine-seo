-- Webby SEO OS – Initial Schema
-- Run against PostgreSQL 15+

-- Multi-tenant support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. clients
-- ============================================================
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL,
  max_keywords  INTEGER NOT NULL DEFAULT 30,
  max_competitors INTEGER NOT NULL DEFAULT 2,
  crawl_limit   INTEGER NOT NULL DEFAULT 500,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','paused','archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_tenant ON clients (tenant_id);
CREATE UNIQUE INDEX idx_clients_domain ON clients (tenant_id, domain);

-- ============================================================
-- 2. keywords
-- ============================================================
CREATE TABLE keywords (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword       TEXT NOT NULL,
  search_engine TEXT NOT NULL DEFAULT 'google',
  locale        TEXT NOT NULL DEFAULT 'en-SG',
  location      TEXT NOT NULL DEFAULT 'Singapore',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_keywords_client ON keywords (client_id);
CREATE UNIQUE INDEX idx_keywords_unique ON keywords (client_id, keyword);

-- ============================================================
-- 3. competitors
-- ============================================================
CREATE TABLE competitors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  domain        TEXT NOT NULL,
  label         TEXT,
  source        TEXT NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','suggested')),
  confirmed     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_competitors_unique ON competitors (client_id, domain);

-- ============================================================
-- 4. rank_snapshots
-- ============================================================
CREATE TABLE rank_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id    UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  domain        TEXT NOT NULL,
  position      INTEGER,
  ranking_url   TEXT,
  delta         INTEGER,
  snapshot_date DATE NOT NULL,
  serp_provider TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_keyword_date ON rank_snapshots (keyword_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_domain_date  ON rank_snapshots (domain, snapshot_date DESC);
CREATE UNIQUE INDEX idx_snapshots_unique ON rank_snapshots (keyword_id, domain, snapshot_date);

-- ============================================================
-- 5. audit_runs
-- ============================================================
CREATE TABLE audit_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pages_crawled INTEGER NOT NULL DEFAULT 0,
  pages_limit   INTEGER NOT NULL DEFAULT 500,
  score         INTEGER CHECK (score >= 0 AND score <= 100),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','running','completed','failed')),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_runs_client ON audit_runs (client_id, created_at DESC);

-- ============================================================
-- 6. audit_issues
-- ============================================================
CREATE TABLE audit_issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id    UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  issue_type      TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('critical','warning','info')),
  affected_url    TEXT NOT NULL,
  description     TEXT NOT NULL,
  fix_instruction TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','done')),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issues_run    ON audit_issues (audit_run_id);
CREATE INDEX idx_issues_status ON audit_issues (audit_run_id, status);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
