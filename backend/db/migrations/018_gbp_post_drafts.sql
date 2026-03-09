-- Phase 15: GBP post drafts
CREATE TABLE IF NOT EXISTS gbp_post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  article_id UUID REFERENCES seo_articles(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  cta_type TEXT,
  cta_url TEXT,
  image_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','scheduled','published','failed')),
  scheduled_time TIMESTAMPTZ,
  external_post_id TEXT,
  published_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gbp_posts_client ON gbp_post_drafts(client_id);

-- GBP review items
CREATE TABLE IF NOT EXISTS gbp_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  review_id TEXT,
  reviewer_name TEXT,
  rating INT,
  review_text TEXT,
  review_date TIMESTAMPTZ,
  response_draft TEXT,
  response_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (response_status IN ('unreviewed','drafted','approved','responded','failed')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gbp_reviews_client ON gbp_review_items(client_id);

-- GBP Q&A items
CREATE TABLE IF NOT EXISTS gbp_qna_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  question_id TEXT,
  question_text TEXT NOT NULL,
  answer_draft TEXT,
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed','drafted','approved','responded','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gbp_qna_client ON gbp_qna_items(client_id);
