import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Company } from '@leadcrm/types';
import Link from 'next/link';

export default async function CompaniesPage() {
  const supabase = createSupabaseServerClient();
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Companies</h1>
        <Link href="/dashboard/companies/new" style={btnStyle}>
          + New Company
        </Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {(companies as Company[] ?? []).map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <Td>{c.name}</Td>
                <Td>{c.slug}</Td>
                <Td>
                  <span style={{ color: c.is_active ? '#16A34A' : '#9CA3AF', fontSize: 13 }}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </Td>
                <Td>{new Date(c.created_at).toLocaleDateString()}</Td>
                <Td>
                  <Link href={`/dashboard/companies/${c.id}`} style={{ color: '#2563EB', fontSize: 13 }}>
                    Manage
                  </Link>
                </Td>
              </tr>
            ))}
            {!companies?.length && (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                  No companies yet. Create one to get started.
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
