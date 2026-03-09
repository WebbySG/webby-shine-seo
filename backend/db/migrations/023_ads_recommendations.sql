-- Phase 17: Ads recommendations, copy drafts, performance, insights
CREATE TABLE IF NOT EXISTS ads_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('campaign','ad_group','keyword','landing_page','budget','negative_keyword')),
  campaign_name TEXT, ad_group_name TEXT, keyword_text TEXT, landing_page_url TEXT,
  recommended_budget NUMERIC(10,2), recommended_action TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','approved','done')),
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_recs_client ON ads_recommendations(client_id);

CREATE TABLE IF NOT EXISTS ads_copy_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE SET NULL,
  ad_group_id UUID REFERENCES ads_ad_groups(id) ON DELETE SET NULL,
  target_keyword TEXT,
  headline_1 TEXT, headline_2 TEXT, headline_3 TEXT,
  description_1 TEXT, description_2 TEXT,
  final_url TEXT, path_1 TEXT, path_2 TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_copy_client ON ads_copy_drafts(client_id);

CREATE TABLE IF NOT EXISTS ads_campaign_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE CASCADE,
  impressions INT DEFAULT 0, clicks INT DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0, avg_cpc NUMERIC(10,2) DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0, conversions NUMERIC(10,2) DEFAULT 0,
  cost_per_conversion NUMERIC(10,2) DEFAULT 0, conversion_rate NUMERIC(5,4) DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads_keyword_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE CASCADE,
  ad_group_id UUID REFERENCES ads_ad_groups(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES ads_keywords(id) ON DELETE CASCADE,
  impressions INT DEFAULT 0, clicks INT DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0, avg_cpc NUMERIC(10,2) DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0, conversions NUMERIC(10,2) DEFAULT 0,
  cost_per_conversion NUMERIC(10,2) DEFAULT 0, quality_score INT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE SET NULL,
  ad_group_id UUID REFERENCES ads_ad_groups(id) ON DELETE SET NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('high_spend_low_conversion','high_ctr_low_conversion','strong_keyword_opportunity','landing_page_mismatch','budget_increase_opportunity','negative_keyword_opportunity','ad_copy_refresh_needed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  title TEXT NOT NULL, description TEXT, recommended_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_insights_client ON ads_insights(client_id);
