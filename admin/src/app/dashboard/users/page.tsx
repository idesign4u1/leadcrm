import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function UsersPage() {
  const supabase = createSupabaseServerClient();

  // Join user_company_roles with profiles and companies
  const { data: roles } = await supabase
    .from('user_company_roles')
    .select('id, role, is_active, user_id, company_id, profiles(full_name), companies(name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Users</h1>
        <Link href="/dashboard/users/new" style={btnStyle}>+ Invite User</Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <Th>Name</Th>
              <Th>Company</Th>
              <Th>Role</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {(roles ?? []).map((r: any) => (
              <tr key={r.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <Td>{r.profiles?.full_name ?? r.user_id.slice(0, 8)}</Td>
                <Td>{r.companies?.name ?? '— (super admin)'}</Td>
                <Td>{r.role}</Td>
                <Td>
                  <span style={{ color: r.is_active ? '#16A34A' : '#9CA3AF', fontSize: 13 }}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </Td>
              </tr>
            ))}
            {!roles?.length && (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td style={{ padding: '12px 16px', fontSize: 14 }}>{children}</td>;
}
const btnStyle: React.CSSProperties = { background: '#2563EB', color: '#fff', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600 };
