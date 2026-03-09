-- Phase 15: GBP profile snapshots
CREATE TABLE IF NOT EXISTS gbp_profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  location_id TEXT,
  business_name TEXT,
  primary_category TEXT,
  additional_categories JSONB DEFAULT '[]',
  address TEXT,
  phone TEXT,
  website_url TEXT,
  business_description TEXT,
  opening_hours JSONB,
  services_count INT DEFAULT 0,
  products_count INT DEFAULT 0,
  photos_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  reviews_count INT DEFAULT 0,
  average_rating NUMERIC(2,1) DEFAULT 0,
  qna_count INT DEFAULT 0,
  completeness_score INT DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gbp_snapshots_client ON gbp_profile_snapshots(client_id);
