-- Phase 16: Creative Assets
CREATE TABLE IF NOT EXISTS creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('featured_image','social_image','carousel_image','gbp_image','video_thumbnail','infographic')),
  source_type TEXT NOT NULL CHECK (source_type IN ('article','social_post','gbp_post','video_asset')),
  source_id UUID NOT NULL,
  platform TEXT,
  title TEXT,
  prompt TEXT,
  negative_prompt TEXT,
  aspect_ratio TEXT DEFAULT '16:9',
  style_preset TEXT DEFAULT 'clean_modern',
  provider TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','review','approved','published','failed')),
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creative_assets_client ON creative_assets(client_id);
CREATE INDEX idx_creative_assets_source ON creative_assets(source_type, source_id);

CREATE TABLE IF NOT EXISTS creative_asset_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_asset_id UUID NOT NULL REFERENCES creative_assets(id) ON DELETE CASCADE,
  variant_label TEXT,
  prompt TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','review','approved','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_asset ON creative_asset_variants(creative_asset_id);

CREATE TABLE IF NOT EXISTS asset_approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  creative_asset_id UUID NOT NULL REFERENCES creative_assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('generate','approve','reject','regenerate','publish')),
  note TEXT,
  acted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_logs_asset ON asset_approval_logs(creative_asset_id);
