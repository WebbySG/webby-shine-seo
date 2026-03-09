-- publishing_jobs table — unified async job queue for all publishing/rendering tasks
CREATE TABLE publishing_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asset_type      TEXT NOT NULL CHECK (asset_type IN ('article','social_post','video_asset')),
  asset_id        UUID NOT NULL,
  platform        TEXT NOT NULL,
  scheduled_time  TIMESTAMPTZ,
  job_type        TEXT NOT NULL CHECK (job_type IN ('publish','render','schedule')),
  publish_status  TEXT NOT NULL DEFAULT 'queued' CHECK (publish_status IN ('queued','scheduled','processing','published','failed','cancelled')),
  provider        TEXT,
  external_post_id TEXT,
  published_url   TEXT,
  error_message   TEXT,
  retry_count     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_publishing_jobs_client ON publishing_jobs (client_id, publish_status);
CREATE INDEX idx_publishing_jobs_status ON publishing_jobs (publish_status, scheduled_time);
CREATE INDEX idx_publishing_jobs_asset ON publishing_jobs (asset_type, asset_id);
