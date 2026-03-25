import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Users, TrendingUp, CheckCircle, PhoneCall, ArrowUpRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  // Profile not created yet — create it now
  if (!profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.email ?? 'Admin',
      role: 'super_admin',
    })
    redirect('/dashboard')
  }

  const companyId = profile.company_id

  const [{ data: statuses }, { data: recentActivity }, { data: teamMembers }] = await Promise.all([
    companyId
      ? supabase.from('status_configs').select('*').eq('company_id', companyId).eq('is_active', true).order('sort_order')
      : { data: [] },
    companyId
      ? supabase.from('activity_logs').select('*, profile:profiles(full_name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10)
      : { data: [] },
    companyId
      ? supabase.from('profiles').select('id, full_name, role').eq('company_id', companyId).eq('is_active', true)
      : { data: [] },
  ])

  const actionLabels: Record<string, string> = {
    lead_created: '\u05d9\u05e6\u05e8 \u05dc\u05d9\u05d3 \u05d7\u05d3\u05e9',
    lead_updated: '\u05e2\u05d3\u05db\u05df \u05dc\u05d9\u05d3',
    status_changed: '\u05e9\u05d9\u05e0\u05d4 \u05e1\u05d8\u05d0\u05d8\u05d5\u05e1',
  }

  const isSuperAdmin = profile.role === 'super_admin'

  return (
    <div className="flex flex-col min-h-full">
      <Header profile={profile} title="\u05dc\u05d5\u05d7 \u05d1\u05e7\u05e8\u05d4" />

      <div className="flex-1 p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">שלום, {profile.full_name.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {profile.company?.name ?? (isSuperAdmin ? 'Super Admin — LeadCRM' : 'LeadCRM')} &mdash;{' '}
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Super Admin - no company warning */}
        {isSuperAdmin && !companyId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">אתה Super Admin</p>
              <p className="text-sm text-amber-700">
                צור חברה ראשונה בפאנל{' '}
                <a href="/admin/companies" className="underline font-medium">ניהול חברות</a>
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '\u05e1\u05d4"\u05db \u05dc\u05d9\u05d3\u05d9\u05dd', value: '\u2014', icon: Users, color: 'blue', sub: '\u05de\u05d4\u05d2\u05d9\u05dc\u05d9\u05d5\u05df' },
            { label: '\u05dc\u05d9\u05d3\u05d9\u05dd \u05d7\u05d3\u05e9\u05d9\u05dd \u05d4\u05d9\u05d5\u05dd', value: '\u2014', icon: TrendingUp, color: 'green', sub: '+0 \u05de\u05d0\u05ea\u05de\u05d5\u05dc' },
            { label: '\u05e2\u05e1\u05e7\u05d0\u05d5\u05ea \u05e1\u05d2\u05d5\u05e8\u05d5\u05ea', value: '\u2014', icon: CheckCircle, color: 'purple', sub: '\u05e1\u05d4"\u05db' },
            { label: '\u05d7\u05d1\u05e8\u05d9 \u05e6\u05d5\u05d5\u05ea', value: String(teamMembers?.length ?? 0), icon: PhoneCall, color: 'orange', sub: '\u05e4\u05e2\u05d9\u05dc\u05d9\u05dd' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <Card key={label} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl bg-${color}-500`} />
              <div className="pl-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500">{label}</span>
                  <div className={`w-9 h-9 bg-${color}-50 rounded-xl flex items-center justify-center`}>
                    <Icon size={17} className={`text-${color}-600`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-800">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader title="\u05d7\u05dc\u05d5\u05e7\u05ea \u05dc\u05d9\u05d3\u05d9\u05dd \u05dc\u05e4\u05d9 \u05e1\u05d8\u05d0\u05d8\u05d5\u05e1" subtitle="\u05de\u05ea\u05e2\u05d3\u05db\u05df \u05d1\u05d6\u05de\u05df \u05d0\u05de\u05ea" />
            {statuses && statuses.length > 0 ? (
              <div className="space-y-3">
                {statuses.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700">{s.label}</span>
                        <span className="text-xs text-slate-400">—</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '0%', background: s.color }} />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 mt-2 text-center">חבר את גיליון ה-Google Sheets לצפייה בסטטיסטיקה חיה</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-slate-400 text-sm">אין נתונים עדיין</p>
                <a href="/settings" className="mt-3 text-xs text-blue-600 hover:underline">צור חברה וחבר גיליון</a>
              </div>
            )}
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader title="\u05e4\u05e2\u05d9\u05dc\u05d5\u05ea \u05d0\u05d7\u05e8\u05d5\u05e0\u05d4" />
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((log: { id: string; action: string; created_at: string; profile?: { full_name: string } }) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{log.profile?.full_name ?? '\u05de\u05e9\u05ea\u05de\u05e9'}</span>{' '}
                        {actionLabels[log.action] ?? log.action}
                      </p>
                      <p className="text-xs text-slate-400">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">אין פעילות עדיין</p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/leads', label: '\u05e2\u05d1\u05d5\u05e8 \u05dc\u05dc\u05d9\u05d3\u05d9\u05dd', desc: '\u05e6\u05e4\u05d9\u05d9\u05d4 \u05d5\u05e2\u05d3\u05db\u05d5\u05df \u05dc\u05d9\u05d3\u05d9\u05dd', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { href: '/reports', label: '\u05d3\u05d5\u05d7\u05d5\u05ea \u05d5\u05e1\u05d8\u05d8\u05d9\u05e1\u05d8\u05d9\u05e7\u05d4', desc: '\u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05d5\u05de\u05d3\u05d3\u05d9\u05dd', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            { href: isSuperAdmin ? '/admin/companies' : '/settings', label: isSuperAdmin ? '\u05e0\u05d9\u05d4\u05d5\u05dc \u05d7\u05d1\u05e8\u05d5\u05ea' : '\u05d4\u05d2\u05d3\u05e8\u05d5\u05ea \u05d7\u05d1\u05e8\u05d4', desc: isSuperAdmin ? '\u05e6\u05d5\u05e8 \u05d5\u05e0\u05d4\u05dc \u05d7\u05d1\u05e8\u05d5\u05ea' : '\u05d7\u05d9\u05d1\u05d5\u05e8 \u05d2\u05d9\u05dc\u05d9\u05d5\u05df \u05d5\u05e0\u05d9\u05d4\u05d5\u05dc \u05d4\u05d2\u05d3\u05e8\u05d5\u05ea', color: 'bg-green-50 text-green-700 border-green-100' },
          ].map(({ href, label, desc, color }) => (
            <a key={href} href={href} className={`block p-4 rounded-xl border ${color} hover:shadow-sm transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{desc}</div>
                </div>
                <ArrowUpRight size={16} className="opacity-50" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
