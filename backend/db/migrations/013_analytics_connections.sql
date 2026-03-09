-- Analytics provider connections (GSC, GA4)
CREATE TABLE analytics_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('gsc','ga4')),
  property_id     TEXT,
  site_url        TEXT,
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','disconnected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, provider)
);
