-- social_posts table — stores social media posts generated from SEO articles
CREATE TABLE social_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  article_id      UUID NOT NULL REFERENCES seo_articles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('facebook','instagram','linkedin','twitter','tiktok')),
  content         TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','scheduled','published')),
  scheduled_time  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_posts_client ON social_posts (client_id, status);
CREATE INDEX idx_social_posts_article ON social_posts (article_id);
