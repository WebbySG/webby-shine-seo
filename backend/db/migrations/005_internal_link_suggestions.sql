-- internal_link_suggestions table — stores link recommendation data
CREATE TABLE internal_link_suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  from_url      TEXT NOT NULL,
  to_url        TEXT NOT NULL,
  anchor_text   TEXT NOT NULL,
  reason        TEXT NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','implemented','dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_internal_links_client ON internal_link_suggestions (client_id, status);
CREATE INDEX idx_internal_links_to_url ON internal_link_suggestions (to_url);
