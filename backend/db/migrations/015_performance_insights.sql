-- Performance insights / feedback loop recommendations
CREATE TABLE performance_insights (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asset_type          TEXT CHECK (asset_type IN ('article','social_post','video_asset','page','keyword')),
  asset_id            UUID,
  insight_type        TEXT NOT NULL CHECK (insight_type IN ('winning_content','declining_content','low_ctr','refresh_candidate','repurpose_opportunity','content_expansion')),
  priority            TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  recommended_action  TEXT,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','done')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_perf_insights_client ON performance_insights (client_id, status);
CREATE INDEX idx_perf_insights_type ON performance_insights (insight_type, priority);
