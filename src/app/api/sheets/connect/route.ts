import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSpreadsheetHeaders, getSpreadsheetInfo } from '@/lib/google-sheets/client'

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

    if (!['company_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      company_id,
      spreadsheet_id,
      sheet_name,
      status_column,
      name_column,
      phone_column,
      email_column,
      notes_column,
      assigned_rep_column,
    } = body

    const targetCompanyId = profile.role === 'super_admin' ? company_id : profile.company_id

    const [headers, info] = await Promise.all([
      getSpreadsheetHeaders(spreadsheet_id, sheet_name),
      getSpreadsheetInfo(spreadsheet_id),
    ])

    const { error } = await supabase
      .from('sheet_connections')
      .upsert({
        company_id: targetCompanyId,
        spreadsheet_id,
        sheet_name: sheet_name ?? 'Sheet1',
        spreadsheet_name: info.properties?.title,
        status_column,
        name_column,
        phone_column,
        email_column,
        notes_column,
        assigned_rep_column,
        headers,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'company_id' })

    if (error) throw error

    return NextResponse.json({ success: true, headers, spreadsheetName: info.properties?.title })
  } catch (err) {
    console.error('[sheets connect]', err)
    return NextResponse.json({ error: 'Failed to connect sheet' }, { status: 500 })
  }
}
