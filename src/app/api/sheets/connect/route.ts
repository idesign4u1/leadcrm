import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSpreadsheetHeaders, getSpreadsheetInfo } from '@/lib/google-sheets/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    console.log('=== CONNECT SHEET ===' , body)

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    console.log('Profile for connect:', profile)

    const targetCompanyId = profile?.role === 'super_admin' && company_id
      ? company_id
      : profile?.company_id

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'No company ID found' }, { status: 400 })
    }

    const [headers, info] = await Promise.all([
      getSpreadsheetHeaders(spreadsheet_id, sheet_name ?? 'Sheet1'),
      getSpreadsheetInfo(spreadsheet_id),
    ])

    console.log('Headers found:', headers.length)

    const { data, error } = await supabase
      .from('sheet_connections')
      .upsert({
        company_id: targetCompanyId,
        spreadsheet_id,
        sheet_name: sheet_name ?? 'Sheet1',
        spreadsheet_name: info.properties?.title,
        status_column: status_column || null,
        name_column: name_column || null,
        phone_column: phone_column || null,
        email_column: email_column || null,
        notes_column: notes_column || null,
        assigned_rep_column: assigned_rep_column || null,
        headers,
        last_synced_at: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'company_id' })
      .select()
      .single()

    console.log('Upsert result:', data)
    console.log('Upsert error:', error)

    if (error) {
      return NextResponse.json({ error: 'DB Error: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, headers, spreadsheetName: info.properties?.title })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sheets/connect error]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
