-- Phase 20: Client Approvals & White-Label Branding

CREATE TYPE approval_asset_type AS ENUM (
  'article', 'social_post', 'video_asset', 'gbp_post', 'ads_copy', 'weekly_plan'
);
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS client_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asset_type approval_asset_type NOT NULL,
  asset_id UUID NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  comment TEXT,
  acted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_approvals_client ON client_approvals(client_id);
CREATE INDEX idx_client_approvals_asset ON client_approvals(asset_type, asset_id);

-- Workspace Branding (white-label)
CREATE TYPE theme_mode AS ENUM ('light', 'dark', 'system');

CREATE TABLE IF NOT EXISTS workspace_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  theme_mode theme_mode DEFAULT 'system',
  custom_domain TEXT,
  support_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspace_branding_ws ON workspace_branding(workspace_id);
