-- seo_articles table — stores AI-generated SEO article drafts
CREATE TABLE seo_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  brief_id        UUID REFERENCES seo_briefs(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),
  target_keyword  TEXT NOT NULL,
  slug            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_articles_client ON seo_articles (client_id, status);
CREATE INDEX idx_seo_articles_brief ON seo_articles (brief_id);
