-- Phase 19: CRM, Lead Capture, and Attribution Engine
-- Migration: 025_crm_system.sql

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'archived')),
  source_type TEXT CHECK (source_type IN ('seo', 'google_ads', 'gbp', 'facebook', 'instagram', 'linkedin', 'tiktok', 'website_form', 'landing_page')),
  source_id UUID,
  lead_source TEXT CHECK (lead_source IN ('website_form', 'landing_page', 'seo', 'google_ads', 'facebook', 'instagram', 'linkedin', 'tiktok', 'gbp', 'manual', 'referral')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_contacts_client ON crm_contacts(client_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_crm_contacts_phone ON crm_contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_source ON crm_contacts(lead_source);

-- CRM Deals
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  deal_value NUMERIC DEFAULT 0,
  deal_stage TEXT NOT NULL DEFAULT 'lead' CHECK (deal_stage IN ('lead', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost')),
  pipeline_name TEXT DEFAULT 'default',
  expected_close_date DATE,
  won_date DATE,
  lost_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_deals_client ON crm_deals(client_id);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(deal_stage);
CREATE INDEX idx_crm_deals_value ON crm_deals(deal_value DESC);

-- CRM Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'follow_up', 'task', 'note')),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_activities_client ON crm_activities(client_id);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_due ON crm_activities(due_date) WHERE due_date IS NOT NULL;

-- Lead Capture Events
CREATE TABLE IF NOT EXISTS lead_capture_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  source_type TEXT,
  source_id UUID,
  channel TEXT,
  landing_page_url TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  gclid TEXT,
  fbclid TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('form_submit', 'call_click', 'whatsapp_click', 'book_now_click', 'lead_form', 'manual_import')),
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_capture_client ON lead_capture_events(client_id);
CREATE INDEX idx_lead_capture_contact ON lead_capture_events(contact_id);
CREATE INDEX idx_lead_capture_channel ON lead_capture_events(channel);
CREATE INDEX idx_lead_capture_source ON lead_capture_events(source_type);
CREATE INDEX idx_lead_capture_utm ON lead_capture_events(utm_source, utm_medium, utm_campaign);

-- Attribution Records
CREATE TABLE IF NOT EXISTS attribution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  attribution_model TEXT NOT NULL CHECK (attribution_model IN ('first_touch', 'last_touch', 'linear')),
  channel TEXT NOT NULL CHECK (channel IN ('seo', 'google_ads', 'gbp', 'facebook', 'instagram', 'linkedin', 'tiktok', 'direct', 'referral', 'email')),
  source_type TEXT,
  source_id UUID,
  campaign_name TEXT,
  asset_type TEXT,
  asset_id UUID,
  credit NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attribution_client ON attribution_records(client_id);
CREATE INDEX idx_attribution_contact ON attribution_records(contact_id);
CREATE INDEX idx_attribution_deal ON attribution_records(deal_id);
CREATE INDEX idx_attribution_channel ON attribution_records(channel);
CREATE INDEX idx_attribution_model ON attribution_records(attribution_model);

-- CRM Insights
CREATE TABLE IF NOT EXISTS crm_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'high_performing_source', 'low_converting_source', 'content_generating_leads',
    'gbp_generating_leads', 'ads_no_close', 'won_deal_content_source',
    'stale_pipeline', 'follow_up_overdue', 'high_value_opportunity', 'attribution_gap'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  recommended_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_insights_client ON crm_insights(client_id);
CREATE INDEX idx_crm_insights_type ON crm_insights(insight_type);
CREATE INDEX idx_crm_insights_priority ON crm_insights(priority);
CREATE INDEX idx_crm_insights_status ON crm_insights(status);