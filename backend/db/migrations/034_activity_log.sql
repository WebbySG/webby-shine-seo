-- Activity / Audit Log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,          -- e.g. 'created', 'updated', 'deleted', 'published', 'approved', 'generated'
  entity_type TEXT NOT NULL,     -- e.g. 'article', 'social_post', 'contact', 'deal', 'report', 'keyword'
  entity_id TEXT,
  summary TEXT,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_workspace ON activity_log(workspace_id, created_at DESC);
CREATE INDEX idx_activity_log_client ON activity_log(client_id, created_at DESC);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- In-app Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL,            -- 'info', 'success', 'warning', 'error'
  category TEXT NOT NULL,        -- 'publish', 'report', 'approval', 'sync', 'system'
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(workspace_id, user_id, is_read, created_at DESC);
