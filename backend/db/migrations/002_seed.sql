-- Seed data for development
-- Uses a single tenant_id for MVP

DO $$
DECLARE
  _tenant UUID := '00000000-0000-0000-0000-000000000001';
  _c1 UUID; _c2 UUID; _c3 UUID; _c4 UUID;
  _k1 UUID; _k2 UUID; _k3 UUID; _k4 UUID; _k5 UUID;
  _ar1 UUID;
BEGIN
  -- Clients
  INSERT INTO clients (id, tenant_id, name, domain) VALUES
    (gen_random_uuid(), _tenant, 'Renovo Interiors', 'renovo.sg'),
    (gen_random_uuid(), _tenant, 'HomeStyle SG', 'homestyle.sg'),
    (gen_random_uuid(), _tenant, 'Kitchen Pro Asia', 'kitchenpro.asia'),
    (gen_random_uuid(), _tenant, 'CleanSpace Solutions', 'cleanspace.com.sg');

  SELECT id INTO _c1 FROM clients WHERE domain='renovo.sg';
  SELECT id INTO _c2 FROM clients WHERE domain='homestyle.sg';
  SELECT id INTO _c3 FROM clients WHERE domain='kitchenpro.asia';
  SELECT id INTO _c4 FROM clients WHERE domain='cleanspace.com.sg';

  -- Keywords for Renovo
  INSERT INTO keywords (id, client_id, keyword) VALUES
    (gen_random_uuid(), _c1, 'renovation singapore'),
    (gen_random_uuid(), _c1, 'kitchen renovation singapore'),
    (gen_random_uuid(), _c1, 'hdb renovation contractor'),
    (gen_random_uuid(), _c1, 'bathroom renovation cost singapore'),
    (gen_random_uuid(), _c1, 'home renovation ideas');

  -- Competitors
  INSERT INTO competitors (client_id, domain, label, confirmed) VALUES
    (_c1, 'renocraft.sg', 'RenoCraft', true),
    (_c1, 'buildmate.com.sg', 'BuildMate', true),
    (_c2, 'hipvan.com', 'HipVan', true),
    (_c2, 'castlery.com', 'Castlery', true);

  -- Rank snapshots
  SELECT id INTO _k1 FROM keywords WHERE keyword='renovation singapore';
  SELECT id INTO _k2 FROM keywords WHERE keyword='kitchen renovation singapore';
  SELECT id INTO _k3 FROM keywords WHERE keyword='hdb renovation contractor';

  INSERT INTO rank_snapshots (keyword_id, domain, position, ranking_url, delta, snapshot_date) VALUES
    (_k1, 'renovo.sg', 12, 'https://renovo.sg/services', 6, CURRENT_DATE),
    (_k2, 'renovo.sg', 9, 'https://renovo.sg/kitchen', -4, CURRENT_DATE),
    (_k3, 'renovo.sg', 4, 'https://renovo.sg/hdb', 3, CURRENT_DATE);

  -- Audit run + issues
  INSERT INTO audit_runs (id, client_id, pages_crawled, score, status, completed_at)
    VALUES (gen_random_uuid(), _c1, 120, 72, 'completed', now());

  SELECT id INTO _ar1 FROM audit_runs WHERE client_id = _c1 LIMIT 1;

  INSERT INTO audit_issues (audit_run_id, issue_type, severity, affected_url, description, fix_instruction, status) VALUES
    (_ar1, 'Missing Title', 'critical', 'https://renovo.sg/about', 'Page has no <title> tag', 'Add a unique, descriptive title tag under 60 characters.', 'open'),
    (_ar1, 'Missing Meta Description', 'warning', 'https://renovo.sg/services', 'No meta description found', 'Add a compelling meta description under 160 characters.', 'open'),
    (_ar1, 'Broken Internal Link', 'critical', 'https://renovo.sg/blog/tips', 'Link to /old-page returns 404', 'Update or remove the broken link.', 'open');
END $$;
