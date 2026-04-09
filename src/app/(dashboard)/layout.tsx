import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, company:companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: upserted } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? user.email ?? 'Admin',
        role: 'super_admin',
      })
      .select('*, company:companies(name)')
      .single()

    if (!upserted) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
            <p className="text-3xl mb-4 text-center">⚠️</p>
            <h2 className="text-lg font-bold text-slate-800 mb-3 text-center">הפרופיל לא נמצא</h2>
            <p className="text-sm text-slate-500 mb-4 text-center">הרץ את ה-SQL הבא ב-Supabase</p>
            <pre className="bg-slate-800 text-green-400 text-xs p-4 rounded-xl overflow-x-auto mb-5 whitespace-pre-wrap">
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
            {profileError && (
              <p className="text-xs text-red-500 text-center mb-3">{profileError.message}</p>
            )}
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
