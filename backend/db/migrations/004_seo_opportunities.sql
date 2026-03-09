-- seo_opportunities table — stores generated recommendations
CREATE TABLE seo_opportunities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword_id        UUID REFERENCES keywords(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('near_win','content_gap','page_expansion','technical_fix')),
  priority          TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  target_url        TEXT,
  current_position  INTEGER,
  recommended_action TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_opportunities_client ON seo_opportunities (client_id, status);
CREATE INDEX idx_opportunities_type   ON seo_opportunities (client_id, type);
