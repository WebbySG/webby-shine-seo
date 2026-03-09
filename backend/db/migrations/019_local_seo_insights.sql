-- Phase 15: Local SEO insights
CREATE TABLE IF NOT EXISTS local_seo_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('missing_fields','low_review_velocity','posting_opportunity','photo_opportunity','qna_opportunity','category_optimization','review_response_opportunity')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  title TEXT NOT NULL,
  description TEXT,
  recommended_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_local_insights_client ON local_seo_insights(client_id);
