
CREATE TABLE audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  domain TEXT,
  scope TEXT DEFAULT 'full',
  provider TEXT DEFAULT 'internal',
  pages_crawled INTEGER DEFAULT 0,
  pages_limit INTEGER DEFAULT 500,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  status audit_status DEFAULT 'pending',
  total_issues INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  info_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage audit runs via client" ON audit_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = audit_runs.client_id AND clients.user_id = auth.uid()));
CREATE INDEX idx_audit_runs_client ON audit_runs(client_id, created_at DESC);

CREATE TABLE audit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity issue_severity NOT NULL,
  affected_url TEXT NOT NULL,
  description TEXT NOT NULL,
  fix_instruction TEXT,
  status issue_status DEFAULT 'open',
  provider TEXT,
  category TEXT,
  why_it_matters TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ,
  recheck_count INTEGER DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage audit issues via client" ON audit_issues FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = audit_issues.client_id AND clients.user_id = auth.uid()));
CREATE INDEX idx_audit_issues_run ON audit_issues(audit_run_id);

CREATE TABLE audit_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  title TEXT,
  meta_description TEXT,
  word_count INTEGER,
  load_time_ms INTEGER,
  issues_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read audit pages via run" ON audit_pages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM audit_runs ar JOIN clients c ON c.id = ar.client_id
    WHERE ar.id = audit_pages.audit_run_id AND c.user_id = auth.uid()
  ));

CREATE TABLE audit_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_issue_id UUID NOT NULL REFERENCES audit_issues(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  expected_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read evidence via issue" ON audit_evidence FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM audit_issues ai JOIN clients c ON c.id = ai.client_id
    WHERE ai.id = audit_evidence.audit_issue_id AND c.user_id = auth.uid()
  ));

CREATE TABLE audit_rechecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_issue_id UUID NOT NULL REFERENCES audit_issues(id) ON DELETE CASCADE,
  provider TEXT,
  previous_status TEXT,
  new_status TEXT,
  previous_evidence JSONB,
  new_evidence JSONB,
  diff_summary TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_rechecks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read rechecks via issue" ON audit_rechecks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM audit_issues ai JOIN clients c ON c.id = ai.client_id
    WHERE ai.id = audit_rechecks.audit_issue_id AND c.user_id = auth.uid()
  ));
