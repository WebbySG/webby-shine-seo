-- ═══════════════════════════════════════════════════════
-- 036: Topical Maps, Content Scoring, Bulk Content Generation
-- ═══════════════════════════════════════════════════════

-- ─── Topical Maps ───
CREATE TABLE IF NOT EXISTS topical_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  seed_keyword TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating', -- generating, ready, archived
  cluster_count INTEGER DEFAULT 0,
  article_count INTEGER DEFAULT 0,
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topical_map_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topical_map_id UUID REFERENCES topical_maps(id) ON DELETE CASCADE NOT NULL,
  cluster_name TEXT NOT NULL,
  parent_cluster_id UUID REFERENCES topical_map_clusters(id) ON DELETE SET NULL,
  pillar_keyword TEXT,
  search_intent TEXT, -- informational, transactional, navigational, commercial
  estimated_volume INTEGER,
  difficulty_score NUMERIC(5,2),
  priority TEXT DEFAULT 'medium', -- high, medium, low
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topical_map_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topical_map_id UUID REFERENCES topical_maps(id) ON DELETE CASCADE NOT NULL,
  cluster_id UUID REFERENCES topical_map_clusters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_keyword TEXT NOT NULL,
  content_type TEXT DEFAULT 'blog_post', -- blog_post, pillar_page, comparison, listicle, how_to, faq
  search_intent TEXT,
  estimated_volume INTEGER,
  difficulty_score NUMERIC(5,2),
  word_count_target INTEGER DEFAULT 1500,
  status TEXT DEFAULT 'planned', -- planned, brief_created, in_progress, published
  brief_id UUID,
  article_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topical_maps_client ON topical_maps(client_id);
CREATE INDEX idx_topical_map_clusters_map ON topical_map_clusters(topical_map_id);
CREATE INDEX idx_topical_map_articles_map ON topical_map_articles(topical_map_id);
CREATE INDEX idx_topical_map_articles_cluster ON topical_map_articles(cluster_id);

-- ─── Content Scoring ───
CREATE TABLE IF NOT EXISTS content_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  article_id UUID,
  url TEXT,
  title TEXT NOT NULL,
  target_keyword TEXT NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0, -- 0-100
  word_count INTEGER DEFAULT 0,
  word_count_target INTEGER DEFAULT 1500,
  word_count_score NUMERIC(5,2) DEFAULT 0,
  heading_score NUMERIC(5,2) DEFAULT 0,
  keyword_density NUMERIC(5,4) DEFAULT 0,
  keyword_score NUMERIC(5,2) DEFAULT 0,
  readability_score NUMERIC(5,2) DEFAULT 0,
  focus_terms_found INTEGER DEFAULT 0,
  focus_terms_total INTEGER DEFAULT 0,
  focus_terms_score NUMERIC(5,2) DEFAULT 0,
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  link_score NUMERIC(5,2) DEFAULT 0,
  meta_title_length INTEGER DEFAULT 0,
  meta_desc_length INTEGER DEFAULT 0,
  meta_score NUMERIC(5,2) DEFAULT 0,
  issues_json JSONB DEFAULT '[]',
  suggestions_json JSONB DEFAULT '[]',
  focus_terms_json JSONB DEFAULT '[]',
  competitor_avg_score NUMERIC(5,2),
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_scores_client ON content_scores(client_id);
CREATE INDEX idx_content_scores_article ON content_scores(article_id);

-- ─── Bulk Generation Jobs ───
CREATE TABLE IF NOT EXISTS bulk_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  topical_map_id UUID REFERENCES topical_maps(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, running, completed, failed, cancelled
  total_articles INTEGER DEFAULT 0,
  completed_articles INTEGER DEFAULT 0,
  failed_articles INTEGER DEFAULT 0,
  config_json JSONB DEFAULT '{}', -- word_count_target, tone, auto_publish, etc.
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_generation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES bulk_generation_jobs(id) ON DELETE CASCADE NOT NULL,
  target_keyword TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'pending', -- pending, generating, completed, failed
  brief_id UUID,
  article_id UUID,
  content_score NUMERIC(5,2),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bulk_jobs_client ON bulk_generation_jobs(client_id);
CREATE INDEX idx_bulk_items_job ON bulk_generation_items(job_id);
