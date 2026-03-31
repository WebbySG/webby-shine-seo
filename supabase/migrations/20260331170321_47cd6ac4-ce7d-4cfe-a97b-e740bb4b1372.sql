
-- Marketing priorities
CREATE TABLE public.marketing_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority_type TEXT NOT NULL DEFAULT 'seo',
  source_module TEXT NOT NULL DEFAULT 'seo',
  impact_score INTEGER NOT NULL DEFAULT 50,
  effort_score INTEGER NOT NULL DEFAULT 50,
  confidence_score INTEGER NOT NULL DEFAULT 50,
  priority_score INTEGER NOT NULL DEFAULT 50,
  recommended_action TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  keyword TEXT,
  target_url TEXT,
  entity_id UUID,
  entity_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_priorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage priorities via client" ON public.marketing_priorities FOR ALL USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = marketing_priorities.client_id AND clients.user_id = auth.uid()));
CREATE TRIGGER update_marketing_priorities_updated_at BEFORE UPDATE ON public.marketing_priorities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Weekly action plans
CREATE TABLE public.weekly_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  top_goal TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  ai_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage weekly plans via client" ON public.weekly_action_plans FOR ALL USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = weekly_action_plans.client_id AND clients.user_id = auth.uid()));
CREATE TRIGGER update_weekly_action_plans_updated_at BEFORE UPDATE ON public.weekly_action_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Weekly plan items
CREATE TABLE public.weekly_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.weekly_action_plans(id) ON DELETE CASCADE,
  priority_id UUID REFERENCES public.marketing_priorities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_type TEXT NOT NULL DEFAULT 'seo',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage plan items via plan" ON public.weekly_plan_items FOR ALL USING (EXISTS (SELECT 1 FROM weekly_action_plans wap JOIN clients c ON c.id = wap.client_id WHERE wap.id = weekly_plan_items.plan_id AND c.user_id = auth.uid()));

-- Quick wins
CREATE TABLE public.quick_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL DEFAULT 'seo',
  effort_level TEXT NOT NULL DEFAULT 'low',
  impact_level TEXT NOT NULL DEFAULT 'high',
  status TEXT NOT NULL DEFAULT 'open',
  entity_id UUID,
  entity_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_wins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage quick wins via client" ON public.quick_wins FOR ALL USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = quick_wins.client_id AND clients.user_id = auth.uid()));
