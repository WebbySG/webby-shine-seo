-- ═══════════════════════════════════════════════════════
-- 039: Keyword Research + Mapping Workflow
-- ═══════════════════════════════════════════════════════

-- ─── Research Jobs ───
CREATE TABLE IF NOT EXISTS keyword_research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  seed_topics TEXT[] NOT NULL DEFAULT '{}',
  target_count INTEGER NOT NULL DEFAULT 20,
  target_location TEXT DEFAULT 'Singapore',
  target_language TEXT DEFAULT 'en',
  business_priority TEXT DEFAULT 'authority', -- leads, local_seo, authority, content_growth
  provider TEXT NOT NULL DEFAULT 'mock', -- mock, dataforseo, semrush
  status TEXT NOT NULL DEFAULT 'queued', -- queued, running, completed, failed
  total_keywords INTEGER DEFAULT 0,
  clusters_count INTEGER DEFAULT 0,
  pages_mapped INTEGER DEFAULT 0,
  config_json JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Keyword Results (scored) ───
CREATE TABLE IF NOT EXISTS keyword_research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES keyword_research_jobs(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  -- Scoring dimensions (0-100)
  relevance_score NUMERIC(5,2) DEFAULT 0,
  intent_score NUMERIC(5,2) DEFAULT 0,
  volume_score NUMERIC(5,2) DEFAULT 0,
  difficulty_score NUMERIC(5,2) DEFAULT 0,
  serp_score NUMERIC(5,2) DEFAULT 0,
  authority_gap_score NUMERIC(5,2) DEFAULT 0,
  overall_score NUMERIC(5,2) DEFAULT 0,
  -- Raw metrics
  search_volume INTEGER DEFAULT 0,
  keyword_difficulty NUMERIC(5,2) DEFAULT 0,
  cpc NUMERIC(8,2) DEFAULT 0,
  search_intent TEXT, -- informational, commercial, transactional, navigational
  serp_features TEXT[] DEFAULT '{}', -- featured_snippet, people_also_ask, local_pack, etc.
  -- Mapping
  cluster_id UUID,
  recommended_page_type TEXT, -- service_page, location_page, blog_post, comparison_page, faq_page, pillar_page
  existing_url TEXT, -- if site already has a matching page
  mapping_status TEXT DEFAULT 'unmapped', -- unmapped, existing_page, new_page, article
  mapping_notes TEXT,
  -- Brief queue
  brief_queued BOOLEAN DEFAULT FALSE,
  brief_id UUID,
  provider TEXT DEFAULT 'mock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Keyword Clusters ───
CREATE TABLE IF NOT EXISTS keyword_research_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES keyword_research_jobs(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  cluster_name TEXT NOT NULL,
  cluster_theme TEXT,
  primary_keyword TEXT,
  keyword_count INTEGER DEFAULT 0,
  avg_volume INTEGER DEFAULT 0,
  avg_difficulty NUMERIC(5,2) DEFAULT 0,
  recommended_content_type TEXT, -- pillar_page, blog_series, faq_hub, service_section
  priority TEXT DEFAULT 'medium', -- high, medium, low
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Page Mappings ───
CREATE TABLE IF NOT EXISTS keyword_page_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES keyword_research_jobs(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  page_url TEXT,
  page_title TEXT NOT NULL,
  page_type TEXT NOT NULL, -- service_page, location_page, blog_post, comparison_page, faq_page, pillar_page, category_page
  is_existing BOOLEAN DEFAULT FALSE,
  keyword_count INTEGER DEFAULT 0,
  primary_keyword TEXT,
  secondary_keywords TEXT[] DEFAULT '{}',
  recommended_word_count INTEGER DEFAULT 1500,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'suggested', -- suggested, approved, brief_created, published
  brief_id UUID,
  sort_order INTEGER DEFAULT 0,
  parent_mapping_id UUID REFERENCES keyword_page_mappings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kw_research_jobs_client ON keyword_research_jobs(client_id);
CREATE INDEX idx_kw_research_results_job ON keyword_research_results(job_id);
CREATE INDEX idx_kw_research_results_cluster ON keyword_research_results(cluster_id);
CREATE INDEX idx_kw_research_clusters_job ON keyword_research_clusters(job_id);
CREATE INDEX idx_kw_page_mappings_job ON keyword_page_mappings(job_id);

-- Add FK for cluster reference
ALTER TABLE keyword_research_results
  ADD CONSTRAINT fk_kw_result_cluster
  FOREIGN KEY (cluster_id) REFERENCES keyword_research_clusters(id) ON DELETE SET NULL;
