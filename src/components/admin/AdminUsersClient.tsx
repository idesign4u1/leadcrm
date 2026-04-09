'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface UserRow {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  company?: { name: string }
}

interface CompanyOption {
  id: string
  name: string
}

const roleLabels: Record<string, string> = {
  super_admin: 'סופר אדמין',
  company_admin: 'מנהל חברה',
  sales_rep: 'נציג מכירות',
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  company_admin: 'bg-blue-100 text-blue-700',
  sales_rep: 'bg-slate-100 text-slate-700',
}

export default function AdminUsersClient({ users: initial, companies }: { users: UserRow[]; companies: CompanyOption[] }) {
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', role: 'sales_rep', company_id: '', phone: '' })
  const [saving, setSaving] = useState(false)

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company?.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('משתמש נוסף. נשלח מייל הזמנה.')
      setShowAdd(false)
      setForm({ full_name: '', email: '', role: 'sales_rep', company_id: '', phone: '' })
      // Refresh the list
      const r2 = await fetch('/api/users')
      const d2 = await r2.json()
      setUsers(d2.data ?? [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">כל המשתמשים</h2>
          <p className="text-sm text-slate-500">{users.length} משתמשים במערכת</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={15} /> משתמש חדש</Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש משתמש..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">שם</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">חברה</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">תפקיד</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">סטאטוס</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">הצטרף</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{u.full_name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.company?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {roleLabels[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${u.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                    {u.is_active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal open title="הוסף משתמש" onClose={() => setShowAdd(false)} footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>בטל</Button>
            <Button form="add-user" type="submit" loading={saving}>הוסף משתמש</Button>
          </>
        }>
          <form id="add-user" onSubmit={handleCreate} className="space-y-4">
            <Input label="שם מלא" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <Input label="אימייל" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="טלפון" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">חברה</label>
              <select
                required
                value={form.company_id}
                onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר חברה</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">תפקיד</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sales_rep">נציג מכירות</option>
                <option value="company_admin">מנהל חברה</option>
                <option value="super_admin">סופר אדמין</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
