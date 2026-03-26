'use client'

import { useState, useEffect } from 'react'
import type { Profile, SheetConnection, StatusConfig, WebhookToken, CustomColumn } from '@/types'
import { Card, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { Link, Users, CheckCircle, Plus, Trash2, Zap, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  profile: Profile
  sheetConnection: SheetConnection | null
  statuses: StatusConfig[]
  teamMembers: Array<{
    id: string; full_name: string; email: string;
    role: string; is_active: boolean; phone?: string
  }>
}

export default function SettingsClient({ profile, sheetConnection, statuses, teamMembers }: Props) {
  const [activeTab, setActiveTab] = useState<'sheet' | 'statuses' | 'team' | 'webhook' | 'columns'>('sheet')
  const canManage = ['company_admin', 'super_admin'].includes(profile.role)

  const tabs = [
    { id: 'sheet' as const, label: 'חיבור Google Sheets', icon: Link },
    { id: 'statuses' as const, label: 'סטאטוסים', icon: CheckCircle },
    { id: 'team' as const, label: 'צוות', icon: Users },
    { id: 'webhook' as const, label: 'Webhook', icon: Zap },
    { id: 'columns' as const, label: 'עמודות מותאמות', icon: Copy },
  ]

  return (
    <div className="flex-1 p-6 max-w-3xl">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sheet' && (
        <SheetTab sheetConnection={sheetConnection} canManage={canManage} />
      )}
      {activeTab === 'statuses' && (
        <StatusesTab statuses={statuses} companyId={profile.company_id!} canManage={canManage} />
      )}
      {activeTab === 'team' && (
        <TeamTab teamMembers={teamMembers} profile={profile} canManage={canManage} />
      )}
      {activeTab === 'webhook' && (
        <WebhookTab canManage={canManage} />
      )}
      {activeTab === 'columns' && (
        <ColumnsTab canManage={canManage} />
      )}
    </div>
  )
}

// ---- Sheet Connection Tab ----
function SheetTab({ sheetConnection, canManage }: { sheetConnection: SheetConnection | null; canManage: boolean }) {
  const [step, setStep] = useState<'info' | 'mapping'>('info')
  const [spreadsheetId, setSpreadsheetId] = useState(sheetConnection?.spreadsheet_id ?? '')
  const [sheetName, setSheetName] = useState(sheetConnection?.sheet_name ?? 'Sheet1')
  const [sheets, setSheets] = useState<string[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [spreadsheetName, setSpreadsheetName] = useState(sheetConnection?.spreadsheet_name ?? '')
  const [mapping, setMapping] = useState({
    status_column: sheetConnection?.status_column ?? '',
    name_column: sheetConnection?.name_column ?? '',
    phone_column: sheetConnection?.phone_column ?? '',
    email_column: sheetConnection?.email_column ?? '',
    notes_column: sheetConnection?.notes_column ?? '',
    assigned_rep_column: sheetConnection?.assigned_rep_column ?? '',
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
      setSpreadsheetName(data.spreadsheetName ?? '')
      setStep('mapping')
      toast.success(`גיליון נמצא: "${data.spreadsheetName}". ${data.headers.length} עמודות.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch('/api/sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheet_id: spreadsheetId, sheet_name: sheetName, ...mapping }),
      })
      if (!res.ok) throw new Error()
      toast.success('גיליון חובר בהצלחה')
    } catch { toast.error('שגיאה בשמירת החיבור') } finally { setLoading(false) }
  }

  const fieldOptions = [{ value: '', label: '-- לא מוסריר --' }, ...headers.map(h => ({ value: h, label: h }))]

  return (
    <div className="space-y-5">
      {sheetConnection && (
        <Card className="border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">גיליון מחובר</p>
              <p className="text-xs text-green-600 mt-0.5">{sheetConnection.spreadsheet_name ?? sheetConnection.spreadsheet_id}</p>
              <p className="text-xs text-green-500 mt-0.5">טאב: {sheetConnection.sheet_name} &bull; {sheetConnection.headers.length} עמודות</p>
            </div>
          </div>
        </Card>
      )}

      {canManage && (
        <Card>
          <CardHeader title="חיבור Google Sheets" subtitle="הזן את מזהה הגיליון (Spreadsheet ID) והגדר את העמודות" />

          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <strong>הוראות:</strong> וודא שהשירות אקאונט (<code>{process.env.NEXT_PUBLIC_APP_URL ?? 'your-service-account'}@...</code>) הוסף כעורך לגיליון.
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
                <Input
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  placeholder="Sheet1"
                />
              )}
            </div>

            <Button onClick={fetchHeaders} loading={loading}>
              טען הגדרות
            </Button>
          </div>

          {step === 'mapping' && headers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">מיפוי עמודות (אופציונלי)</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'status_column', label: 'סטאטוס' },
                  { key: 'name_column', label: 'שם' },
                  { key: 'phone_column', label: 'טלפון' },
                  { key: 'email_column', label: 'אימייל' },
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
              <Button onClick={handleSave} loading={loading}>
                שמור חיבור
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// ---- Statuses Tab ----
function StatusesTab({ statuses, companyId, canManage }: { statuses: StatusConfig[]; companyId: string; canManage: boolean }) {
  return (
    <Card>
      <CardHeader title="סטאטוסים" subtitle="סטאטוסים שיקנו לידים" />
      <div className="space-y-2">
        {statuses.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <Badge label={s.label} color={s.color} />
            <span className="text-xs text-slate-400 font-mono">{s.name}</span>
            <span className="ml-auto text-xs text-slate-400">סדר: {s.sort_order}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">לעריכת סטאטוסים פנה לתמיכת המערכת.</p>
    </Card>
  )
}

// ---- Team Tab ----
function TeamTab({
  teamMembers, profile, canManage
}: {
  teamMembers: Array<{ id: string; full_name: string; email: string; role: string; is_active: boolean }>
  profile: Profile
  canManage: boolean
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', role: 'sales_rep', phone: '' })
  const [saving, setSaving] = useState(false)

  const roleLabels: Record<string, string> = {
    super_admin: 'סופר אדמין',
    company_admin: 'מנהל חברה',
    sales_rep: 'נציג מכירות',
  }

  async function handleAddUser(e: React.FormEvent) {
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
      toast.success('משתמש נוסף בהצלחה. נשלחה הזמנה לאימייל.')
      setShowAdd(false)
      setForm({ full_name: '', email: '', role: 'sales_rep', phone: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  return (
    <Card>
      <CardHeader
        title="חברי צוות"
        action={canManage && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> הוסף משתמש
          </Button>
        )}
      />
      <div className="space-y-2">
        {teamMembers.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {m.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800">{m.full_name}</div>
              <div className="text-xs text-slate-400">{m.email}</div>
            </div>
            <span className="ml-auto text-xs px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full">{roleLabels[m.role] ?? m.role}</span>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal open title="הוסף משתמש" onClose={() => setShowAdd(false)} footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>בטל</Button>
            <Button form="add-user-form" type="submit" loading={saving}>הוסף</Button>
          </>
        }>
          <form id="add-user-form" onSubmit={handleAddUser} className="space-y-4">
            <Input label="שם מלא" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <Input label="אימייל" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="טלפון" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">תפקיד</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sales_rep">נציג מכירות</option>
                <option value="company_admin">מנהל חברה</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  )
}

// ---- Webhook Tab ----
function WebhookTab({ canManage }: { canManage: boolean }) {
  const [tokens, setTokens] = useState<Array<{ id: string; token: string; label: string; is_active: boolean; created_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newLabel, setNewLabel] = useState('Webhook')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/webhook/tokens')
      .then(r => r.json())
      .then(d => setTokens(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateToken() {
    setCreating(true)
    try {
      const res = await fetch('/api/webhook/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTokens(ts => [data.data, ...ts])
      toast.success('Webhook Token נוצר')
      setShowCreateModal(false)
      setNewLabel('Webhook')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setCreating(false) }
  }

  return (
    <Card>
      <CardHeader
        title="Webhook Tokens"
        subtitle="שמור את הטוקנים בצד ולהשתמש ב- URL לעיל לשליחת לידים"
        action={canManage && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> יצור Token
          </Button>
        )}
      />
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-slate-400 text-sm">טוען...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">אין Webhook Tokens</div>
        ) : (
          tokens.map(token => (
            <WebhookTokenItem key={token.id} token={token} />
          ))
        )}
      </div>

      {showCreateModal && canManage && (
        <Modal open title="יצור Webhook Token" onClose={() => setShowCreateModal(false)} footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>בטל</Button>
            <Button onClick={handleCreateToken} loading={creating}>צור</Button>
          </>
        }>
          <div className="space-y-4">
            <Input
              label="תווית (שם)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="לדוגמה: Facebook Ads"
            />
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <p className="font-medium mb-1">JSON payload לשליחה:</p>
              <pre className="bg-white p-2 rounded text-xs overflow-auto border border-blue-200">{JSON.stringify({
                name: 'ראובן בן דוד',
                phone: '+972501234567',
                email: 'lead@example.com',
                campaign: 'Facebook',
                notes: 'פנה דרך המודעה',
                status: 'new',
                custom_fields: { field1: 'value1' }
              }, null, 2)}</pre>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  )
}

function WebhookTokenItem({ token }: { token: any }) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/${token.token}`

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{token.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">נוצר: {new Date(token.created_at).toLocaleDateString('he-IL')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-600 overflow-auto">
          {url}
        </code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url)
            toast.success('הועתק!')
          }}
          className="p-2 hover:bg-white rounded-lg text-slate-400 transition-colors"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  )
}

// ---- Columns Tab ----
function ColumnsTab({ canManage }: { canManage: boolean }) {
  const [columns, setColumns] = useState<CustomColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newColumn, setNewColumn] = useState({ label: '', field_type: 'text' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/columns')
      .then(r => r.json())
      .then(d => setColumns(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateColumn() {
    setSaving(true)
    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColumn),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setColumns(cs => [data.data, ...cs])
      toast.success('עמודה נוצרה')
      setShowAddModal(false)
      setNewColumn({ label: '', field_type: 'text' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally { setSaving(false) }
  }

  async function handleDeleteColumn(id: string) {
    if (!confirm('למחוק את העמודה?')) return
    try {
      const res = await fetch(`/api/columns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setColumns(cs => cs.filter(c => c.id !== id))
      toast.success('עמודה נמחקה')
    } catch { toast.error('שגיאה במחיקה') }
  }

  return (
    <Card>
      <CardHeader
        title="עמודות מותאמות"
        subtitle="הוסף עמודות נוספות ללידים"
        action={canManage && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> הוסף עמודה
          </Button>
        )}
      />
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-6 text-slate-400 text-sm">טוען...</div>
        ) : columns.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">אין עמודות מותאמות</div>
        ) : (
          columns.map(col => (
            <div key={col.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">{col.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">סוג: {col.field_type}</p>
              </div>
              {canManage && (
                <button
                  onClick={() => handleDeleteColumn(col.id)}
                  className="p-2 hover:bg-white rounded-lg text-slate-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && canManage && (
        <Modal open title="הוסף עמודה" onClose={() => setShowAddModal(false)} footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>בטל</Button>
            <Button onClick={handleCreateColumn} loading={saving}>צור</Button>
          </>
        }>
          <div className="space-y-4">
            <Input
              label="שם העמודה"
              value={newColumn.label}
              onChange={e => setNewColumn(c => ({ ...c, label: e.target.value }))}
              placeholder="לדוגמה: מוצר מעניין"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">סוג הנתון</label>
              <select
                value={newColumn.field_type}
                onChange={e => setNewColumn(c => ({ ...c, field_type: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">טקסט</option>
                <option value="number">מספר</option>
                <option value="date">תאריך</option>
                <option value="select">בחירה</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  )
}
