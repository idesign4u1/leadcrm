'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, CheckCircle, XCircle, Users, Link, Settings } from 'lucide-react'
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
  const [sheetModal, setSheetModal] = useState<Company | null>(null)
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
              <div className="h-1.5" style={{ background: c.primary_color || '#3B82F6' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: c.primary_color || '#3B82F6' }}
                    >
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.slug || c.id.slice(0, 8)}</div>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full mt-1 ${c.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {userCount} משתמשים
                  </span>
                  <span className="flex items-center gap-1">
                    {hasSheet
                      ? <><CheckCircle size={12} className="text-green-500" /> Sheets מחובר</>
                      : <><XCircle size={12} className="text-slate-400" /> אין חיבור</>}
                  </span>
                </div>

                {/* Connect Sheet Button */}
                <button
                  onClick={() => setSheetModal(c)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-xs font-medium"
                >
                  <Link size={13} />
                  {hasSheet ? 'ערוך חיבור Sheets' : 'חבר Google Sheets'}
                </button>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  נוצר: {formatDate(c.created_at)}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Company Modal */}
      {showAdd && (
        <Modal open title="חברה חדשה" onClose={() => setShowAdd(false)} footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>בטל</Button>
            <Button form="add-company" type="submit" loading={saving}>צור חברה</Button>
          </>
        }>
          <form id="add-company" onSubmit={handleCreate} className="space-y-4">
            <Input
              label="שם החברה"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="חברת XYZ"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">צבע ראשי</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <Input
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Connect Sheet Modal */}
      {sheetModal && (
        <ConnectSheetModal
          company={sheetModal}
          onClose={() => setSheetModal(null)}
          onConnected={() => {
            toast.success('גיליון חובר בהצלחה!')
            setSheetModal(null)
          }}
        />
      )}
    </div>
  )
}

function ConnectSheetModal({
  company, onClose, onConnected
}: {
  company: Company
  onClose: () => void
  onConnected: () => void
}) {
  const [step, setStep] = useState<'info' | 'mapping'>('info')
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheetName, setSheetName] = useState('Sheet1')
  const [sheets, setSheets] = useState<string[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [mapping, setMapping] = useState({
    status_column: '', name_column: '', phone_column: '',
    email_column: '', notes_column: '', assigned_rep_column: ''
  })

  async function fetchHeaders() {
    if (!spreadsheetId.trim()) { toast.error('הכנס Spreadsheet ID'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/sheets/headers?spreadsheet_id=${encodeURIComponent(spreadsheetId)}&sheet_name=${encodeURIComponent(sheetName)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setHeaders(data.headers)
      setSheets(data.sheets ?? [])
      setStep('mapping')
      toast.success(`נמצאו ${data.headers.length} עמודות`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setLoading(false) }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch('/api/sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
          ...mapping
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onConnected()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setLoading(false) }
  }

  const fieldOptions = [
    { value: '', label: '-- לא מוסריר --' },
    ...headers.map(h => ({ value: h, label: h }))
  ]

  return (
    <Modal
      open
      size="lg"
      title={`חיבור Google Sheets ל-${company.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>בטל</Button>
          {step === 'mapping'
            ? <Button onClick={handleSave} loading={loading}>שמור חיבור</Button>
            : <Button onClick={fetchHeaders} loading={loading}>טען גיליון</Button>
          }
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          וודא ששיתפת את הגיליון עם: <strong>{process.env.NEXT_PUBLIC_APP_URL ?? 'Service Account Email'}</strong>
        </div>

        <Input
          label="Spreadsheet ID"
          value={spreadsheetId}
          onChange={e => setSpreadsheetId(e.target.value)}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">שם הטאב</label>
          {sheets.length > 0 ? (
            <select
              value={sheetName}
              onChange={e => setSheetName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <Input value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="Sheet1" />
          )}
        </div>

        {step === 'mapping' && headers.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">מיפוי עמודות</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name_column', label: 'שם ליד' },
                { key: 'phone_column', label: 'טלפון' },
                { key: 'email_column', label: 'אימייל' },
                { key: 'status_column', label: 'סטאטוס' },
                { key: 'notes_column', label: 'הערות' },
                { key: 'assigned_rep_column', label: 'נציג משוייך' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <select
                    value={mapping[key as keyof typeof mapping]}
                    onChange={e => setMapping(m => ({ ...m, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fieldOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
