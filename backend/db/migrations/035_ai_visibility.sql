-- AI Visibility Tracking Module

CREATE TABLE IF NOT EXISTS ai_visibility_prompt_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  topic_cluster TEXT,
  intent_type TEXT DEFAULT 'informational',  -- informational, commercial, local, navigational
  status TEXT DEFAULT 'active',              -- active, paused, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_visibility_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_set_id UUID NOT NULL REFERENCES ai_visibility_prompt_sets(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  target_entities TEXT[] DEFAULT '{}',  -- brand/domain/entity names to detect
  competitor_entities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_visibility_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prompt_set_id UUID REFERENCES ai_visibility_prompt_sets(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'manual',  -- manual, openai, gemini, perplexity
  status TEXT DEFAULT 'pending',            -- pending, running, completed, failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  total_prompts INT DEFAULT 0,
  prompts_with_mention INT DEFAULT 0,
  prompts_with_citation INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_visibility_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ai_visibility_runs(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES ai_visibility_prompts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  brand_mentioned BOOLEAN DEFAULT FALSE,
  brand_position INT,               -- 1=first mention, 2=second, etc. NULL if not mentioned
  competitor_mentioned BOOLEAN DEFAULT FALSE,
  competitor_names TEXT[] DEFAULT '{}',
  citation_present BOOLEAN DEFAULT FALSE,
  citation_url TEXT,
  sentiment TEXT,                    -- positive, neutral, negative, mixed
  prominence TEXT,                   -- featured, mentioned, passing, absent
  raw_snippet TEXT,                  -- relevant excerpt (not full output)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_vis_obs_run ON ai_visibility_observations(run_id);
CREATE INDEX idx_ai_vis_runs_client ON ai_visibility_runs(client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_visibility_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, competitor_name)
);
