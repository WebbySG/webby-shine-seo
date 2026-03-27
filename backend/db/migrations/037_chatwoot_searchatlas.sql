-- Phase 25: Chatwoot-style Inbox + SearchAtlas-style SEO Tools

-- ============================================================
-- 1. Tags System
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS taggings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  taggable_type TEXT NOT NULL, -- 'conversation', 'contact', 'article'
  taggable_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, taggable_type, taggable_id)
);

-- ============================================================
-- 2. Inboxes
-- ============================================================
CREATE TYPE inbox_channel AS ENUM ('live_chat', 'email', 'whatsapp', 'sms', 'telegram', 'api');
CREATE TYPE inbox_status AS ENUM ('active', 'disabled');

CREATE TABLE IF NOT EXISTS inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel inbox_channel NOT NULL DEFAULT 'live_chat',
  status inbox_status NOT NULL DEFAULT 'active',
  config_json JSONB DEFAULT '{}',
  widget_color TEXT DEFAULT '#2563eb',
  welcome_message TEXT DEFAULT 'Hi! How can we help you?',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Conversations
-- ============================================================
CREATE TYPE conversation_status AS ENUM ('open', 'pending', 'resolved', 'snoozed');

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  inbox_id UUID NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT,
  status conversation_status NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  last_message_at TIMESTAMPTZ,
  messages_count INTEGER DEFAULT 0,
  custom_attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_conversations_inbox ON conversations(inbox_id);
CREATE INDEX idx_conversations_status ON conversations(workspace_id, status);

-- ============================================================
-- 4. Messages
-- ============================================================
CREATE TYPE message_type AS ENUM ('incoming', 'outgoing', 'activity', 'note');

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message_type message_type NOT NULL DEFAULT 'incoming',
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- text, html, template
  attachments JSONB DEFAULT '[]',
  is_private BOOLEAN DEFAULT false, -- internal notes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================================
-- 5. Canned Responses
-- ============================================================
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, short_code)
);

-- ============================================================
-- 6. Automation Rules
-- ============================================================
CREATE TYPE automation_event AS ENUM (
  'conversation_created', 'message_created', 'conversation_status_changed',
  'contact_created', 'conversation_assigned'
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_type automation_event NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]', -- [{attribute, operator, value}]
  actions JSONB NOT NULL DEFAULT '[]',    -- [{type, params}]
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. Knowledge Base
-- ============================================================
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'book',
  position INTEGER DEFAULT 0,
  articles_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_kb_articles_slug ON kb_articles(workspace_id, slug);

-- ============================================================
-- 8. CSAT Surveys
-- ============================================================
CREATE TABLE IF NOT EXISTS csat_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. Backlinks
-- ============================================================
CREATE TABLE IF NOT EXISTS backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT DEFAULT 'dofollow' CHECK (link_type IN ('dofollow','nofollow','ugc','sponsored')),
  domain_authority INTEGER,
  page_authority INTEGER,
  source_domain TEXT,
  first_seen DATE,
  last_seen DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','lost','broken')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backlinks_client ON backlinks(client_id);
CREATE INDEX idx_backlinks_domain ON backlinks(source_domain);

-- ============================================================
-- 10. Schema Markup
-- ============================================================
CREATE TABLE IF NOT EXISTS schema_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  schema_type TEXT NOT NULL, -- 'FAQ', 'LocalBusiness', 'Article', 'Product', 'HowTo', 'BreadcrumbList'
  schema_json JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','validated','deployed')),
  validation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. Content Rewrites
-- ============================================================
CREATE TABLE IF NOT EXISTS content_rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_article_id UUID REFERENCES seo_articles(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  rewritten_text TEXT,
  rewrite_mode TEXT DEFAULT 'improve' CHECK (rewrite_mode IN ('improve','simplify','expand','shorten','paraphrase','tone_shift')),
  target_tone TEXT,
  target_reading_level TEXT,
  original_score INTEGER,
  rewritten_score INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','approved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. Site Explorer / Domain Overview
-- ============================================================
CREATE TABLE IF NOT EXISTS domain_overviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_authority INTEGER,
  page_authority INTEGER,
  organic_keywords INTEGER,
  organic_traffic INTEGER,
  backlinks_total INTEGER,
  referring_domains INTEGER,
  top_keywords JSONB DEFAULT '[]',
  traffic_trend JSONB DEFAULT '[]',
  competitor_overlap JSONB DEFAULT '[]',
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. SERP Checker
-- ============================================================
CREATE TABLE IF NOT EXISTS serp_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  location TEXT DEFAULT 'Singapore',
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop','mobile')),
  results JSONB DEFAULT '[]', -- top 10/20 results
  featured_snippet JSONB,
  people_also_ask JSONB DEFAULT '[]',
  related_searches JSONB DEFAULT '[]',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_serp_checks_client ON serp_checks(client_id);
