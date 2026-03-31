
CREATE TYPE app_role AS ENUM ('owner','admin','manager','seo','content','designer','ads','client_admin','client_user','viewer');
CREATE TYPE client_status AS ENUM ('active','paused','archived');
CREATE TYPE audit_status AS ENUM ('pending','running','completed','failed');
CREATE TYPE issue_severity AS ENUM ('critical','warning','info');
CREATE TYPE issue_status AS ENUM ('open','in_progress','fixed','ignored','regressed');
CREATE TYPE opportunity_type AS ENUM ('near_win','content_gap','page_expansion','technical_fix');
CREATE TYPE opportunity_priority AS ENUM ('high','medium','low');
CREATE TYPE opportunity_status AS ENUM ('open','in_progress','done','dismissed');
CREATE TYPE brief_status AS ENUM ('draft','approved','published','under_review','changes_requested','rejected','ready_for_publishing');
CREATE TYPE draft_status AS ENUM ('draft','under_review','changes_requested','approved','rejected','ready_for_publishing');
CREATE TYPE article_status AS ENUM ('draft','review','approved','published');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, full_name)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner'); RETURN NEW; END; $$;

CREATE TRIGGER on_profile_created_assign_role AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();
