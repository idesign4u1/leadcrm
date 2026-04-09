'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Profile, StatusConfig, CustomColumn } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { Plus, Upload, Search, ChevronRight, X, Phone, Mail, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface Lead {
  id: string
  company_id: string
  date?: string
  name?: string
  phone?: string
  email?: string
  campaign?: string
  notes?: string
  status: string
  assigned_rep_id?: string
  assigned_rep_name?: string
  custom_fields: Record<string, unknown>
  source?: string
  created_at: string
  updated_at: string
}

interface Props {
  profile: Profile
  statuses: StatusConfig[]
  teamMembers: Array<{ id: string; full_name: string; role: string }>
}

export default function LeadsPageClient({ profile, statuses, teamMembers }: Props) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      setLeads(data.data ?? [])
    } catch { toast.error('שגיאה בטעינת לידים') } finally { setLoading(false) }
  }, [search, filterStatus])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    fetch('/api/columns')
      .then(r => r.json())
      .then(d => setCustomColumns(d.data ?? []))
      .catch(() => {})
  }, [])

  const statusMap = Object.fromEntries(statuses.map(s => [s.name, s]))

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 p-6 overflow-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון, אימייל..."
              className="w-full pr-9 pl-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">כל הסטאטוסים</option>
            {statuses.map(s => <option key={s.name} value={s.name}>{s.label}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
            <Upload size={14} /> ייבוא
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> ליד חדש
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs">
                <th className="text-right px-4 py-3 font-medium w-10">#</th>
                <th className="text-right px-4 py-3 font-medium">שם</th>
                <th className="text-right px-4 py-3 font-medium">טלפון</th>
                <th className="text-right px-4 py-3 font-medium">אימייל</th>
                <th className="text-right px-4 py-3 font-medium">קמפיין</th>
                <th className="text-right px-4 py-3 font-medium">סטאטוס</th>
                <th className="text-right px-4 py-3 font-medium">נציג</th>
                <th className="text-right px-4 py-3 font-medium">תאריך</th>
                {customColumns.map(col => (
                  <th key={col.id} className="text-right px-4 py-3 font-medium">{col.label}</th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9 + customColumns.length} className="text-center py-12 text-slate-400">טוען...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={9 + customColumns.length} className="text-center py-12 text-slate-400">אין לידים</td></tr>
              ) : leads.map((lead, i) => {
                const st = statusMap[lead.status]
                return (
                  <tr
                    key={lead.id}
                    className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{lead.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{lead.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{lead.email ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{lead.campaign ?? '—'}</td>
                    <td className="px-4 py-3">
                      {st ? <Badge label={st.label} color={st.color} /> : <span className="text-xs text-slate-400">{lead.status}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{lead.assigned_rep_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{lead.date ?? '—'}</td>
                    {customColumns.map(col => (
                      <td key={col.id} className="px-4 py-3 text-slate-600 text-xs">
                        {String(lead.custom_fields?.[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-slate-300" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel */}
      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          statuses={statuses}
          teamMembers={teamMembers}
          customColumns={customColumns}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updated) => {
            setLeads(ls => ls.map(l => l.id === updated.id ? updated : l))
            setSelectedLead(updated)
          }}
          onDelete={(id) => {
            setLeads(ls => ls.filter(l => l.id !== id))
            setSelectedLead(null)
          }}
        />
      )}

      {showAddModal && (
        <AddLeadModal
          statuses={statuses}
          teamMembers={teamMembers}
          customColumns={customColumns}
          onClose={() => setShowAddModal(false)}
          onCreated={(lead) => {
            setLeads(ls => [lead, ...ls])
            setShowAddModal(false)
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => { fetchLeads(); setShowImportModal(false) }}
        />
      )}
    </div>
  )
}

// ---- Lead Side Panel ----
function LeadPanel({
  lead, statuses, teamMembers, customColumns, onClose, onUpdate, onDelete
}: {
  lead: Lead
  statuses: StatusConfig[]
  teamMembers: Array<{ id: string; full_name: string; role: string }>
  customColumns: CustomColumn[]
  onClose: () => void
  onUpdate: (l: Lead) => void
  onDelete: (id: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    status: lead.status,
    assigned_rep_id: lead.assigned_rep_id ?? '',
    notes: lead.notes ?? '',
  })

  async function handleSave() {
    setSaving(true)
    try {
      const rep = teamMembers.find(m => m.id === form.assigned_rep_id)
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          assigned_rep_id: form.assigned_rep_id || null,
          assigned_rep_name: rep?.full_name ?? null,
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onUpdate(data.data)
      toast.success('נשמר')
    } catch { toast.error('שגיאה בשמירה') } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('למחוק את הליד?')) return
    try {
      await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
      onDelete(lead.id)
      toast.success('ליד נמחק')
    } catch { toast.error('שגיאה במחיקה') }
  }

  return (
    <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">{lead.name ?? 'ליד'}</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
          <X size={16} className="text-slate-400" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Info */}
        <div className="space-y-2 text-sm">
          {lead.phone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={13} className="text-slate-400" />
              <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={13} className="text-slate-400" />
              <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
            </div>
          )}
          {lead.date && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={13} className="text-slate-400" />
              {lead.date}
            </div>
          )}
          {lead.campaign && (
            <div className="text-slate-600">
              <span className="text-slate-400 text-xs">קמפיין: </span>
              {lead.campaign}
            </div>
          )}
          {lead.source && (
            <div className="text-slate-400 text-xs">
              מקור: {lead.source}
            </div>
          )}
        </div>

        {/* Custom fields */}
        {customColumns.length > 0 && Object.keys(lead.custom_fields ?? {}).length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            {customColumns.map(col => (
              <div key={col.id} className="flex justify-between text-xs">
                <span className="text-slate-500">{col.label}</span>
                <span className="text-slate-700">{String(lead.custom_fields?.[col.key] ?? '—')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Editable fields */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">סטאטוס</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map(s => <option key={s.name} value={s.name}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">נציג</label>
            <select
              value={form.assigned_rep_id}
              onChange={e => setForm(f => ({ ...f, assigned_rep_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— ללא נציג —</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">הערות</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 flex gap-2">
        <Button className="flex-1" size="sm" onClick={handleSave} loading={saving}>שמור</Button>
        <Button variant="secondary" size="sm" onClick={handleDelete}>מחק</Button>
      </div>
    </div>
  )
}

// ---- Add Lead Modal ----
function AddLeadModal({
  statuses, teamMembers, customColumns, onClose, onCreated
}: {
  statuses: StatusConfig[]
  teamMembers: Array<{ id: string; full_name: string; role: string }>
  customColumns: CustomColumn[]
  onClose: () => void
  onCreated: (l: Lead) => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: '', phone: '', email: '', campaign: '', notes: '',
    status: statuses[0]?.name ?? 'new',
    assigned_rep_id: '',
    custom_fields: {} as Record<string, string>,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const rep = teamMembers.find(m => m.id === form.assigned_rep_id)
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assigned_rep_name: rep?.full_name ?? null,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onCreated(data.data)
      toast.success('ליד נוצר')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  return (
    <Modal open title="ליד חדש" onClose={onClose} footer={
      <>
        <Button variant="secondary" onClick={onClose}>בטל</Button>
        <Button form="add-lead-form" type="submit" loading={saving}>צור ליד</Button>
      </>
    }>
      <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="תאריך" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Input label="שם" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="טלפון" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="אימייל" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="קמפיין" value={form.campaign} onChange={e => setForm(f => ({ ...f, campaign: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">סטאטוס</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {statuses.map(s => <option key={s.name} value={s.name}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">נציג</label>
            <select value={form.assigned_rep_id} onChange={e => setForm(f => ({ ...f, assigned_rep_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— ללא נציג —</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">הערות</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        {customColumns.map(col => (
          <Input
            key={col.id}
            label={col.label}
            type={col.field_type === 'number' ? 'number' : col.field_type === 'date' ? 'date' : 'text'}
            value={form.custom_fields[col.key] ?? ''}
            onChange={e => setForm(f => ({ ...f, custom_fields: { ...f.custom_fields, [col.key]: e.target.value } }))}
          />
        ))}
      </form>
    </Modal>
  )
}

// ---- Import Modal ----
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [step, setStep] = useState<'id' | 'map'>('id')
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheetName, setSheetName] = useState('Sheet1')
  const [headers, setHeaders] = useState<string[]>([])
  const [sheets, setSheets] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '', phone: '', email: '', campaign: '', notes: '', status: ''
  })
  const [loading, setLoading] = useState(false)

  async function fetchHeaders() {
    if (!spreadsheetId.trim()) { toast.error('הכנס מזהה גיליון'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/sheets/headers?spreadsheet_id=${encodeURIComponent(spreadsheetId)}&sheet_name=${encodeURIComponent(sheetName)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setHeaders(data.headers)
      setSheets(data.sheets ?? [])
      setStep('map')
      toast.success(`${data.headers.length} עמודות נמצאו`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setLoading(false) }
  }

  async function handleImport() {
    setLoading(true)
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheet_id: spreadsheetId, sheet_name: sheetName, mapping }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success(`${data.imported ?? 0} לידים יובאו`)
      onImported()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setLoading(false) }
  }

  const headerOptions = [{ value: '', label: '— לא למפות —' }, ...headers.map(h => ({ value: h, label: h }))]

  return (
    <Modal open title="ייבוא לידים מ-Google Sheets" onClose={onClose} footer={
      step === 'id'
        ? <><Button variant="secondary" onClick={onClose}>בטל</Button><Button onClick={fetchHeaders} loading={loading}>טען עמודות</Button></>
        : <><Button variant="secondary" onClick={() => setStep('id')}>חזור</Button><Button onClick={handleImport} loading={loading}>ייבא</Button></>
    }>
      {step === 'id' ? (
        <div className="space-y-4">
          <Input label="Spreadsheet ID" value={spreadsheetId} onChange={e => setSpreadsheetId(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
          <Input label="שם הטאב" value={sheetName} onChange={e => setSheetName(e.target.value)} />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">מפה עמודות מהגיליון לשדות הליד:</p>
          {[
            { key: 'name', label: 'שם' },
            { key: 'phone', label: 'טלפון' },
            { key: 'email', label: 'אימייל' },
            { key: 'campaign', label: 'קמפיין' },
            { key: 'notes', label: 'הערות' },
            { key: 'status', label: 'סטאטוס' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-20 text-right flex-shrink-0">{label}</span>
              <select
                value={mapping[key]}
                onChange={e => setMapping(m => ({ ...m, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {headerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
