-- cms_connections table — stores WordPress/CMS connection settings per client
CREATE TABLE cms_connections (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cms_type             TEXT NOT NULL DEFAULT 'wordpress' CHECK (cms_type IN ('wordpress')),
  site_url             TEXT NOT NULL,
  username             TEXT NOT NULL,
  application_password TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cms_connections_client ON cms_connections (client_id, cms_type);

-- Add publishing columns to seo_articles
ALTER TABLE seo_articles ADD COLUMN IF NOT EXISTS publish_date TIMESTAMPTZ;
ALTER TABLE seo_articles ADD COLUMN IF NOT EXISTS cms_post_id TEXT;
ALTER TABLE seo_articles ADD COLUMN IF NOT EXISTS cms_post_url TEXT;
