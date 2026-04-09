'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StatusConfig, SheetConnection } from '@/types'
import { Card, CardHeader } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { BarChart2, TrendingUp, Users, Target } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  statuses: StatusConfig[]
  sheetConnection: SheetConnection | null
  teamMembers: Array<{ id: string; full_name: string; role: string }>
}

export default function ReportsClient({ statuses, sheetConnection, teamMembers }: Props) {
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])

  useEffect(() => {
    if (!sheetConnection) { setLoading(false); return }
    fetch('/api/leads?limit=5000')
      .then(r => r.json())
      .then(d => {
        setLeads(d.data ?? [])
        setHeaders(d.headers ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (!sheetConnection) return (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState title="אין גיליון מחובר" description="חבר גיליון בהגדרות כדי לראות דוחות" icon={<BarChart2 size={24} />} />
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  )

  // Compute stats
  const total = leads.length
  const statusCol = sheetConnection.status_column
  const repCol = sheetConnection.assigned_rep_column

  const byStat: Record<string, number> = {}
  const byRep: Record<string, number> = {}

  leads.forEach(lead => {
    const s = statusCol ? String(lead[statusCol] ?? '') : ''
    const r = repCol ? String(lead[repCol] ?? '') : ''
    if (s) byStat[s] = (byStat[s] ?? 0) + 1
    if (r) byRep[r] = (byRep[r] ?? 0) + 1
  })

  const closed = (statusCol ? leads.filter(l => l[statusCol] === 'closed').length : 0)
  const convRate = total > 0 ? Math.round((closed / total) * 100) : 0

  const pieData = statuses.map(s => ({ name: s.label, value: byStat[s.name] ?? 0, color: s.color }))
  const barData = Object.entries(byRep).map(([name, count]) => ({ name, count }))

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'סה"כ לידים', value: total, icon: Users, color: 'blue' },
          { label: 'סגורות', value: closed, icon: Target, color: 'green' },
          { label: 'אחוז המרה', value: `${convRate}%`, icon: TrendingUp, color: 'purple' },
          { label: 'נציגים פעילים', value: Object.keys(byRep).length, icon: BarChart2, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}-600`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie */}
        <Card>
          <CardHeader title="חלוקת לידים לפי סטאטוס" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} לידים`]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Rep Bar */}
        {barData.length > 0 && (
          <Card>
            <CardHeader title="לידים לפי נציג" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="לידים" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Status Table */}
      <Card>
        <CardHeader title="ביצוע לפי סטאטוס" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">סטאטוס</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">כמות</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">אחוז</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {statuses.map(s => {
                const count = byStat[s.name] ?? 0
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="py-3 px-3"><Badge label={s.label} color={s.color} /></td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700">{count}</td>
                    <td className="py-3 px-3 text-right text-slate-500">{pct}%</td>
                    <td className="py-3 px-3 w-32">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
