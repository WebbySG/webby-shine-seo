-- Phase 20: SaaS Plans, Limits, Subscriptions, Usage

CREATE TYPE plan_type AS ENUM ('internal', 'starter', 'growth', 'pro', 'enterprise');
CREATE TYPE plan_status AS ENUM ('active', 'archived');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'paused', 'expired', 'cancelled');

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_type plan_type NOT NULL,
  monthly_price NUMERIC(10,2) DEFAULT 0,
  annual_price NUMERIC(10,2) DEFAULT 0,
  status plan_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, limit_key)
);

CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspace_subscriptions_ws ON workspace_subscriptions(workspace_id);

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  usage_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_events_ws ON usage_events(workspace_id);
CREATE INDEX idx_usage_events_key ON usage_events(workspace_id, usage_key, created_at);

-- Seed default plans
INSERT INTO subscription_plans (name, plan_type, monthly_price, annual_price) VALUES
  ('Internal', 'internal', 0, 0),
  ('Starter', 'starter', 49, 470),
  ('Growth', 'growth', 99, 950),
  ('Pro', 'pro', 199, 1910),
  ('Enterprise', 'enterprise', 499, 4790);

-- Seed plan limits for Starter
INSERT INTO plan_limits (plan_id, limit_key, limit_value)
SELECT id, key, val FROM subscription_plans, 
  (VALUES ('max_clients', 5), ('max_keywords_per_client', 50), ('max_users', 3), ('max_articles_per_month', 10), ('max_social_posts_per_month', 30), ('max_videos_per_month', 5), ('max_gbp_locations', 1), ('max_ads_accounts', 1), ('max_crm_contacts', 100)) AS t(key, val)
WHERE plan_type = 'starter';

-- Growth
INSERT INTO plan_limits (plan_id, limit_key, limit_value)
SELECT id, key, val FROM subscription_plans,
  (VALUES ('max_clients', 20), ('max_keywords_per_client', 200), ('max_users', 10), ('max_articles_per_month', 50), ('max_social_posts_per_month', 150), ('max_videos_per_month', 20), ('max_gbp_locations', 5), ('max_ads_accounts', 5), ('max_crm_contacts', 1000)) AS t(key, val)
WHERE plan_type = 'growth';

-- Pro
INSERT INTO plan_limits (plan_id, limit_key, limit_value)
SELECT id, key, val FROM subscription_plans,
  (VALUES ('max_clients', 100), ('max_keywords_per_client', 1000), ('max_users', 50), ('max_articles_per_month', 200), ('max_social_posts_per_month', 500), ('max_videos_per_month', 100), ('max_gbp_locations', 25), ('max_ads_accounts', 20), ('max_crm_contacts', 10000)) AS t(key, val)
WHERE plan_type = 'pro';
