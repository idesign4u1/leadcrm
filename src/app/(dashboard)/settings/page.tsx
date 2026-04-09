import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import SettingsClient from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  const { data: sheetConn } = await supabase
    .from('sheet_connections')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .maybeSingle()

  const { data: statuses } = await supabase
    .from('status_configs')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('sort_order')

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-full">
      <Header profile={profile} title="הגדרות" />
      <SettingsClient
        profile={profile}
        sheetConnection={sheetConn ?? null}
        statuses={statuses ?? []}
        teamMembers={teamMembers ?? []}
      />
    </div>
  )
}
