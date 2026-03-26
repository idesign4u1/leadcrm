import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient()

    // Validate token
    const { data: webhookToken, error: tokenError } = await supabase
      .from('webhook_tokens')
      .select('company_id, is_active')
      .eq('token', params.token)
      .eq('is_active', true)
      .single()

    if (tokenError || !webhookToken) {
      return NextResponse.json({ error: 'Invalid or inactive token' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      date,
      name,
      phone,
      email,
      campaign,
      notes,
      status,
      custom_fields,
    } = body

    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        company_id: webhookToken.company_id,
        date: date ?? new Date().toISOString().slice(0, 10),
        name: name ?? null,
        phone: phone ?? null,
        email: email ?? null,
        campaign: campaign ?? null,
        notes: notes ?? null,
        status: status ?? 'new',
        custom_fields: custom_fields ?? {},
        source: 'webhook',
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  return NextResponse.json({
    message: 'Webhook endpoint active',
    usage: {
      method: 'POST',
      fields: ['date', 'name', 'phone', 'email', 'campaign', 'notes', 'status', 'custom_fields'],
    },
  })
}
