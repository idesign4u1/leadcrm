import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify token
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_tokens')
      .select('company_id, is_active, id')
      .eq('token', token)
      .single()

    if (webhookError || !webhook || !webhook.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive token' }, { status: 401 })
    }

    const body = await request.json()

    // Map common field names to default schema
    const lead = {
      company_id: webhook.company_id,
      name: body.name || body.full_name || body.firstname || body.first_name || '',
      phone: body.phone || body.mobile || body.telephone || body.tel || '',
      email: body.email || body.email_address || '',
      campaign: body.campaign || body.campaign_name || body.utm_campaign || body.source || '',
      notes: body.notes || body.message || body.comment || body.description || '',
      status: body.status || 'new',
      source: 'webhook',
      custom_fields: body,
      date: body.date || new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single()

    if (error) throw error

    // Update last_used_at for the webhook token
    await supabase
      .from('webhook_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', webhook.id)

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[webhook error]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Allow GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'LeadCRM Webhook Active' })
}
