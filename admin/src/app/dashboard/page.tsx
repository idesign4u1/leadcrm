import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const [{ count: companyCount }, { count: userCount }] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('user_company_roles').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: 'flex', gap: 16 }}>
        <StatCard label="Companies" value={companyCount ?? 0} />
        <StatCard label="Users" value={userCount ?? 0} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 140 }}>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700 }}>{value}</p>
    </div>
  );
}
