import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Company, SheetConnection, CompanyStatus } from '@leadcrm/types';
import SheetConnectionForm from './SheetConnectionForm';
import StatusManager from './StatusManager';

interface Props {
  params: { id: string };
}

export default async function CompanyDetailPage({ params }: Props) {
  const supabase = createSupabaseServerClient();

  const [{ data: company }, { data: sheetConn }, { data: statuses }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', params.id).single(),
    supabase.from('sheet_connections').select('*').eq('company_id', params.id).maybeSingle(),
    supabase.from('company_statuses').select('*').eq('company_id', params.id).order('sort_order'),
  ]);

  if (!company) notFound();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{(company as Company).name}</h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 32 }}>slug: {(company as Company).slug}</p>

      <Section title="Google Sheet Connection">
        <SheetConnectionForm companyId={params.id} existing={sheetConn as SheetConnection | null} />
      </Section>

      <Section title="Lead Statuses">
        <StatusManager companyId={params.id} statuses={(statuses ?? []) as CompanyStatus[]} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}
