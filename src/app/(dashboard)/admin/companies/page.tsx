import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import AdminCompaniesClient from '@/components/admin/AdminCompaniesClient'

export default async function AdminCompaniesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile.role !== 'super_admin') redirect('/dashboard')

  const { data: companies } = await supabase
    .from('companies')
    .select('*, profiles(count), sheet_connections(spreadsheet_id, last_synced_at)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-full">
      <Header profile={profile} title="ניהול חברות" />
      <AdminCompaniesClient companies={companies ?? []} />
    </div>
  )
}
