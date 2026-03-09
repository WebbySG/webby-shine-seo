-- seo_briefs table — stores AI-generated SEO content briefs
CREATE TABLE seo_briefs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword         TEXT NOT NULL,
  title           TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  headings        JSONB NOT NULL DEFAULT '[]',
  faq             JSONB NOT NULL DEFAULT '[]',
  entities        JSONB NOT NULL DEFAULT '[]',
  internal_links  JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_briefs_client ON seo_briefs (client_id, status);
CREATE INDEX idx_seo_briefs_keyword ON seo_briefs (client_id, keyword);
