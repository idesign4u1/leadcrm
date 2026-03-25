import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log('=== LAYOUT DEBUG ===')
  console.log('User:', user?.id, user?.email)
  console.log('User Error:', userError)
  
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, company:companies(name, primary_color)')
    .eq('id', user.id)
    .single()

  console.log('Profile:', profile)
  console.log('Profile Error:', profileError)
  console.log('===================')

  if (!profile) {
    // Try to create profile
    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? user.email ?? 'Admin',
        role: 'super_admin',
      })
      .select('*, company:companies(name, primary_color)')
      .single()

    console.log('Upsert result:', upserted)
    console.log('Upsert error:', upsertError)

    if (!upserted) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
            <p className="text-3xl mb-4 text-center">⚠️</p>
            <h2 className="text-lg font-bold text-slate-800 mb-2 text-center">הפרופיל לא נמצא</h2>
            
            <div className="bg-red-50 rounded-lg p-3 mb-4 text-xs text-red-700">
              <strong>Debug info:</strong><br/>
              User ID: {user.id}<br/>
              Email: {user.email}<br/>
              DB Error: {profileError?.message}<br/>
              Upsert Error: {upsertError?.message}
            </div>

            <p className="text-sm text-slate-500 mb-4 text-center">הרץ את ה-SQL הבא ב-Supabase SQL Editor</p>
            <pre className="bg-slate-800 text-green-400 text-xs p-4 rounded-xl overflow-x-auto mb-5">
{`INSERT INTO public.profiles
  (id, email, full_name, role)
VALUES (
  '${user.id}',
  '${user.email}',
  '${user.email}',
  'super_admin'
)
ON CONFLICT (id)
DO UPDATE SET role = 'super_admin';`}
            </pre>
            <a href="/dashboard" className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-blue-700 block text-center">
              רענן
            </a>
          </div>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar profile={upserted} companyName={upserted.company?.name} />
        <main className="flex-1 ml-64 flex flex-col min-h-screen">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar profile={profile} companyName={profile.company?.name} />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">{children}</main>
    </div>
  )
}
