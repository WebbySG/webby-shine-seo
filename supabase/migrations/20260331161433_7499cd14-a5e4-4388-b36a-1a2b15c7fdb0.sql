
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  max_keywords INTEGER DEFAULT 50,
  max_competitors INTEGER DEFAULT 5,
  status client_status DEFAULT 'active',
  health_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_clients_user ON clients(user_id);

CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_engine TEXT DEFAULT 'google',
  locale TEXT DEFAULT 'en-SG',
  location TEXT DEFAULT 'Singapore',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, keyword)
);
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage keywords via client" ON keywords FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = keywords.client_id AND clients.user_id = auth.uid()));
CREATE INDEX idx_keywords_client ON keywords(client_id);

CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  label TEXT,
  source TEXT DEFAULT 'manual',
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, domain)
);
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage competitors via client" ON competitors FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = competitors.client_id AND clients.user_id = auth.uid()));

CREATE TABLE rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT,
  domain TEXT NOT NULL,
  position INTEGER,
  previous_position INTEGER,
  url TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  provider TEXT DEFAULT 'dataforseo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword_id, domain, snapshot_date)
);
ALTER TABLE rank_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage rank snapshots via client" ON rank_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = rank_snapshots.client_id AND clients.user_id = auth.uid()));
CREATE INDEX idx_rank_snapshots_keyword ON rank_snapshots(keyword_id, snapshot_date DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
