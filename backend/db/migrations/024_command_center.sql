-- Phase 18: Unified Marketing Command Center
-- Migration: 024_command_center.sql

-- Marketing Goals
CREATE TABLE IF NOT EXISTS marketing_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('traffic', 'leads', 'rankings', 'local_visibility', 'engagement', 'conversions')),
  goal_name TEXT NOT NULL,
  target_value NUMERIC,
  timeframe TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_goals_client ON marketing_goals(client_id);
CREATE INDEX idx_marketing_goals_status ON marketing_goals(status);

-- Marketing Priorities (unified cross-channel priority queue)
CREATE TABLE IF NOT EXISTS marketing_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  priority_type TEXT NOT NULL CHECK (priority_type IN (
    'seo', 'content', 'technical', 'internal_linking', 'social', 'video',
    'gbp', 'paid_ads', 'analytics', 'repurpose', 'refresh', 'landing_page'
  )),
  source_module TEXT NOT NULL CHECK (source_module IN (
    'rank_tracking', 'technical_audit', 'seo_opportunities', 'internal_links',
    'content_plan', 'seo_articles', 'social_posts', 'video_assets',
    'gbp', 'analytics', 'google_ads'
  )),
  source_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  recommended_action TEXT,
  priority_score NUMERIC DEFAULT 0,
  impact_score NUMERIC DEFAULT 0,
  effort_score NUMERIC DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'reviewed', 'done', 'dismissed')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_priorities_client ON marketing_priorities(client_id);
CREATE INDEX idx_marketing_priorities_status ON marketing_priorities(status);
CREATE INDEX idx_marketing_priorities_type ON marketing_priorities(priority_type);
CREATE INDEX idx_marketing_priorities_score ON marketing_priorities(priority_score DESC);

-- Cross-Channel Recommendations
CREATE TABLE IF NOT EXISTS cross_channel_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'repurpose_article_to_social', 'repurpose_article_to_video', 'repurpose_gbp_post_to_social',
    'boost_page_with_ads', 'refresh_article', 'expand_topic_cluster',
    'improve_landing_page', 'promote_winning_content', 'respond_to_reviews', 'create_local_content'
  )),
  source_asset_type TEXT,
  source_asset_id UUID,
  target_channel TEXT CHECK (target_channel IN (
    'website', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube_shorts', 'gbp', 'google_ads'
  )),
  title TEXT NOT NULL,
  description TEXT,
  recommended_action TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'approved', 'done', 'dismissed')),
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cross_channel_rec_client ON cross_channel_recommendations(client_id);
CREATE INDEX idx_cross_channel_rec_status ON cross_channel_recommendations(status);
CREATE INDEX idx_cross_channel_rec_type ON cross_channel_recommendations(recommendation_type);

-- Weekly Action Plans
CREATE TABLE IF NOT EXISTS weekly_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  summary TEXT,
  top_goal TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, week_start)
);

CREATE INDEX idx_weekly_plans_client ON weekly_action_plans(client_id);
CREATE INDEX idx_weekly_plans_week ON weekly_action_plans(week_start);

-- Weekly Action Items
CREATE TABLE IF NOT EXISTS weekly_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES weekly_action_plans(id) ON DELETE CASCADE,
  priority_id UUID REFERENCES marketing_priorities(id) ON DELETE SET NULL,
  channel TEXT,
  task_title TEXT NOT NULL,
  task_description TEXT,
  owner_type TEXT CHECK (owner_type IN ('seo', 'developer', 'designer', 'content', 'ads', 'manager')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'skipped')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_items_plan ON weekly_action_items(plan_id);
CREATE INDEX idx_weekly_items_status ON weekly_action_items(status);
CREATE INDEX idx_weekly_items_owner ON weekly_action_items(owner_type);
