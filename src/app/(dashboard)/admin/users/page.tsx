import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile.role !== 'super_admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*, company:companies(name)')
    .order('created_at', { ascending: false })

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="flex flex-col min-h-full">
      <Header profile={profile} title="ניהול משתמשים" />
      <AdminUsersClient users={users ?? []} companies={companies ?? []} />
    </div>
  )
}
