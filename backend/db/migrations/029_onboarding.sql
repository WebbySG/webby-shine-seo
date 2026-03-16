-- Phase 21: Onboarding, Templates, Setup Engine, Activation Checklists

-- Onboarding sessions
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  data_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Setup templates
CREATE TABLE IF NOT EXISTS setup_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  niche VARCHAR(200),
  description TEXT,
  template_type VARCHAR(30) NOT NULL DEFAULT 'full_setup' CHECK (template_type IN ('seo','local_seo','content','ads','full_setup')),
  config_json JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Setup runs
CREATE TABLE IF NOT EXISTS setup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES setup_templates(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activation checklists
CREATE TABLE IF NOT EXISTS activation_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  checklist_type VARCHAR(30) NOT NULL DEFAULT 'setup' CHECK (checklist_type IN ('setup','integration','launch')),
  item_key VARCHAR(100) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_onboarding_workspace ON onboarding_sessions(workspace_id);
CREATE INDEX idx_setup_runs_workspace ON setup_runs(workspace_id);
CREATE INDEX idx_activation_workspace ON activation_checklists(workspace_id);
CREATE INDEX idx_activation_client ON activation_checklists(client_id);
CREATE INDEX idx_templates_industry ON setup_templates(industry);
CREATE INDEX idx_templates_status ON setup_templates(status);
