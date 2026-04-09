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

    // Debug env vars
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const key = process.env.GOOGLE_PRIVATE_KEY

    console.log('=== SHEETS DEBUG ===')
    console.log('Email:', email)
    console.log('Key exists:', !!key)
    console.log('Key starts with:', key?.slice(0, 40))
    console.log('Spreadsheet ID:', spreadsheetId)
    console.log('Sheet Name:', sheetName)
    console.log('===================')

    if (!email || !key) {
      return NextResponse.json({
        error: `Missing env vars: ${!email ? 'GOOGLE_SERVICE_ACCOUNT_EMAIL ' : ''}${!key ? 'GOOGLE_PRIVATE_KEY' : ''}`
      }, { status: 500 })
    }

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
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sheets/headers error]', message)
    return NextResponse.json({
      error: message
    }, { status: 500 })
  }
}
