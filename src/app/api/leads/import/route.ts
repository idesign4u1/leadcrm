import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSpreadsheetData, getSpreadsheetHeaders } from '@/lib/google-sheets/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { spreadsheet_id, sheet_name, mapping } = body
    // mapping: { name: 'עמודה א', phone: 'עמודה ב', ... }

    const [headers, rows] = await Promise.all([
      getSpreadsheetHeaders(spreadsheet_id, sheet_name),
      getSpreadsheetData(spreadsheet_id, sheet_name),
    ])

    if (!rows.length) return NextResponse.json({ imported: 0 })

    const leads = rows
      .filter(row => row.some(cell => cell?.trim()))
      .map(row => {
        const rowObj: Record<string, string> = {}
        headers.forEach((h, i) => { rowObj[h] = row[i] ?? '' })

        return {
          company_id: profile?.company_id,
          name: mapping?.name ? rowObj[mapping.name] : '',
          phone: mapping?.phone ? rowObj[mapping.phone] : '',
          email: mapping?.email ? rowObj[mapping.email] : '',
          campaign: mapping?.campaign ? rowObj[mapping.campaign] : '',
          notes: mapping?.notes ? rowObj[mapping.notes] : '',
          status: mapping?.status ? rowObj[mapping.status] : 'new',
          custom_fields: rowObj,
          source: 'import',
          date: new Date().toISOString(),
        }
      })

    const { data, error } = await supabase
      .from('leads')
      .insert(leads)
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ imported: data?.length ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
