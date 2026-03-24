import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ReportsClient from '@/components/reports/ReportsClient'

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  const { data: statuses } = await supabase
    .from('status_configs')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .order('sort_order')

  const { data: sheetConn } = await supabase
    .from('sheet_connections')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .single()

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)

  return (
    <div className="flex flex-col min-h-full">
      <Header profile={profile} title="דוחות" />
      <ReportsClient
        statuses={statuses ?? []}
        sheetConnection={sheetConn ?? null}
        teamMembers={teamMembers ?? []}
      />
    </div>
  )
}
