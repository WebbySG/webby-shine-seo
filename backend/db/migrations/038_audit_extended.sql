-- Technical SEO Audit – Extended Schema
-- Adds audit_pages, audit_rechecks, audit_rule_versions, audit_issue_evidence
-- Extends audit_runs and audit_issues with provider/scope fields

-- ============================================================
-- Extend audit_runs
-- ============================================================
ALTER TABLE audit_runs
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'full_crawl'
    CHECK (scope IN ('homepage_only','top_pages','full_crawl')),
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mock'
    CHECK (provider IN ('mock','dataforseo_onpage','pagespeed_insights','gsc_url_inspection','screaming_frog_import')),
  ADD COLUMN IF NOT EXISTS total_issues INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS critical_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warning_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS info_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Extend audit_issues
-- ============================================================
ALTER TABLE audit_issues
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS why_it_matters TEXT,
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS recheck_count INTEGER NOT NULL DEFAULT 0;

-- Update status constraint to include new statuses
ALTER TABLE audit_issues DROP CONSTRAINT IF EXISTS audit_issues_status_check;
ALTER TABLE audit_issues ADD CONSTRAINT audit_issues_status_check
  CHECK (status IN ('open','in_progress','fixed','ignored','regressed'));

-- ============================================================
-- audit_pages – pages discovered during crawl
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id  UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  status_code   INTEGER,
  content_type  TEXT,
  title         TEXT,
  meta_description TEXT,
  word_count    INTEGER,
  load_time_ms  INTEGER,
  issues_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_pages_run ON audit_pages (audit_run_id);

-- ============================================================
-- audit_rechecks – recheck attempts for issues
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_rechecks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_issue_id  UUID NOT NULL REFERENCES audit_issues(id) ON DELETE CASCADE,
  audit_run_id    UUID REFERENCES audit_runs(id) ON DELETE SET NULL,
  provider        TEXT NOT NULL DEFAULT 'mock',
  previous_status TEXT NOT NULL,
  new_status      TEXT NOT NULL,
  previous_evidence JSONB,
  new_evidence    JSONB,
  diff_summary    TEXT,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_rechecks_issue ON audit_rechecks (audit_issue_id, checked_at DESC);

-- ============================================================
-- audit_rule_versions – versioned rule definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_rule_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key        TEXT NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  severity        TEXT NOT NULL CHECK (severity IN ('critical','warning','info')),
  category        TEXT NOT NULL DEFAULT 'general',
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  why_it_matters  TEXT,
  fix_template    TEXT,
  provider        TEXT NOT NULL DEFAULT 'all',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rule_versions_unique ON audit_rule_versions (rule_key, version);

-- ============================================================
-- audit_issue_evidence – structured evidence per issue
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_issue_evidence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_issue_id  UUID NOT NULL REFERENCES audit_issues(id) ON DELETE CASCADE,
  evidence_type   TEXT NOT NULL DEFAULT 'snapshot',
  key             TEXT NOT NULL,
  value           TEXT,
  expected_value  TEXT,
  metadata_json   JSONB,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_issue ON audit_issue_evidence (audit_issue_id);

-- ============================================================
-- Seed audit rule versions
-- ============================================================
INSERT INTO audit_rule_versions (rule_key, version, severity, category, title, description, why_it_matters, fix_template) VALUES
  ('missing_meta_description', 1, 'critical', 'meta', 'Missing Meta Description', 'Page is missing a meta description tag.', 'Meta descriptions directly impact click-through rates in search results. Pages without them get auto-generated snippets that may not be compelling.', 'Add a unique meta description between 120-160 characters that includes the target keyword and a call to action.'),
  ('missing_title', 1, 'critical', 'meta', 'Missing Title Tag', 'Page is missing a title tag.', 'Title tags are the most important on-page SEO element. They appear in search results and browser tabs.', 'Add a unique title tag under 60 characters that includes the primary keyword near the beginning.'),
  ('duplicate_title', 1, 'warning', 'meta', 'Duplicate Title Tag', 'Multiple pages share the same title tag.', 'Duplicate titles confuse search engines about which page to rank and dilute ranking signals.', 'Create unique title tags for each page that reflect its specific content and target keywords.'),
  ('slow_lcp', 1, 'warning', 'performance', 'Slow Largest Contentful Paint', 'LCP exceeds 2.5 seconds.', 'LCP is a Core Web Vital. Google uses it as a ranking factor. Slow LCP increases bounce rates.', 'Optimize the largest element on the page: compress images, use next-gen formats, or preload critical resources.'),
  ('broken_link', 1, 'critical', 'links', 'Broken Internal Link', 'An internal link returns a 404 or error status.', 'Broken links waste crawl budget, create poor user experience, and can prevent important pages from being indexed.', 'Update or remove the broken link. Use 301 redirects if the target page has moved.'),
  ('missing_alt_text', 1, 'info', 'accessibility', 'Images Missing Alt Text', 'Images found without alt attributes.', 'Alt text helps search engines understand image content and is required for accessibility compliance.', 'Add descriptive alt text to all images that describes their content and context.'),
  ('missing_h1', 1, 'warning', 'content', 'Missing H1 Tag', 'Page lacks an H1 heading.', 'H1 tags help search engines understand the main topic of a page and establish content hierarchy.', 'Add a single, descriptive H1 tag that includes the primary keyword.'),
  ('redirect_chain', 1, 'warning', 'links', 'Redirect Chain Detected', 'URL redirects through multiple hops before reaching the final destination.', 'Redirect chains slow down page loading and can cause search engines to drop link equity at each hop.', 'Update all links and redirects to point directly to the final destination URL.'),
  ('missing_canonical', 1, 'warning', 'indexation', 'Missing Canonical Tag', 'Page does not specify a canonical URL.', 'Without canonical tags, search engines may index duplicate versions of the same content.', 'Add a self-referencing canonical tag to the page, or point to the preferred version.'),
  ('mixed_content', 1, 'critical', 'security', 'Mixed Content (HTTP on HTTPS)', 'Page loads insecure HTTP resources on an HTTPS page.', 'Mixed content triggers browser security warnings and can prevent page resources from loading.', 'Update all resource URLs to use HTTPS. Check images, scripts, stylesheets, and iframes.'),
  ('large_page_size', 1, 'info', 'performance', 'Large Page Size', 'Total page weight exceeds 3MB.', 'Large pages load slowly, especially on mobile connections, increasing bounce rate.', 'Compress images, minify CSS/JS, remove unused code, and consider lazy loading below-fold content.'),
  ('no_schema_markup', 1, 'info', 'structured_data', 'No Schema Markup', 'Page lacks structured data markup.', 'Schema markup helps search engines understand content type and can enable rich snippets in search results.', 'Add relevant schema markup (e.g., Article, FAQ, LocalBusiness) using JSON-LD format.')
ON CONFLICT DO NOTHING;
