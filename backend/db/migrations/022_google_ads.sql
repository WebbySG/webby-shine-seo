-- Phase 17: Google Ads connections and campaign data
CREATE TABLE IF NOT EXISTS google_ads_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_id TEXT,
  manager_customer_id TEXT,
  account_name TEXT,
  currency_code TEXT DEFAULT 'SGD',
  time_zone TEXT DEFAULT 'Asia/Singapore',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','expired','disconnected','error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gads_conn_client ON google_ads_connections(client_id);

CREATE TABLE IF NOT EXISTS ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  external_campaign_id TEXT,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'search' CHECK (campaign_type IN ('search','performance_max','display')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','active','paused','ended','failed')),
  budget_daily NUMERIC(10,2),
  bidding_strategy TEXT,
  network_settings JSONB DEFAULT '{}',
  location_targets JSONB DEFAULT '["Singapore"]',
  language_targets JSONB DEFAULT '["en"]',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_campaigns_client ON ads_campaigns(client_id);

CREATE TABLE IF NOT EXISTS ads_ad_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES ads_campaigns(id) ON DELETE CASCADE,
  external_ad_group_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_adgroups_campaign ON ads_ad_groups(campaign_id);

CREATE TABLE IF NOT EXISTS ads_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE CASCADE,
  ad_group_id UUID REFERENCES ads_ad_groups(id) ON DELETE CASCADE,
  keyword_text TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'phrase' CHECK (match_type IN ('exact','phrase','broad')),
  final_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  quality_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_kw_adgroup ON ads_keywords(ad_group_id);

CREATE TABLE IF NOT EXISTS ads_ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE CASCADE,
  ad_group_id UUID REFERENCES ads_ad_groups(id) ON DELETE CASCADE,
  headline_1 TEXT, headline_2 TEXT, headline_3 TEXT,
  description_1 TEXT, description_2 TEXT,
  display_path TEXT, final_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads_negative_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE CASCADE,
  keyword_text TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'campaign' CHECK (level IN ('campaign','ad_group')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
