import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateCell } from '@/lib/google-sheets/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id } = params
    const { isRowNumber } = body

    // If updating a Google Sheet row
    if (isRowNumber) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const { data: sheetConn } = await supabase
        .from('sheet_connections')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('is_active', true)
        .single()

      if (!sheetConn) return NextResponse.json({ error: 'No sheet connected' }, { status: 400 })

      const rowNumber = parseInt(id)
      const updates = body.updates as Record<string, string>
      for (const [col, val] of Object.entries(updates)) {
        await updateCell(sheetConn.spreadsheet_id, sheetConn.sheet_name, rowNumber, col, val)
      }

      await supabase.from('activity_logs').insert({
        company_id: profile?.company_id,
        user_id: user.id,
        action: 'lead_updated',
        entity_type: 'lead',
        entity_id: id,
        details: { updates },
      })

      return NextResponse.json({ success: true })
    }

    // Otherwise update in Supabase
    const { data, error } = await supabase
      .from('leads')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
