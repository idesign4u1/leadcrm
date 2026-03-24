import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getSpreadsheetData,
  getSpreadsheetHeaders,
  appendRow,
} from '@/lib/google-sheets/client'
import type { Lead } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, company:companies(*)')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const companyId = profile.role === 'super_admin'
      ? request.nextUrl.searchParams.get('company_id')
      : profile.company_id

    if (!companyId) return NextResponse.json({ data: [], headers: [] })

    const { data: sheetConn } = await supabase
      .from('sheet_connections')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single()

    if (!sheetConn) return NextResponse.json({ data: [], headers: [], noSheet: true })

    const [headers, rows] = await Promise.all([
      getSpreadsheetHeaders(sheetConn.spreadsheet_id, sheetConn.sheet_name),
      getSpreadsheetData(sheetConn.spreadsheet_id, sheetConn.sheet_name),
    ])

    const leads: Lead[] = rows.map((row, idx) => {
      const lead: Lead = { _rowIndex: idx, _rowNumber: idx + 2 }
      headers.forEach((header, colIdx) => {
        lead[header] = row[colIdx] ?? ''
      })
      return lead
    })

    // Filter for sales reps - only assigned leads
    const search = request.nextUrl.searchParams.get('search') ?? ''
    const statusFilter = request.nextUrl.searchParams.get('status') ?? ''
    const repFilter = request.nextUrl.searchParams.get('assigned_rep') ?? ''

    let filtered = leads

    if (profile.role === 'sales_rep' && sheetConn.assigned_rep_column) {
      filtered = filtered.filter(l => l[sheetConn.assigned_rep_column!] === profile.full_name)
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(l =>
        Object.values(l).some(v => String(v).toLowerCase().includes(q))
      )
    }

    if (statusFilter && sheetConn.status_column) {
      filtered = filtered.filter(l => l[sheetConn.status_column!] === statusFilter)
    }

    if (repFilter && sheetConn.assigned_rep_column) {
      filtered = filtered.filter(l => l[sheetConn.assigned_rep_column!] === repFilter)
    }

    return NextResponse.json({
      data: filtered,
      headers,
      total: leads.length,
      sheetConnection: {
        status_column: sheetConn.status_column,
        name_column: sheetConn.name_column,
        phone_column: sheetConn.phone_column,
        email_column: sheetConn.email_column,
        notes_column: sheetConn.notes_column,
        assigned_rep_column: sheetConn.assigned_rep_column,
      },
    })
  } catch (err) {
    console.error('[leads GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { values } = body

    const { data: sheetConn } = await supabase
      .from('sheet_connections')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single()

    if (!sheetConn) return NextResponse.json({ error: 'No sheet connected' }, { status: 400 })

    const rowNum = await appendRow(sheetConn.spreadsheet_id, sheetConn.sheet_name, values)

    // Log activity
    await supabase.from('activity_logs').insert({
      company_id: profile.company_id,
      user_id: user.id,
      action: 'lead_created',
      entity_type: 'lead',
      entity_id: String(rowNum),
      details: { values },
    })

    return NextResponse.json({ success: true, rowNumber: rowNum })
  } catch (err) {
    console.error('[leads POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
