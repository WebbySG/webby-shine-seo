-- Keyword research jobs
CREATE TABLE public.keyword_research_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  domain TEXT NOT NULL DEFAULT '',
  seed_topics TEXT[] NOT NULL DEFAULT '{}',
  competitor_domains TEXT[] NOT NULL DEFAULT '{}',
  target_count INTEGER NOT NULL DEFAULT 20,
  target_location TEXT NOT NULL DEFAULT 'United States',
  target_language TEXT NOT NULL DEFAULT 'en',
  business_priority TEXT NOT NULL DEFAULT 'leads',
  provider TEXT NOT NULL DEFAULT 'dataforseo',
  status TEXT NOT NULL DEFAULT 'pending',
  total_keywords INTEGER NOT NULL DEFAULT 0,
  clusters_count INTEGER NOT NULL DEFAULT 0,
  pages_mapped INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.keyword_research_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.keyword_research_jobs(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER NOT NULL DEFAULT 0,
  keyword_difficulty NUMERIC NOT NULL DEFAULT 0,
  cpc NUMERIC NOT NULL DEFAULT 0,
  search_intent TEXT NOT NULL DEFAULT 'informational',
  serp_features TEXT[] NOT NULL DEFAULT '{}',
  relevance_score NUMERIC NOT NULL DEFAULT 0,
  intent_score NUMERIC NOT NULL DEFAULT 0,
  volume_score NUMERIC NOT NULL DEFAULT 0,
  difficulty_score NUMERIC NOT NULL DEFAULT 0,
  serp_score NUMERIC NOT NULL DEFAULT 0,
  authority_gap_score NUMERIC NOT NULL DEFAULT 0,
  overall_score NUMERIC NOT NULL DEFAULT 0,
  cluster_id UUID,
  recommended_page_type TEXT NOT NULL DEFAULT 'blog_post',
  existing_url TEXT,
  mapping_status TEXT NOT NULL DEFAULT 'unmapped',
  mapping_notes TEXT,
  brief_queued BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.keyword_research_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.keyword_research_jobs(id) ON DELETE CASCADE,
  cluster_name TEXT NOT NULL,
  cluster_theme TEXT,
  primary_keyword TEXT NOT NULL,
  keyword_count INTEGER NOT NULL DEFAULT 0,
  avg_volume NUMERIC NOT NULL DEFAULT 0,
  avg_difficulty NUMERIC NOT NULL DEFAULT 0,
  recommended_content_type TEXT NOT NULL DEFAULT 'blog_post',
  priority TEXT NOT NULL DEFAULT 'medium',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.keyword_research_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.keyword_research_jobs(id) ON DELETE CASCADE,
  page_url TEXT,
  page_title TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'blog_post',
  is_existing BOOLEAN NOT NULL DEFAULT false,
  keyword_count INTEGER NOT NULL DEFAULT 0,
  primary_keyword TEXT NOT NULL DEFAULT '',
  secondary_keywords TEXT[] NOT NULL DEFAULT '{}',
  recommended_word_count INTEGER NOT NULL DEFAULT 1500,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'unmapped',
  parent_mapping_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.keyword_research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their keyword research jobs"
  ON public.keyword_research_jobs FOR SELECT
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can create keyword research jobs"
  ON public.keyword_research_jobs FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their keyword research jobs"
  ON public.keyword_research_jobs FOR UPDATE
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their keyword research results"
  ON public.keyword_research_results FOR SELECT
  USING (job_id IN (SELECT id FROM public.keyword_research_jobs WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert keyword research results"
  ON public.keyword_research_results FOR INSERT
  WITH CHECK (job_id IN (SELECT id FROM public.keyword_research_jobs WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Users can view their keyword research clusters"
  ON public.keyword_research_clusters FOR SELECT
  USING (job_id IN (SELECT id FROM public.keyword_research_jobs WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert keyword research clusters"
  ON public.keyword_research_clusters FOR INSERT
  WITH CHECK (job_id IN (SELECT id FROM public.keyword_research_jobs WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Users can view their keyword research mappings"
  ON public.keyword_research_mappings FOR SELECT
  USING (job_id IN (SELECT id FROM public.keyword_research_jobs WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert keyword research mappings"
  ON public.keyword_research_mappings FOR INSERT
  WITH CHECK (job_id IN (SELECT id FROM public.keyword_research_jobs WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Users can update keyword research mappings"
  ON public.keyword_research_mappings FOR UPDATE
  USING (job_id IN (SELECT id FROM public.keyword_research_jobs WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));