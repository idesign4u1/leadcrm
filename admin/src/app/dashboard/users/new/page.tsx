'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Company, UserRole } from '@leadcrm/types';

const ROLES: UserRole[] = ['super_admin', 'company_admin', 'sales_rep'];

export default function InviteUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('sales_rep');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createSupabaseBrowserClient()
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .then(({ data }) => setCompanies((data as Company[]) ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // NOTE: In production use Supabase Admin API (service role) to create users.
    // For MVP/demo we use signUp which auto-confirms if email confirmation is off.
    const supabase = createSupabaseBrowserClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'Failed to create user');
      setLoading(false);
      return;
    }

    const { error: roleError } = await supabase.from('user_company_roles').insert({
      user_id: signUpData.user.id,
      company_id: role === 'super_admin' ? null : companyId || null,
      role,
    });

    if (roleError) {
      setError(roleError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/users');
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Invite User</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Full Name</label>
        <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

        <label style={styles.label}>Role</label>
        <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {role !== 'super_admin' && (
          <>
            <label style={styles.label}>Company</label>
            <select style={styles.input} value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
              <option value="">Select company…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Creating…' : 'Create User'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { background: '#fff', borderRadius: 10, padding: 24, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { border: '1px solid #E5E7EB', borderRadius: 7, padding: '9px 12px', fontSize: 14 },
  error: { color: '#EF4444', fontSize: 13 },
  button: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
