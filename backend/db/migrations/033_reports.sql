-- Report Builder & Scheduled Client Reporting

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL DEFAULT 'monthly_seo',
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  branding_overrides JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  schedule_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
  day_of_month INT DEFAULT 1,
  recipients JSONB DEFAULT '[]',
  include_branding BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  last_sent_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE SET NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  sections_data JSONB DEFAULT '{}',
  summary TEXT,
  share_token VARCHAR(100) UNIQUE,
  pdf_url TEXT,
  status VARCHAR(20) DEFAULT 'generating',
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_runs_client ON report_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_share ON report_runs(share_token);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next ON scheduled_reports(next_run_at) WHERE status = 'active';

-- Seed default templates
INSERT INTO report_templates (name, template_type, description, sections, is_default) VALUES
(
  'Monthly SEO Report',
  'monthly_seo',
  'Comprehensive monthly SEO performance report including keyword rankings, technical fixes, and content progress.',
  '[
    {"key": "keyword_movement", "title": "Keyword Rankings", "enabled": true, "order": 1},
    {"key": "top_gainers_losers", "title": "Top Gainers & Losers", "enabled": true, "order": 2},
    {"key": "technical_fixes", "title": "Technical Fixes Completed", "enabled": true, "order": 3},
    {"key": "content_published", "title": "Content Published", "enabled": true, "order": 4},
    {"key": "next_priorities", "title": "Next Month Priorities", "enabled": true, "order": 5}
  ]',
  true
),
(
  'Local SEO / GBP Report',
  'local_seo',
  'Local SEO performance report covering Google Business Profile activity, reviews, and local search visibility.',
  '[
    {"key": "keyword_movement", "title": "Local Keyword Rankings", "enabled": true, "order": 1},
    {"key": "gbp_activity", "title": "GBP Activity & Reviews", "enabled": true, "order": 2},
    {"key": "analytics_performance", "title": "Local Traffic Performance", "enabled": true, "order": 3},
    {"key": "content_published", "title": "Content & Posts Published", "enabled": true, "order": 4},
    {"key": "next_priorities", "title": "Next Priorities", "enabled": true, "order": 5}
  ]',
  true
),
(
  'Full Marketing Performance Report',
  'full_marketing',
  'Complete marketing performance report covering SEO, content, GBP, analytics, CRM, and ads.',
  '[
    {"key": "keyword_movement", "title": "Keyword Rankings", "enabled": true, "order": 1},
    {"key": "top_gainers_losers", "title": "Top Gainers & Losers", "enabled": true, "order": 2},
    {"key": "technical_fixes", "title": "Technical Fixes", "enabled": true, "order": 3},
    {"key": "content_published", "title": "Content Published", "enabled": true, "order": 4},
    {"key": "gbp_activity", "title": "GBP Activity", "enabled": true, "order": 5},
    {"key": "analytics_performance", "title": "Analytics Performance", "enabled": true, "order": 6},
    {"key": "leads_crm_summary", "title": "Leads & CRM Summary", "enabled": true, "order": 7},
    {"key": "ads_summary", "title": "Ads Performance", "enabled": true, "order": 8},
    {"key": "next_priorities", "title": "Next Priorities", "enabled": true, "order": 9}
  ]',
  true
)
ON CONFLICT DO NOTHING;
