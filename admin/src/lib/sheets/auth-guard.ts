/**
 * Shared API route auth guard.
 * Verifies Supabase JWT from Authorization header and checks company access.
 */
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@leadcrm/types';

interface GuardResult {
  userId: string;
  role: UserRole;
  spreadsheetId: string;
  sheetName: string;
}

export async function guardCompanyAccess(
  req: NextRequest,
  companyId: string
): Promise<GuardResult | { error: string; status: number }> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Missing authorization token', status: 401 };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Verify JWT
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { error: 'Invalid token', status: 401 };

  // Check role for this company (super_admin has global access)
  const { data: roleRow } = await supabase
    .from('user_company_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .or(`company_id.eq.${companyId},role.eq.super_admin`)
    .order('role')
    .limit(1)
    .single();

  if (!roleRow) return { error: 'Access denied', status: 403 };

  // Get sheet connection
  const { data: sheet } = await supabase
    .from('sheet_connections')
    .select('spreadsheet_id, sheet_name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .single();

  if (!sheet) return { error: 'No sheet connected for this company', status: 404 };

  return {
    userId: user.id,
    role: roleRow.role as UserRole,
    spreadsheetId: sheet.spreadsheet_id as string,
    sheetName: sheet.sheet_name as string,
  };
}

export function isGuardError(
  v: GuardResult | { error: string; status: number }
): v is { error: string; status: number } {
  return 'error' in v;
}

/** CORS headers for mobile app requests */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
