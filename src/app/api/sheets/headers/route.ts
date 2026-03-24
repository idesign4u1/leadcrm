import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSpreadsheetHeaders, getSpreadsheetInfo } from '@/lib/google-sheets/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const spreadsheetId = request.nextUrl.searchParams.get('spreadsheet_id')
    const sheetName = request.nextUrl.searchParams.get('sheet_name') ?? 'Sheet1'

    if (!spreadsheetId) return NextResponse.json({ error: 'Missing spreadsheet_id' }, { status: 400 })

    const [headers, info] = await Promise.all([
      getSpreadsheetHeaders(spreadsheetId, sheetName),
      getSpreadsheetInfo(spreadsheetId),
    ])

    const sheets = info.sheets?.map(s => s.properties?.title ?? '') ?? []

    return NextResponse.json({
      headers,
      spreadsheetName: info.properties?.title,
      sheets,
    })
  } catch (err) {
    console.error('[sheets headers]', err)
    return NextResponse.json({ error: 'Failed to read sheet. Make sure the service account has access.' }, { status: 500 })
  }
}
