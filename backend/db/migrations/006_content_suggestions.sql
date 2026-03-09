-- content_suggestions table — stores topical content roadmap data
CREATE TABLE content_suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cluster_name  TEXT NOT NULL,
  keyword       TEXT NOT NULL,
  suggested_slug TEXT,
  reason        TEXT NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','planned','published','dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_suggestions_client ON content_suggestions (client_id, status);
CREATE INDEX idx_content_suggestions_cluster ON content_suggestions (client_id, cluster_name);
