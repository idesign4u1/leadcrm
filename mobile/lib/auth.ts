import { supabase } from './supabase';
import type { UserCompanyRole, Profile } from '@leadcrm/types';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function getUserRoles(userId: string): Promise<UserCompanyRole[]> {
  const { data, error } = await supabase
    .from('user_company_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) return [];
  return (data ?? []) as UserCompanyRole[];
}

export function isSuperAdmin(roles: UserCompanyRole[]): boolean {
  return roles.some((r) => r.role === 'super_admin');
}

export function companyRole(roles: UserCompanyRole[], companyId: string) {
  return roles.find((r) => r.company_id === companyId)?.role ?? null;
}
