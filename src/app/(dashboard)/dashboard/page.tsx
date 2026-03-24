import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Users, TrendingUp, CheckCircle, PhoneCall, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

  const { data: statuses } = await supabase
    .from('status_configs')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .order('sort_order')

  const { data: recentActivity } = await supabase
    .from('activity_logs')
    .select('*, profile:profiles(full_name)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)

  const actionLabels: Record<string, string> = {
    lead_created: 'יצר ליד חדש',
    lead_updated: 'עדכן ליד',
    status_changed: 'שינה סטאטוס',
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header profile={profile} title="לוח בקרה" />

      <div className="flex-1 p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">שלום, {profile.full_name.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {profile.company?.name ?? 'LeadCRM'} &mdash; {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'סה"כ לידים', value: '—', icon: Users, color: 'blue', sub: 'מהגיליון' },
            { label: 'לידים חדשים היום', value: '—', icon: TrendingUp, color: 'green', sub: '+0 מאתמול' },
            { label: 'עסקאות סגורות', value: '—', icon: CheckCircle, color: 'purple', sub: 'סה"כ' },
            { label: 'חברי צוות', value: String(teamMembers?.length ?? 0), icon: PhoneCall, color: 'orange', sub: 'פעילים' },
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
            <CardHeader title="חלוקת לידים לפי סטאטוס" subtitle="מתעדכן בזמן אמת" />
            <div className="space-y-3">
              {statuses?.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{s.label}</span>
                      <span className="text-xs text-slate-400">—</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: '0%', background: s.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">חבר את גיליון ה-Google Sheets לצפייה בסטטיסטיקה חיה</p>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader title="פעילות אחרונה" />
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map(log => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{log.profile?.full_name ?? 'משתמש'}</span>{' '}
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
            { href: '/leads', label: 'עבור ללידים', desc: 'צפייה ועדכון לידים', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { href: '/reports', label: 'דוחות וסטטיסטיקה', desc: 'נתונים ומדדים', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            { href: '/settings', label: 'הגדרות חברה', desc: 'חיבור גיליון וניהול הגדרות', color: 'bg-green-50 text-green-700 border-green-100' },
          ].map(({ href, label, desc, color }) => (
            <a
              key={href}
              href={href}
              className={`block p-4 rounded-xl border ${color} hover:shadow-sm transition-all`}
            >
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
