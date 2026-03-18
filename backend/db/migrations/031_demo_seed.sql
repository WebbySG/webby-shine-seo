-- Phase 22: Comprehensive Demo Seed Data
-- Run after all schema migrations
-- Demo credentials: demo@webby.seo / DemoPass123!

DO $$
DECLARE
  _tenant UUID := '00000000-0000-0000-0000-000000000001';
  _ws_agency UUID := '00000000-0000-0000-0000-000000000010';
  _ws_client UUID := '00000000-0000-0000-0000-000000000011';
  _demo_user UUID := '00000000-0000-0000-0000-000000000100';
  _client_user UUID := '00000000-0000-0000-0000-000000000101';
  _c1 UUID; _c2 UUID; _c3 UUID;
  _k1 UUID; _k2 UUID; _k3 UUID; _k4 UUID; _k5 UUID; _k6 UUID; _k7 UUID; _k8 UUID;
  _ar1 UUID; _ar2 UUID;
  _brief1 UUID; _brief2 UUID;
  _art1 UUID; _art2 UUID; _art3 UUID; _art4 UUID;
  _sp1 UUID; _sp2 UUID; _sp3 UUID; _sp4 UUID;
  _vid1 UUID; _vid2 UUID;
  _gbp1 UUID;
  _plan1 UUID;
  _contact1 UUID; _contact2 UUID; _contact3 UUID; _contact4 UUID; _contact5 UUID;
  _deal1 UUID; _deal2 UUID; _deal3 UUID;
  _d DATE;
BEGIN
  _d := CURRENT_DATE;

  -- ============================================================
  -- Workspaces
  -- ============================================================
  INSERT INTO workspaces (id, name, slug, workspace_type, status) VALUES
    (_ws_agency, 'Webby Digital Agency', 'webby-agency', 'agency', 'active'),
    (_ws_client, 'Renovo Client Portal', 'renovo-client', 'client', 'active')
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- Users (password: DemoPass123! = bcrypt hash)
  -- ============================================================
  INSERT INTO users (id, workspace_id, first_name, last_name, full_name, email, password_hash, status) VALUES
    (_demo_user, _ws_agency, 'Demo', 'Admin', 'Demo Admin', 'demo@webby.seo',
     '$2b$10$LJ5Y5Rv3tCfKq0PxK1qJXOdRfYqZvXh7Q0yZf8R6kB0h3JYmVz.Hy', 'active'),
    (_client_user, _ws_client, 'Sarah', 'Lim', 'Sarah Lim', 'client@renovo.sg',
     '$2b$10$LJ5Y5Rv3tCfKq0PxK1qJXOdRfYqZvXh7Q0yZf8R6kB0h3JYmVz.Hy', 'active')
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- User Roles & Permissions
  -- ============================================================
  INSERT INTO user_roles (user_id, workspace_id, role) VALUES
    (_demo_user, _ws_agency, 'owner'),
    (_client_user, _ws_client, 'client_admin')
  ON CONFLICT DO NOTHING;

  INSERT INTO user_permissions (user_id, workspace_id, permission_key)
  SELECT _demo_user, _ws_agency, unnest(ARRAY[
    'view_dashboard','manage_clients','manage_articles','approve_articles',
    'publish_articles','manage_social','manage_videos','manage_gbp',
    'manage_ads','view_analytics','view_crm','manage_crm','view_billing',
    'manage_branding','manage_team','manage_settings'
  ]) ON CONFLICT DO NOTHING;

  INSERT INTO user_permissions (user_id, workspace_id, permission_key)
  SELECT _client_user, _ws_client, unnest(ARRAY[
    'view_dashboard','view_analytics','manage_settings'
  ]) ON CONFLICT DO NOTHING;

  -- ============================================================
  -- Clients
  -- ============================================================
  DELETE FROM clients WHERE tenant_id = _tenant;

  INSERT INTO clients (id, tenant_id, name, domain) VALUES
    (gen_random_uuid(), _tenant, 'Renovo Interiors', 'renovo.sg'),
    (gen_random_uuid(), _tenant, 'HomeStyle SG', 'homestyle.sg'),
    (gen_random_uuid(), _tenant, 'Kitchen Pro Asia', 'kitchenpro.asia');

  SELECT id INTO _c1 FROM clients WHERE domain='renovo.sg' AND tenant_id=_tenant;
  SELECT id INTO _c2 FROM clients WHERE domain='homestyle.sg' AND tenant_id=_tenant;
  SELECT id INTO _c3 FROM clients WHERE domain='kitchenpro.asia' AND tenant_id=_tenant;

  -- ============================================================
  -- Keywords (Renovo = 10, HomeStyle = 5, Kitchen = 3)
  -- ============================================================
  INSERT INTO keywords (id, client_id, keyword) VALUES
    (gen_random_uuid(), _c1, 'renovation singapore'),
    (gen_random_uuid(), _c1, 'kitchen renovation singapore'),
    (gen_random_uuid(), _c1, 'hdb renovation contractor'),
    (gen_random_uuid(), _c1, 'bathroom renovation cost singapore'),
    (gen_random_uuid(), _c1, 'home renovation ideas'),
    (gen_random_uuid(), _c1, 'condo renovation singapore'),
    (gen_random_uuid(), _c1, 'interior design singapore'),
    (gen_random_uuid(), _c1, 'renovation permit singapore'),
    (gen_random_uuid(), _c1, 'best renovation company singapore'),
    (gen_random_uuid(), _c1, 'renovation loan singapore');

  INSERT INTO keywords (id, client_id, keyword) VALUES
    (gen_random_uuid(), _c2, 'home decor singapore'),
    (gen_random_uuid(), _c2, 'furniture singapore'),
    (gen_random_uuid(), _c2, 'living room design singapore'),
    (gen_random_uuid(), _c2, 'sofa singapore'),
    (gen_random_uuid(), _c2, 'interior styling tips');

  INSERT INTO keywords (id, client_id, keyword) VALUES
    (gen_random_uuid(), _c3, 'kitchen cabinet singapore'),
    (gen_random_uuid(), _c3, 'kitchen countertop singapore'),
    (gen_random_uuid(), _c3, 'modular kitchen singapore');

  -- Fetch keyword IDs for Renovo
  SELECT id INTO _k1 FROM keywords WHERE keyword='renovation singapore' AND client_id=_c1;
  SELECT id INTO _k2 FROM keywords WHERE keyword='kitchen renovation singapore' AND client_id=_c1;
  SELECT id INTO _k3 FROM keywords WHERE keyword='hdb renovation contractor' AND client_id=_c1;
  SELECT id INTO _k4 FROM keywords WHERE keyword='bathroom renovation cost singapore' AND client_id=_c1;
  SELECT id INTO _k5 FROM keywords WHERE keyword='home renovation ideas' AND client_id=_c1;
  SELECT id INTO _k6 FROM keywords WHERE keyword='condo renovation singapore' AND client_id=_c1;
  SELECT id INTO _k7 FROM keywords WHERE keyword='interior design singapore' AND client_id=_c1;
  SELECT id INTO _k8 FROM keywords WHERE keyword='best renovation company singapore' AND client_id=_c1;

  -- ============================================================
  -- Competitors
  -- ============================================================
  INSERT INTO competitors (client_id, domain, label, confirmed) VALUES
    (_c1, 'renocraft.sg', 'RenoCraft', true),
    (_c1, 'buildmate.com.sg', 'BuildMate', true),
    (_c2, 'hipvan.com', 'HipVan', true),
    (_c2, 'castlery.com', 'Castlery', true),
    (_c3, 'quartz-kitchen.sg', 'Quartz Kitchen', true);

  -- ============================================================
  -- Rank Snapshots (30 days of history for key keywords)
  -- ============================================================
  INSERT INTO rank_snapshots (keyword_id, domain, position, ranking_url, delta, snapshot_date)
  SELECT _k1, 'renovo.sg', 18 - (i * 0.4)::int, 'https://renovo.sg/services', 
    CASE WHEN i > 0 THEN (18 - (i*0.4)::int) - (18 - ((i-1)*0.4)::int) ELSE 0 END,
    _d - (30 - i)
  FROM generate_series(0, 30) AS i
  ON CONFLICT DO NOTHING;

  INSERT INTO rank_snapshots (keyword_id, domain, position, ranking_url, delta, snapshot_date)
  SELECT _k2, 'renovo.sg', 14 - (i * 0.2)::int, 'https://renovo.sg/kitchen',
    CASE WHEN i > 0 THEN -1 ELSE 0 END,
    _d - (30 - i)
  FROM generate_series(0, 30) AS i
  ON CONFLICT DO NOTHING;

  INSERT INTO rank_snapshots (keyword_id, domain, position, ranking_url, delta, snapshot_date)
  SELECT _k3, 'renovo.sg', 8 - (i * 0.15)::int, 'https://renovo.sg/hdb',
    CASE WHEN i > 0 THEN 1 ELSE 0 END,
    _d - (30 - i)
  FROM generate_series(0, 30) AS i
  ON CONFLICT DO NOTHING;

  INSERT INTO rank_snapshots (keyword_id, domain, position, ranking_url, delta, snapshot_date) VALUES
    (_k4, 'renovo.sg', 15, 'https://renovo.sg/bathroom', -1, _d),
    (_k5, 'renovo.sg', 22, 'https://renovo.sg/blog/ideas', 8, _d),
    (_k6, 'renovo.sg', 11, 'https://renovo.sg/condo', 8, _d),
    (_k7, 'renovo.sg', 18, 'https://renovo.sg/interior', 7, _d),
    (_k8, 'renovo.sg', 7, 'https://renovo.sg/', -1, _d)
  ON CONFLICT DO NOTHING;

  -- Competitor rank snapshots
  INSERT INTO rank_snapshots (keyword_id, domain, position, ranking_url, delta, snapshot_date) VALUES
    (_k1, 'renocraft.sg', 8, 'https://renocraft.sg/renovations', 0, _d),
    (_k1, 'buildmate.com.sg', 15, 'https://buildmate.com.sg/', -2, _d),
    (_k2, 'renocraft.sg', 5, 'https://renocraft.sg/kitchen', 1, _d),
    (_k3, 'buildmate.com.sg', 6, 'https://buildmate.com.sg/hdb', 0, _d)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- Audit Runs & Issues
  -- ============================================================
  INSERT INTO audit_runs (id, client_id, pages_crawled, score, status, completed_at)
    VALUES (gen_random_uuid(), _c1, 142, 72, 'completed', now() - interval '2 days');
  SELECT id INTO _ar1 FROM audit_runs WHERE client_id = _c1 ORDER BY created_at DESC LIMIT 1;

  INSERT INTO audit_runs (id, client_id, pages_crawled, score, status, completed_at)
    VALUES (gen_random_uuid(), _c2, 85, 84, 'completed', now() - interval '1 day');
  SELECT id INTO _ar2 FROM audit_runs WHERE client_id = _c2 ORDER BY created_at DESC LIMIT 1;

  INSERT INTO audit_issues (audit_run_id, issue_type, severity, affected_url, description, fix_instruction, status) VALUES
    (_ar1, 'Missing Title', 'critical', 'https://renovo.sg/about', 'Page has no <title> tag', 'Add a unique descriptive title tag under 60 characters.', 'open'),
    (_ar1, 'Missing Meta Description', 'warning', 'https://renovo.sg/services', 'No meta description found', 'Add a compelling meta description under 160 characters.', 'open'),
    (_ar1, 'Multiple H1', 'warning', 'https://renovo.sg/kitchen', 'Page contains 3 H1 tags', 'Consolidate to a single H1.', 'in_progress'),
    (_ar1, 'Broken Internal Link', 'critical', 'https://renovo.sg/blog/tips', 'Link to /old-page returns 404', 'Update or remove the broken link.', 'open'),
    (_ar1, 'Redirect Chain', 'warning', 'https://renovo.sg/promo', '3-hop redirect chain detected', 'Point links directly to final URL.', 'done'),
    (_ar1, 'Missing Canonical', 'info', 'https://renovo.sg/blog/ideas', 'No canonical tag set', 'Add self-referencing canonical.', 'open'),
    (_ar1, 'Thin Content', 'warning', 'https://renovo.sg/faq', 'Page has only 85 words', 'Expand content to at least 300 words.', 'open'),
    (_ar1, 'Missing Alt Text', 'warning', 'https://renovo.sg/gallery', '12 images missing alt text', 'Add descriptive alt attributes.', 'open'),
    (_ar2, 'Slow Page Speed', 'warning', 'https://homestyle.sg/', 'LCP 4.2s — above threshold', 'Optimize hero image and reduce render-blocking resources.', 'open'),
    (_ar2, 'Missing Schema', 'info', 'https://homestyle.sg/products', 'No Product schema found', 'Add JSON-LD Product schema.', 'open');

  -- ============================================================
  -- SEO Briefs
  -- ============================================================
  INSERT INTO seo_briefs (id, client_id, keyword, title, meta_description, headings, faq, entities, internal_links, status) VALUES
    (gen_random_uuid(), _c1, 'renovation singapore', 'Ultimate Guide to Renovation in Singapore 2026',
     'Complete guide to home renovation in Singapore — costs, permits, contractors, and timeline tips.',
     '["What Does Renovation Cost in Singapore?","How to Choose a Renovation Contractor","HDB vs Condo Renovation","Renovation Permits & Rules","Timeline & Planning Tips"]'::jsonb,
     '[{"q":"How much does renovation cost in Singapore?","a":"Typical HDB renovation costs $30,000-$80,000 depending on scope."},{"q":"Do I need a permit?","a":"Yes, HDB renovations require HDB approval."}]'::jsonb,
     '["HDB","BCA","renovation permit","ID firm"]'::jsonb,
     '["https://renovo.sg/services","https://renovo.sg/hdb","https://renovo.sg/kitchen"]'::jsonb,
     'approved'),
    (gen_random_uuid(), _c1, 'kitchen renovation singapore', '10 Kitchen Renovation Ideas for Singapore Homes',
     'Discover the top kitchen renovation ideas for Singapore HDB and condo homes. Budget tips included.',
     '["Modern Kitchen Designs","Kitchen Layout Options","Material Selection Guide","Budget Planning"]'::jsonb,
     '[{"q":"How long does kitchen renovation take?","a":"Typically 4-8 weeks depending on complexity."}]'::jsonb,
     '["quartz countertop","cabinet door","backsplash"]'::jsonb,
     '["https://renovo.sg/kitchen","https://renovo.sg/services"]'::jsonb,
     'draft');

  SELECT id INTO _brief1 FROM seo_briefs WHERE keyword='renovation singapore' AND client_id=_c1;
  SELECT id INTO _brief2 FROM seo_briefs WHERE keyword='kitchen renovation singapore' AND client_id=_c1;

  -- ============================================================
  -- SEO Articles
  -- ============================================================
  INSERT INTO seo_articles (id, client_id, brief_id, title, meta_description, content, status, target_keyword, slug) VALUES
    (gen_random_uuid(), _c1, _brief1, 'Ultimate Guide to Renovation in Singapore 2026',
     'Complete guide to home renovation in Singapore.',
     E'# Ultimate Guide to Renovation in Singapore 2026\n\nPlanning a renovation in Singapore? This comprehensive guide covers everything from costs and permits to choosing the right contractor.\n\n## What Does Renovation Cost?\n\nTypical HDB renovation costs range from $30,000 to $80,000. Condo renovations can run $50,000 to $150,000 depending on scope.\n\n## How to Choose a Contractor\n\nLook for BCA-registered contractors with at least 5 years of experience. Check reviews on platforms like Qanvast and Hometrust.\n\n## Renovation Permits\n\nHDB renovations require approval from HDB. Submit your renovation plan at least 3 weeks before starting work.\n\n## Timeline Tips\n\nA typical 4-room HDB renovation takes 8-12 weeks. Plan for buffer time and set clear milestones with your contractor.',
     'published', 'renovation singapore', 'ultimate-guide-renovation-singapore-2026'),
    (gen_random_uuid(), _c1, _brief2, '10 Kitchen Renovation Ideas for Singapore Homes',
     'Top kitchen renovation ideas for Singapore HDB and condo homes.',
     E'# 10 Kitchen Renovation Ideas for Singapore Homes\n\nTransform your kitchen with these trending renovation ideas tailored for Singapore homes.\n\n## 1. Open Concept Kitchen\n\nKnock down the wall between kitchen and living room for a spacious feel.\n\n## 2. Quartz Countertops\n\nDurable and low-maintenance — perfect for Singapore humidity.\n\n## 3. Smart Storage Solutions\n\nMaximize every inch with pull-out drawers and corner carousels.',
     'approved', 'kitchen renovation singapore', '10-kitchen-renovation-ideas-singapore'),
    (gen_random_uuid(), _c1, NULL, 'HDB Renovation Rules You Need to Know',
     'Essential HDB renovation rules and regulations for homeowners.',
     E'# HDB Renovation Rules You Need to Know\n\nBefore starting your HDB renovation, understand these important rules and regulations.\n\n## Approved Working Hours\n\nRenovation works are only allowed Monday to Saturday, 9am to 6pm.\n\n## Permit Requirements\n\nAll renovation works require written approval from HDB.',
     'review', 'hdb renovation rules', 'hdb-renovation-rules'),
    (gen_random_uuid(), _c1, NULL, 'Bathroom Renovation Cost Breakdown Singapore',
     'Detailed cost breakdown for bathroom renovation in Singapore.',
     E'# Bathroom Renovation Cost Breakdown\n\nA typical bathroom renovation in Singapore costs $5,000 to $15,000.',
     'draft', 'bathroom renovation cost singapore', 'bathroom-renovation-cost-breakdown');

  SELECT id INTO _art1 FROM seo_articles WHERE slug='ultimate-guide-renovation-singapore-2026';
  SELECT id INTO _art2 FROM seo_articles WHERE slug='10-kitchen-renovation-ideas-singapore';
  SELECT id INTO _art3 FROM seo_articles WHERE slug='hdb-renovation-rules';
  SELECT id INTO _art4 FROM seo_articles WHERE slug='bathroom-renovation-cost-breakdown';

  -- ============================================================
  -- Social Posts
  -- ============================================================
  INSERT INTO social_posts (id, client_id, article_id, platform, content, status, scheduled_time) VALUES
    (gen_random_uuid(), _c1, _art1, 'facebook',
     '🏠 Planning a renovation in Singapore? Our ultimate guide covers costs, permits, and contractor tips. Read now → renovo.sg/blog #SingaporeRenovation #HomeImprovement',
     'published', now() - interval '5 days'),
    (gen_random_uuid(), _c1, _art1, 'instagram',
     '✨ Dream home loading... 🏗️ Check out our ultimate renovation guide for Singapore homeowners! Link in bio. #RenovationSG #InteriorDesign #HDBRenovation',
     'approved', now() + interval '2 days'),
    (gen_random_uuid(), _c1, _art2, 'linkedin',
     'Looking to renovate your kitchen? Here are 10 trending ideas for Singapore homes in 2026. From open concepts to smart storage solutions. #KitchenDesign #Singapore',
     'scheduled', now() + interval '3 days'),
    (gen_random_uuid(), _c1, _art1, 'tiktok',
     '🎬 POV: You just found out renovation in SG costs HOW MUCH? 💸 Watch our breakdown #RenovationSingapore #HDBLife #SGHome',
     'draft', NULL);

  SELECT id INTO _sp1 FROM social_posts WHERE platform='facebook' AND client_id=_c1 LIMIT 1;
  SELECT id INTO _sp2 FROM social_posts WHERE platform='instagram' AND client_id=_c1 LIMIT 1;

  -- ============================================================
  -- Video Assets
  -- ============================================================
  INSERT INTO video_assets (id, client_id, article_id, social_post_id, platform, video_script, scene_breakdown, caption_text, status) VALUES
    (gen_random_uuid(), _c1, _art1, NULL, 'tiktok',
     'Scene 1: Hook — "Planning a renovation in Singapore? Here''s what you NEED to know..." Scene 2: Cost breakdown with graphics. Scene 3: Permit tips. Scene 4: CTA.',
     '[{"scene":1,"text":"Hook question","duration":3},{"scene":2,"text":"Cost breakdown","duration":8},{"scene":3,"text":"Permit tips","duration":6},{"scene":4,"text":"CTA","duration":3}]'::jsonb,
     '🏠 Singapore renovation guide in 60 seconds! #RenovationSG',
     'review'),
    (gen_random_uuid(), _c1, _art2, NULL, 'youtube_shorts',
     'Scene 1: "10 kitchen ideas that will blow your mind" Scene 2: Open concept reveal. Scene 3: Smart storage hacks. Scene 4: Before/after.',
     '[{"scene":1,"text":"Opening hook","duration":3},{"scene":2,"text":"Open concept","duration":7},{"scene":3,"text":"Storage hacks","duration":7},{"scene":4,"text":"Before/after + CTA","duration":3}]'::jsonb,
     '🍳 Kitchen renovation inspo for SG homes! #KitchenDesign #SGReno',
     'draft');

  -- ============================================================
  -- GBP Data
  -- ============================================================
  INSERT INTO gbp_connections (id, client_id, business_name, primary_category, site_url, status) VALUES
    (gen_random_uuid(), _c1, 'Renovo Interiors Pte Ltd', 'Renovation Contractor', 'https://renovo.sg', 'connected');

  SELECT id INTO _gbp1 FROM gbp_connections WHERE client_id=_c1 LIMIT 1;

  INSERT INTO gbp_post_drafts (client_id, article_id, title, content, cta_type, cta_url, status) VALUES
    (_c1, _art1, 'Renovation Guide 2026', 'Planning a renovation? Read our comprehensive guide covering costs, permits, and contractor selection tips.', 'LEARN_MORE', 'https://renovo.sg/blog/guide', 'approved'),
    (_c1, NULL, 'Kitchen Promo This Month', 'Get 15% off kitchen renovation packages this March. Book a free consultation today!', 'CALL', 'tel:+6591234567', 'draft');

  INSERT INTO gbp_review_items (client_id, reviewer_name, rating, review_text, review_date, response_status) VALUES
    (_c1, 'John Tan', 5, 'Excellent renovation work! Very professional team. Completed on time and within budget.', now() - interval '10 days', 'responded'),
    (_c1, 'Alice Wong', 4, 'Good quality work but took slightly longer than expected. Overall satisfied with the result.', now() - interval '5 days', 'drafted'),
    (_c1, 'Mike Chen', 3, 'Decent work but communication could be improved. Final result was okay.', now() - interval '2 days', 'unreviewed');

  -- ============================================================
  -- Performance Snapshots (30 days of analytics data)
  -- ============================================================
  INSERT INTO page_performance_snapshots (client_id, page_url, source, clicks, impressions, ctr, average_position, sessions, users, engagement_rate, snapshot_date)
  SELECT _c1, url, 'gsc',
    (50 + (random()*80)::int + i*2),
    (800 + (random()*400)::int + i*15),
    (0.04 + random()*0.03)::numeric(6,4),
    (8 + random()*5)::numeric(6,2),
    (40 + (random()*60)::int + i),
    (35 + (random()*50)::int + i),
    (0.55 + random()*0.15)::numeric(6,4),
    _d - (30 - i)
  FROM generate_series(0, 30) AS i,
    (VALUES ('https://renovo.sg/'), ('https://renovo.sg/services'), ('https://renovo.sg/kitchen'), ('https://renovo.sg/hdb'), ('https://renovo.sg/blog/guide')) AS t(url);

  -- ============================================================
  -- CRM Contacts, Deals, Activities
  -- ============================================================
  INSERT INTO crm_contacts (id, client_id, first_name, last_name, full_name, email, phone, company_name, status, lead_source) VALUES
    (gen_random_uuid(), _c1, 'David', 'Lee', 'David Lee', 'david@email.com', '+6591111111', NULL, 'qualified', 'seo'),
    (gen_random_uuid(), _c1, 'Emily', 'Tan', 'Emily Tan', 'emily@email.com', '+6592222222', 'Tan Holdings', 'proposal', 'google_ads'),
    (gen_random_uuid(), _c1, 'James', 'Ng', 'James Ng', 'james@email.com', '+6593333333', NULL, 'won', 'gbp'),
    (gen_random_uuid(), _c1, 'Lisa', 'Koh', 'Lisa Koh', 'lisa@email.com', '+6594444444', 'Koh Enterprises', 'contacted', 'website_form'),
    (gen_random_uuid(), _c1, 'Ryan', 'Sim', 'Ryan Sim', 'ryan@email.com', '+6595555555', NULL, 'new', 'seo');

  SELECT id INTO _contact1 FROM crm_contacts WHERE email='david@email.com';
  SELECT id INTO _contact2 FROM crm_contacts WHERE email='emily@email.com';
  SELECT id INTO _contact3 FROM crm_contacts WHERE email='james@email.com';
  SELECT id INTO _contact4 FROM crm_contacts WHERE email='lisa@email.com';
  SELECT id INTO _contact5 FROM crm_contacts WHERE email='ryan@email.com';

  INSERT INTO crm_deals (id, client_id, contact_id, deal_name, deal_value, deal_stage, expected_close_date) VALUES
    (gen_random_uuid(), _c1, _contact1, '4-Room HDB Full Renovation', 65000, 'qualified', _d + 30),
    (gen_random_uuid(), _c1, _contact2, 'Condo Kitchen Overhaul', 28000, 'proposal_sent', _d + 14),
    (gen_random_uuid(), _c1, _contact3, '3-Room BTO Package', 45000, 'won', _d - 5);

  SELECT id INTO _deal1 FROM crm_deals WHERE deal_name LIKE '%4-Room%';
  SELECT id INTO _deal2 FROM crm_deals WHERE deal_name LIKE '%Kitchen%';
  SELECT id INTO _deal3 FROM crm_deals WHERE deal_name LIKE '%BTO%';

  INSERT INTO crm_activities (client_id, contact_id, deal_id, activity_type, title, description, due_date) VALUES
    (_c1, _contact1, _deal1, 'call', 'Initial consultation call', 'Discussed renovation scope and budget.', now() - interval '3 days'),
    (_c1, _contact1, _deal1, 'follow_up', 'Send quotation', 'Prepare detailed quotation based on site visit.', now() + interval '2 days'),
    (_c1, _contact2, _deal2, 'meeting', 'Site visit — condo kitchen', 'Measure kitchen dimensions and discuss layout options.', now() + interval '1 day'),
    (_c1, _contact2, _deal2, 'email', 'Sent material catalog', 'Shared countertop and cabinet door options.', now() - interval '1 day'),
    (_c1, _contact3, _deal3, 'note', 'Project kickoff', 'Renovation started. Contractor team assigned.', now() - interval '5 days'),
    (_c1, _contact4, NULL, 'task', 'Qualify lead', 'Follow up on website enquiry about bathroom renovation.', now() + interval '3 days');

  -- ============================================================
  -- Command Center Priorities
  -- ============================================================
  INSERT INTO marketing_priorities (client_id, priority_type, source_module, title, description, recommended_action, priority_score, impact_score, effort_score, status, due_date) VALUES
    (_c1, 'seo', 'rank_tracking', 'Push "renovation singapore" into top 10', 'Currently at position 12 with upward trend. Need targeted link building.', 'Build 3-5 quality backlinks to /services page', 92, 95, 60, 'open', _d + 7),
    (_c1, 'content', 'content_plan', 'Publish bathroom renovation guide', 'Draft article ready. High search volume keyword.', 'Review and publish bathroom renovation article', 85, 80, 30, 'open', _d + 3),
    (_c1, 'technical', 'technical_audit', 'Fix missing title tags', '2 critical pages without title tags detected.', 'Add unique title tags to /about and /contact pages', 88, 70, 20, 'in_progress', _d + 2),
    (_c1, 'gbp', 'gbp', 'Respond to new reviews', '1 unreviewed review needs response.', 'Draft and publish response to Mike Chen review', 75, 60, 15, 'open', _d + 1),
    (_c1, 'social', 'social_posts', 'Schedule Instagram post', 'Approved Instagram post pending scheduling.', 'Schedule post for optimal engagement time', 70, 50, 10, 'open', _d + 2),
    (_c1, 'paid_ads', 'google_ads', 'Review ad spend efficiency', 'CPC trending up 15% this week.', 'Adjust bid strategy and review negative keywords', 78, 75, 40, 'open', _d + 5);

  -- Weekly Action Plan
  INSERT INTO weekly_action_plans (id, client_id, week_start, summary, top_goal, status) VALUES
    (gen_random_uuid(), _c1, date_trunc('week', _d)::date,
     'Focus on SEO quick wins, publish pending content, and respond to GBP reviews.',
     'Move "renovation singapore" into top 10',
     'in_progress');

  SELECT id INTO _plan1 FROM weekly_action_plans WHERE client_id=_c1 ORDER BY created_at DESC LIMIT 1;

  INSERT INTO weekly_action_items (plan_id, channel, task_title, task_description, owner_type, status, due_date) VALUES
    (_plan1, 'seo', 'Fix 2 critical audit issues', 'Add missing title tags to /about and /contact', 'developer', 'in_progress', _d + 2),
    (_plan1, 'content', 'Publish bathroom renovation article', 'Review draft and publish to WordPress', 'content', 'open', _d + 3),
    (_plan1, 'social', 'Schedule 2 social posts', 'Approve and schedule Instagram and LinkedIn posts', 'content', 'open', _d + 4),
    (_plan1, 'gbp', 'Respond to reviews', 'Draft and publish response to pending reviews', 'manager', 'open', _d + 1),
    (_plan1, 'seo', 'Build 3 backlinks', 'Outreach to renovation directories and blogs', 'seo', 'open', _d + 7);

  -- Cross-Channel Recommendations
  INSERT INTO cross_channel_recommendations (client_id, recommendation_type, title, description, recommended_action, priority, status) VALUES
    (_c1, 'repurpose_article_to_social', 'Share renovation guide on social media', 'The published renovation guide is performing well. Repurpose key points for social.', 'Create 3 social posts from article highlights', 'high', 'open'),
    (_c1, 'repurpose_article_to_video', 'Create video from kitchen article', 'Kitchen renovation ideas article has high engagement. Create a short video version.', 'Generate TikTok/Reels video script from article', 'medium', 'open'),
    (_c1, 'boost_page_with_ads', 'Boost renovation services page', '/services page ranking well organically. Consider paid boost for competitive terms.', 'Create Google Ads campaign targeting "renovation singapore"', 'high', 'open');

  -- ============================================================
  -- Workspace Branding
  -- ============================================================
  INSERT INTO workspace_branding (workspace_id, brand_name, primary_color, secondary_color, accent_color, theme_mode, support_email) VALUES
    (_ws_agency, 'Webby SEO', '#6366f1', '#8b5cf6', '#f59e0b', 'light', 'support@webby.seo')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Demo seed completed successfully!';
END $$;
