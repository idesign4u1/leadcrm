'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Building2, Users, Link, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Company {
  id: string
  name: string
  slug: string
  primary_color: string
  is_active: boolean
  created_at: string
  profiles: Array<{ count: number }>
  sheet_connections: Array<{ spreadsheet_id: string; last_synced_at: string }>
}

export default function AdminCompaniesClient({ companies: initial }: { companies: Company[] }) {
  const [companies, setCompanies] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', primary_color: '#3B82F6' })
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCompanies(c => [data.data, ...c])
      setShowAdd(false)
      setForm({ name: '', primary_color: '#3B82F6' })
      toast.success('חברה נוצרה בהצלחה')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">חברות</h2>
          <p className="text-sm text-slate-500">{companies.length} חברות במערכת</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={15} /> חברה חדשה
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(c => {
          const userCount = c.profiles?.[0]?.count ?? 0
          const hasSheet = c.sheet_connections?.length > 0

          return (
            <Card key={c.id} padding={false} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-1.5" style={{ background: c.primary_color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: c.primary_color }}>
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.slug}</div>
                    </div>
                  </div>
                  {c.is_active ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full" title="פעיל" />
                  ) : (
                    <span className="w-2 h-2 bg-slate-300 rounded-full" title="לא פעיל" />
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {userCount} משתמשים
                  </span>
                  <span className="flex items-center gap-1">
                    {hasSheet ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-slate-400" />}
                    {hasSheet ? 'Sheets מחובר' : 'אין חיבור'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  נוצר: {formatDate(c.created_at)}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {showAdd && (
        <Modal open title="חברה חדשה" onClose={() => setShowAdd(false)} footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>בטל</Button>
            <Button form="add-company" type="submit" loading={saving}>צור חברה</Button>
          </>
        }>
          <form id="add-company" onSubmit={handleCreate} className="space-y-4">
            <Input label="שם החברה" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="חברת XYZ" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">צבע ראשי</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <Input value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="font-mono" />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
