export type UserRole = 'super_admin' | 'company_admin' | 'sales_rep'

export interface Company {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  company_id?: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
  company?: Company
}

export interface SheetConnection {
  id: string
  company_id: string
  spreadsheet_id: string
  sheet_name: string
  spreadsheet_name?: string
  status_column?: string
  name_column?: string
  phone_column?: string
  email_column?: string
  notes_column?: string
  assigned_rep_column?: string
  headers: string[]
  auth_type: 'service_account' | 'oauth'
  last_synced_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StatusConfig {
  id: string
  company_id: string
  name: string
  color: string
  label: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  company_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id?: string
  details: Record<string, unknown>
  created_at: string
  profile?: Profile
}

export interface Lead {
  id: string
  company_id: string
  date?: string
  name?: string
  phone?: string
  email?: string
  campaign?: string
  notes?: string
  status: string
  assigned_rep_id?: string
  assigned_rep_name?: string
  custom_fields: Record<string, unknown>
  source?: string
  created_at: string
  updated_at: string
}

export interface CustomColumn {
  id: string
  company_id: string
  key: string
  label: string
  field_type: 'text' | 'number' | 'date' | 'select'
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface WebhookToken {
  id: string
  company_id: string
  token: string
  label: string
  is_active: boolean
  created_at: string
}

export interface LeadFilters {
  search?: string
  status?: string
  assigned_rep?: string
  dateFrom?: string
  dateTo?: string
}

export interface LeadStats {
  total: number
  byStatus: Record<string, number>
  newToday: number
  closedTotal: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
