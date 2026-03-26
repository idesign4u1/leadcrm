'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Profile, StatusConfig, SheetConnection, Lead } from '@/types'
import { Search, Plus, RefreshCw, Phone, Mail, MessageSquare, ChevronDown, X, Filter, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Props {
  profile: Profile
  statuses: StatusConfig[]
  teamMembers: Array<{ id: string; full_name: string; role: string }>
  sheetConnection: SheetConnection | null
}

export default function LeadsPageClient({ profile, statuses, teamMembers, sheetConnection }: Props) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [repFilter, setRepFilter] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (repFilter) params.set('assigned_rep', repFilter)

      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        setLeads(data.data ?? [])
        setHeaders(data.headers ?? [])
      }
    } catch {
      toast.error('שגיאה בטעינת הלידים')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, repFilter, refreshKey])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function updateLeadStatus(lead: Lead, newStatus: string) {
    if (!sheetConnection?.status_column) return
    const colIndex = headers.indexOf(sheetConnection.status_column)
    if (colIndex === -1) return

    const colLetter = indexToLetter(colIndex)
    try {
      const res = await fetch(`/api/leads/${lead._rowNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [colLetter]: newStatus } }),
      })
      if (!res.ok) throw new Error()
      toast.success('סטאטוס עודכן')
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('שגיאה בעדכון סטאטוס')
    }
  }

  function indexToLetter(idx: number): string {
    let l = ''
    let i = idx
    while (i >= 0) {
      l = String.fromCharCode((i % 26) + 65) + l
      i = Math.floor(i / 26) - 1
    }
    return l
  }

  const statusMap = Object.fromEntries(statuses.map(s => [s.name, s]))
  const canAssign = ['company_admin', 'super_admin'].includes(profile.role)

  const displayHeaders = headers.filter(h => h && h.trim())

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש בלידים..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">כל הסטאטוסים</option>
            {statuses.map(s => <option key={s.id} value={s.name}>{s.label}</option>)}
          </select>

          {/* Rep filter */}
          {canAssign && teamMembers.length > 0 && (
            <select
              value={repFilter}
              onChange={e => setRepFilter(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">כל הנציגים</option>
              {teamMembers.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
            </select>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="רענן"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {sheetConnection && (
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <Plus size={15} />
                ליד חדש
              </Button>
            )}
          </div>
        </div>

        {/* Active filters */}
        {(statusFilter || repFilter || search) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-slate-500">סינון:</span>
            {search && (
              <button onClick={() => setSearch('')} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                "חיפוש: {search}" <X size={11} />
              </button>
            )}
            {statusFilter && (
              <button onClick={() => setStatusFilter('')} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                {statuses.find(s => s.name === statusFilter)?.label} <X size={11} />
              </button>
            )}
            {repFilter && (
              <button onClick={() => setRepFilter('')} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                {repFilter} <X size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!sheetConnection ? (
          <EmptyState
            title="לא חובר גיליון Google Sheets"
            description="עבור להגדרות וחבר את הגיליון של החברה"
            icon={<Search size={24} />}
            action={
              <a href="/settings" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                פתח הגדרות
              </a>
            }
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="לא נמצאו לידים"
            description="שנה את הסינון או הוסף ליד חדש"
            icon={<Users size={24} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
                  {displayHeaders.map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead, idx) => {
                  const statusVal = sheetConnection?.status_column ? String(lead[sheetConnection.status_column] ?? '') : ''
                  const statusDef = statusMap[statusVal]
                  const phone = sheetConnection?.phone_column ? String(lead[sheetConnection.phone_column] ?? '') : ''
                  const email = sheetConnection?.email_column ? String(lead[sheetConnection.email_column] ?? '') : ''

                  return (
                    <tr
                      key={lead._rowIndex}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      {displayHeaders.map(h => {
                        const val = String(lead[h] ?? '')
                        const isStatus = h === sheetConnection?.status_column

                        return (
                          <td key={h} className="px-4 py-3 max-w-[200px]">
                            {isStatus ? (
                              statusDef ? (
                                <Badge label={statusDef.label} color={statusDef.color} />
                              ) : val ? (
                                <span className="text-slate-600 text-xs">{val}</span>
                              ) : null
                            ) : (
                              <span className="text-slate-700 truncate block" title={val}>{val}</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="התקשר"
                            >
                              <Phone size={14} />
                            </a>
                          )}
                          {phone && (
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </a>
                          )}
                          {email && (
                            <a
                              href={`mailto:${email}`}
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="שלח מייל"
                            >
                              <Mail size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {leads.length > 0 && (
        <div className="px-6 py-3 bg-white border-t border-slate-200 text-xs text-slate-500">
          מוצגים <strong>{leads.length}</strong> לידים
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          headers={displayHeaders}
          statuses={statuses}
          teamMembers={teamMembers}
          sheetConnection={sheetConnection}
          profile={profile}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => { setSelectedLead(null); setRefreshKey(k => k + 1) }}
        />
      )}

      {/* Add Lead Modal */}
      {showAddModal && sheetConnection && (
        <AddLeadModal
          headers={displayHeaders}
          sheetConnection={sheetConnection}
          statuses={statuses}
          teamMembers={teamMembers}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); setRefreshKey(k => k + 1); toast.success('ליד נוסף בהצלחה') }}
        />
      )}
    </div>
  )
}

// ---- Inline sub-components ----

function LeadDetailPanel({
  lead, headers, statuses, teamMembers, sheetConnection, profile, onClose, onUpdate
}: {
  lead: Lead
  headers: string[]
  statuses: StatusConfig[]
  teamMembers: Array<{ id: string; full_name: string; role: string }>
  sheetConnection: SheetConnection | null
  profile: Profile
  onClose: () => void
  onUpdate: () => void
}) {
  const [notes, setNotes] = useState(sheetConnection?.notes_column ? String(lead[sheetConnection.notes_column] ?? '') : '')
  const [saving, setSaving] = useState(false)

  function indexToLetter(idx: number): string {
    let l = ''
    let i = idx
    while (i >= 0) { l = String.fromCharCode((i % 26) + 65) + l; i = Math.floor(i / 26) - 1 }
    return l
  }

  async function handleStatusChange(newStatus: string) {
    if (!sheetConnection?.status_column) return
    const colIdx = headers.indexOf(sheetConnection.status_column)
    if (colIdx === -1) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead._rowNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [indexToLetter(colIdx)]: newStatus } }),
      })
      if (!res.ok) throw new Error()
      toast.success('סטאטוס עודכן')
      onUpdate()
    } catch { toast.error('שגיאה') } finally { setSaving(false) }
  }

  async function handleRepChange(repName: string) {
    if (!sheetConnection?.assigned_rep_column) return
    const colIdx = headers.indexOf(sheetConnection.assigned_rep_column)
    if (colIdx === -1) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead._rowNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [indexToLetter(colIdx)]: repName } }),
      })
      if (!res.ok) throw new Error()
      toast.success('נציג שוייך')
      onUpdate()
    } catch { toast.error('שגיאה') } finally { setSaving(false) }
  }

  async function handleSaveNotes() {
    if (!sheetConnection?.notes_column) return
    const colIdx = headers.indexOf(sheetConnection.notes_column)
    if (colIdx === -1) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead._rowNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [indexToLetter(colIdx)]: notes } }),
      })
      if (!res.ok) throw new Error()
      toast.success('הערות נשמרו')
    } catch { toast.error('שגיאה') } finally { setSaving(false) }
  }

  const name = sheetConnection?.name_column ? String(lead[sheetConnection.name_column] ?? '') : `שורה ${lead._rowNumber}`
  const phone = sheetConnection?.phone_column ? String(lead[sheetConnection.phone_column] ?? '') : ''
  const email = sheetConnection?.email_column ? String(lead[sheetConnection.email_column] ?? '') : ''
  const currentStatus = sheetConnection?.status_column ? String(lead[sheetConnection.status_column] ?? '') : ''
  const currentRep = sheetConnection?.assigned_rep_column ? String(lead[sheetConnection.assigned_rep_column] ?? '') : ''
  const statusDef = statuses.find(s => s.name === currentStatus)
  const canAssign = ['company_admin', 'super_admin'].includes(profile.role)

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{name}</h2>
            <p className="text-xs text-slate-400">שורה {lead._rowNumber} בגיליון</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Quick actions */}
          <div className="flex gap-2">
            {phone && (
              <>
                <a href={`tel:${phone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
                  <Phone size={15} /> התקשר
                </a>
                <a href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">
                  <MessageSquare size={15} /> WhatsApp
                </a>
              </>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                <Mail size={15} /> מייל
              </a>
            )}
          </div>

          {/* Status */}
          {sheetConnection?.status_column && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">סטאטוס</label>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleStatusChange(s.name)}
                    disabled={saving}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all',
                      currentStatus === s.name
                        ? 'border-current'
                        : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                    style={currentStatus === s.name ? { borderColor: s.color, background: s.color + '15', color: s.color } : {}}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assign Rep */}
          {canAssign && sheetConnection?.assigned_rep_column && teamMembers.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">שיוך נציג</label>
              <select
                value={currentRep}
                onChange={e => handleRepChange(e.target.value)}
                disabled={saving}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">לא משוייך</option>
                {teamMembers.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
              </select>
            </div>
          )}

          {/* All fields */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">פרטי הליד</label>
            <div className="space-y-2 bg-slate-50 rounded-xl p-3">
              {headers.map(h => {
                const val = String(lead[h] ?? '')
                if (!val) return null
                return (
                  <div key={h} className="flex items-start gap-2">
                    <span className="text-xs text-slate-400 min-w-[100px] pt-0.5">{h}:</span>
                    <span className="text-sm text-slate-700 break-all">{val}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          {sheetConnection?.notes_column && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">הערות</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="הוסף הערות..."
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <Button size="sm" onClick={handleSaveNotes} loading={saving} className="mt-2">
                שמור הערות
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddLeadModal({
  headers, sheetConnection, statuses, teamMembers, onClose, onCreated
}: {
  headers: string[]
  sheetConnection: SheetConnection
  statuses: StatusConfig[]
  teamMembers: Array<{ id: string; full_name: string; role: string }>
  onClose: () => void
  onCreated: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Build row array matching headers order
      const row = headers.map(h => values[h] ?? '')
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: row }),
      })
      if (!res.ok) throw new Error()
      onCreated()
    } catch { toast.error('שגיאה ביצירת הליד') } finally { setSaving(false) }
  }

  return (
    <Modal open title="הוסף ליד חדש" onClose={onClose} footer={
      <>
        <Button variant="secondary" onClick={onClose}>בטל</Button>
        <Button form="add-lead-form" type="submit" loading={saving}>הוסף ליד</Button>
      </>
    }>
      <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-3">
        {headers.map(h => {
          const isStatus = h === sheetConnection.status_column
          const isRep = h === sheetConnection.assigned_rep_column

          if (isStatus) return (
            <div key={h}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{h}</label>
              <select
                value={values[h] ?? ''}
                onChange={e => setValues(v => ({ ...v, [h]: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר סטאטוס</option>
                {statuses.map(s => <option key={s.id} value={s.name}>{s.label}</option>)}
              </select>
            </div>
          )

          if (isRep) return (
            <div key={h}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{h}</label>
              <select
                value={values[h] ?? ''}
                onChange={e => setValues(v => ({ ...v, [h]: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר נציג</option>
                {teamMembers.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
              </select>
            </div>
          )

          return (
            <div key={h}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{h}</label>
              <input
                type="text"
                value={values[h] ?? ''}
                onChange={e => setValues(v => ({ ...v, [h]: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )
        })}
      </form>
    </Modal>
  )
}
