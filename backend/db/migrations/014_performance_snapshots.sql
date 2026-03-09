-- Page performance snapshots
CREATE TABLE page_performance_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  page_url        TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('gsc','ga4','internal')),
  clicks          INT NOT NULL DEFAULT 0,
  impressions     INT NOT NULL DEFAULT 0,
  ctr             NUMERIC(6,4) NOT NULL DEFAULT 0,
  average_position NUMERIC(6,2),
  sessions        INT NOT NULL DEFAULT 0,
  users           INT NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
  snapshot_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_perf_client ON page_performance_snapshots (client_id, snapshot_date);
CREATE INDEX idx_page_perf_url ON page_performance_snapshots (page_url, snapshot_date);

-- Keyword performance snapshots
CREATE TABLE keyword_performance_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword_id      UUID REFERENCES keywords(id) ON DELETE SET NULL,
  page_url        TEXT,
  clicks          INT NOT NULL DEFAULT 0,
  impressions     INT NOT NULL DEFAULT 0,
  ctr             NUMERIC(6,4) NOT NULL DEFAULT 0,
  average_position NUMERIC(6,2),
  current_rank    INT,
  rank_change     INT,
  snapshot_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kw_perf_client ON keyword_performance_snapshots (client_id, snapshot_date);

-- Asset performance snapshots (articles, social posts, videos)
CREATE TABLE asset_performance_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asset_type      TEXT NOT NULL CHECK (asset_type IN ('article','social_post','video_asset')),
  asset_id        UUID NOT NULL,
  platform        TEXT,
  views           INT NOT NULL DEFAULT 0,
  clicks          INT NOT NULL DEFAULT 0,
  engagements     INT NOT NULL DEFAULT 0,
  shares          INT NOT NULL DEFAULT 0,
  comments        INT NOT NULL DEFAULT 0,
  likes           INT NOT NULL DEFAULT 0,
  published_url   TEXT,
  snapshot_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_perf_client ON asset_performance_snapshots (client_id, snapshot_date);
CREATE INDEX idx_asset_perf_asset ON asset_performance_snapshots (asset_type, asset_id, snapshot_date);
