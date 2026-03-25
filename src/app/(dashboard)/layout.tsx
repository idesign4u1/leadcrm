import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*, company:companies(name, primary_color)')
    .eq('id', user.id)
    .single()

  // Auto-create profile if missing (don't redirect - avoids loop)
  if (!profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.email ?? 'Admin',
      role: 'super_admin',
    })

    const { data: created } = await supabase
      .from('profiles')
      .select('*, company:companies(name, primary_color)')
      .eq('id', user.id)
      .single()

    profile = created
  }

  // If still no profile - show setup message (no redirect!)
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-3xl mb-4">⚠️</p>
          <h2 className="text-lg font-bold text-slate-800 mb-2">הפרופיל לא נמצא</h2>
          <p className="text-sm text-slate-500 mb-5">הרץ את ה-SQL הבא ב-Supabase</p>
          <pre className="bg-slate-800 text-green-400 text-xs text-left p-4 rounded-xl overflow-x-auto mb-5">
{`INSERT INTO public.profiles
  (id, email, full_name, role)
SELECT id, email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    email
  ),
  'super_admin'
FROM auth.users
WHERE email = '${user.email}'
ON CONFLICT (id)
DO UPDATE SET role = 'super_admin';`}
          </pre>
          <a
            href="/dashboard"
            className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-blue-700 inline-block"
          >
            רענן אחרי הרצת ה-SQL
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar profile={profile} companyName={profile.company?.name} />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  )
}
