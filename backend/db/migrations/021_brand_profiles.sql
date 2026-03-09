-- Phase 16: Brand Profiles
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  font_style TEXT,
  tone TEXT,
  logo_url TEXT,
  image_style_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brand_profiles_client ON brand_profiles(client_id);
