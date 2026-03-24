-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'company_admin', 'sales_rep')),
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sheet connections
CREATE TABLE public.sheet_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL DEFAULT 'Sheet1',
  spreadsheet_name TEXT,
  status_column TEXT,
  name_column TEXT,
  phone_column TEXT,
  email_column TEXT,
  notes_column TEXT,
  assigned_rep_column TEXT,
  headers JSONB DEFAULT '[]',
  credentials JSONB,
  auth_type TEXT DEFAULT 'service_account',
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Status configurations per company
CREATE TABLE public.status_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default statuses trigger
CREATE OR REPLACE FUNCTION create_default_statuses()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.status_configs (company_id, name, color, label, sort_order)
  VALUES
    (NEW.id, 'new', '#3B82F6', 'חדש', 1),
    (NEW.id, 'contacted', '#F59E0B', 'פנייה בוצעה', 2),
    (NEW.id, 'interested', '#8B5CF6', 'מתעניין', 3),
    (NEW.id, 'not_interested', '#EF4444', 'לא מעוניין', 4),
    (NEW.id, 'closed', '#10B981', 'סגור - עסקה', 5),
    (NEW.id, 'callback', '#F97316', 'חזרה מאוחר יותר', 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION create_default_statuses();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sheet_connections_updated_at BEFORE UPDATE ON public.sheet_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "super_admin_companies" ON public.companies
  FOR ALL TO authenticated USING (auth.user_role() = 'super_admin');
CREATE POLICY "member_sees_own_company" ON public.companies
  FOR SELECT TO authenticated USING (id = auth.user_company_id());

CREATE POLICY "super_admin_profiles" ON public.profiles
  FOR ALL TO authenticated USING (auth.user_role() = 'super_admin');
CREATE POLICY "company_sees_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (company_id = auth.user_company_id());
CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "super_admin_sheets" ON public.sheet_connections
  FOR ALL TO authenticated USING (auth.user_role() = 'super_admin');
CREATE POLICY "company_admin_sheet" ON public.sheet_connections
  FOR ALL TO authenticated
  USING (company_id = auth.user_company_id() AND auth.user_role() = 'company_admin');
CREATE POLICY "sales_rep_sheet_read" ON public.sheet_connections
  FOR SELECT TO authenticated
  USING (company_id = auth.user_company_id());

CREATE POLICY "company_statuses" ON public.status_configs
  FOR SELECT TO authenticated
  USING (company_id = auth.user_company_id() OR auth.user_role() = 'super_admin');
CREATE POLICY "admin_manage_statuses" ON public.status_configs
  FOR ALL TO authenticated
  USING (company_id = auth.user_company_id() AND auth.user_role() IN ('company_admin', 'super_admin'));

CREATE POLICY "company_activity" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (company_id = auth.user_company_id() OR auth.user_role() = 'super_admin');
CREATE POLICY "insert_activity" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales_rep')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
