import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateCell } from '@/lib/google-sheets/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rowNumber: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: sheetConn } = await supabase
      .from('sheet_connections')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single()

    if (!sheetConn) return NextResponse.json({ error: 'No sheet connected' }, { status: 400 })

    const body = await request.json()
    const rowNumber = parseInt(params.rowNumber)

    // Update each field provided
    const updates = body.updates as Record<string, string> // { columnLetter: value }
    for (const [col, val] of Object.entries(updates)) {
      await updateCell(sheetConn.spreadsheet_id, sheetConn.sheet_name, rowNumber, col, val)
    }

    // Log
    await supabase.from('activity_logs').insert({
      company_id: profile.company_id,
      user_id: user.id,
      action: 'lead_updated',
      entity_type: 'lead',
      entity_id: String(rowNumber),
      details: { updates },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lead PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
