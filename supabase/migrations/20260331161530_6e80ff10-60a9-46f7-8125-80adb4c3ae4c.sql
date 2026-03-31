
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type opportunity_type NOT NULL,
  keyword TEXT,
  target_url TEXT,
  current_position INTEGER,
  recommended_action TEXT NOT NULL,
  priority opportunity_priority DEFAULT 'medium',
  status opportunity_status DEFAULT 'open',
  confidence NUMERIC(3,2) DEFAULT 0.5,
  sources TEXT[] DEFAULT '{}',
  evidence_text TEXT,
  expected_impact TEXT,
  next_action TEXT,
  brief_id UUID,
  draft_id UUID,
  article_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage opportunities via client" ON opportunities FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = opportunities.client_id AND clients.user_id = auth.uid()));
CREATE INDEX idx_opportunities_client ON opportunities(client_id);

CREATE TABLE seo_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  headings JSONB DEFAULT '[]',
  faq JSONB DEFAULT '[]',
  entities TEXT[] DEFAULT '{}',
  internal_links JSONB DEFAULT '[]',
  status brief_status DEFAULT 'draft',
  page_type TEXT,
  secondary_keywords TEXT[] DEFAULT '{}',
  search_intent TEXT,
  target_audience TEXT,
  page_goal TEXT,
  recommended_slug TEXT,
  suggested_h1 TEXT,
  cta_angle TEXT,
  sections JSONB DEFAULT '[]',
  competitor_context TEXT[] DEFAULT '{}',
  audit_context TEXT[] DEFAULT '{}',
  evidence JSONB DEFAULT '[]',
  priority opportunity_priority DEFAULT 'medium',
  source_mapping_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE seo_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage briefs via client" ON seo_briefs FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = seo_briefs.client_id AND clients.user_id = auth.uid()));
CREATE INDEX idx_seo_briefs_client ON seo_briefs(client_id);

CREATE TABLE seo_brief_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES seo_briefs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  content TEXT DEFAULT '',
  meta_description TEXT,
  version INTEGER DEFAULT 1,
  status draft_status DEFAULT 'draft',
  review_checks JSONB DEFAULT '[]',
  internal_link_suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE seo_brief_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage drafts via client" ON seo_brief_drafts FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = seo_brief_drafts.client_id AND clients.user_id = auth.uid()));

CREATE TABLE seo_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES seo_briefs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  content TEXT DEFAULT '',
  status article_status DEFAULT 'draft',
  target_keyword TEXT,
  slug TEXT,
  publish_date TIMESTAMPTZ,
  cms_post_id TEXT,
  cms_post_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE seo_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage articles via client" ON seo_articles FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = seo_articles.client_id AND clients.user_id = auth.uid()));
CREATE INDEX idx_seo_articles_client ON seo_articles(client_id);

CREATE TABLE workspace_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  last_route TEXT,
  selected_client_id UUID,
  module_key TEXT,
  entity_focus JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  ui_state JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workspace_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workspace state" ON workspace_state FOR ALL USING (auth.uid() = user_id);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  summary TEXT,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own activity" ON activity_log FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM clients WHERE clients.id = activity_log.client_id AND clients.user_id = auth.uid()
  ));
CREATE POLICY "Users insert activity" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER seo_briefs_updated_at BEFORE UPDATE ON seo_briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER seo_brief_drafts_updated_at BEFORE UPDATE ON seo_brief_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER seo_articles_updated_at BEFORE UPDATE ON seo_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workspace_state_updated_at BEFORE UPDATE ON workspace_state FOR EACH ROW EXECUTE FUNCTION update_updated_at();
