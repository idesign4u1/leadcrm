-- Phase 1: Platform metadata schema
-- Source of truth for leads is Google Sheets, NOT this database.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Companies ────────────────────────────────────────────────────────────────
create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Profiles (extends Supabase auth.users) ───────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── User company roles ───────────────────────────────────────────────────────
create type user_role as enum ('super_admin', 'company_admin', 'sales_rep');

create table user_company_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid references companies(id) on delete cascade,  -- null = super_admin (global)
  role        user_role not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  -- super_admin has no company; company_admin/sales_rep must have one
  constraint company_required_for_company_roles
    check (role = 'super_admin' or company_id is not null),
  unique (user_id, company_id, role)
);

-- ─── Sheet connections ────────────────────────────────────────────────────────
create table sheet_connections (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  spreadsheet_id  text not null,
  sheet_name      text not null default 'Sheet1',
  -- cached header column names, refreshed on sync
  cached_headers  jsonb,
  last_synced_at  timestamptz,
  is_active       boolean not null default true,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_id)  -- one active sheet per company for MVP
);

-- ─── Company statuses ─────────────────────────────────────────────────────────
create table company_statuses (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  color       text not null default '#6B7280',
  sort_order  integer not null default 0,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);

-- ─── Company settings ─────────────────────────────────────────────────────────
create table company_settings (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  key         text not null,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  unique (company_id, key)
);

-- ─── Activity logs ────────────────────────────────────────────────────────────
create table activity_logs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id) on delete set null,
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text,        -- 'lead' | 'user' | 'company' | 'sheet' etc.
  entity_id   text,        -- sheet row index or metadata id
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index on user_company_roles (user_id);
create index on user_company_roles (company_id);
create index on sheet_connections (company_id);
create index on company_statuses (company_id);
create index on company_settings (company_id);
create index on activity_logs (company_id, created_at desc);

-- ─── Updated_at triggers ──────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at before update on companies
  for each row execute function set_updated_at();

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger sheet_connections_updated_at before update on sheet_connections
  for each row execute function set_updated_at();

create trigger company_settings_updated_at before update on company_settings
  for each row execute function set_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table companies enable row level security;
alter table profiles enable row level security;
alter table user_company_roles enable row level security;
alter table sheet_connections enable row level security;
alter table company_statuses enable row level security;
alter table company_settings enable row level security;
alter table activity_logs enable row level security;

-- Helper: get current user's role for a company
create or replace function user_role_for_company(cid uuid)
returns user_role language sql security definer stable as $$
  select role from user_company_roles
  where user_id = auth.uid() and company_id = cid and is_active = true
  limit 1;
$$;

create or replace function is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_company_roles
    where user_id = auth.uid() and role = 'super_admin' and is_active = true
  );
$$;

-- profiles: users see/edit their own
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "profiles_select_admin" on profiles for select using (is_super_admin());

-- companies: super_admin full access; members can read their own
create policy "companies_super_admin" on companies using (is_super_admin());
create policy "companies_member_select" on companies for select using (
  exists (
    select 1 from user_company_roles
    where user_id = auth.uid() and company_id = companies.id and is_active = true
  )
);

-- user_company_roles: super_admin full; users see own
create policy "ucr_super_admin" on user_company_roles using (is_super_admin());
create policy "ucr_own" on user_company_roles for select using (user_id = auth.uid());
create policy "ucr_company_admin_select" on user_company_roles for select using (
  user_role_for_company(company_id) in ('company_admin')
);

-- sheet_connections: super_admin + company_admin read/write; sales_rep read
create policy "sc_super_admin" on sheet_connections using (is_super_admin());
create policy "sc_company_admin" on sheet_connections using (
  user_role_for_company(company_id) = 'company_admin'
);
create policy "sc_sales_rep_select" on sheet_connections for select using (
  user_role_for_company(company_id) = 'sales_rep'
);

-- company_statuses: super_admin + company_admin write; all members read
create policy "cs_super_admin" on company_statuses using (is_super_admin());
create policy "cs_company_admin" on company_statuses using (
  user_role_for_company(company_id) = 'company_admin'
);
create policy "cs_member_select" on company_statuses for select using (
  user_role_for_company(company_id) is not null
);

-- company_settings: same as statuses
create policy "csett_super_admin" on company_settings using (is_super_admin());
create policy "csett_company_admin" on company_settings using (
  user_role_for_company(company_id) = 'company_admin'
);
create policy "csett_member_select" on company_settings for select using (
  user_role_for_company(company_id) is not null
);

-- activity_logs: super_admin full; company members read own company
create policy "al_super_admin" on activity_logs using (is_super_admin());
create policy "al_member_select" on activity_logs for select using (
  user_role_for_company(company_id) is not null
);
