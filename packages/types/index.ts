// Shared TypeScript types for platform metadata.
// Lead data is NOT stored here — it comes from Google Sheets at runtime.

export type UserRole = 'super_admin' | 'company_admin' | 'sales_rep';

// ─── Supabase DB row types ────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // matches auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCompanyRole {
  id: string;
  user_id: string;
  company_id: string | null; // null for super_admin
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface SheetConnection {
  id: string;
  company_id: string;
  spreadsheet_id: string;
  sheet_name: string;
  cached_headers: string[] | null;
  last_synced_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyStatus {
  id: string;
  company_id: string;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface CompanySetting {
  id: string;
  company_id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  company_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── Auth session user (enriched) ────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  roles: UserCompanyRole[];
}

// ─── Google Sheets lead types (runtime, not persisted) ───────────────────────

/** Raw row from a Google Sheet: header→value map */
export type LeadRow = Record<string, string>;

/** Parsed sheet data */
export interface SheetData {
  headers: string[];
  rows: LeadRow[];
}

/** A single lead with its row index (1-based, skipping header) */
export interface Lead {
  rowIndex: number; // position in sheet for updates
  fields: LeadRow;
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
