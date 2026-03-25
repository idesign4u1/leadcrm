import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Verify token
    const { data: webhook } = await supabase
      .from('webhook_tokens')
      .select('company_id, is_active')
      .eq('token', token)
      .single()

    if (!webhook || !webhook.is_active) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    // Map common field names
    const lead = {
      company_id: webhook.company_id,
      name: body.name || body.full_name || body.firstname || '',
      phone: body.phone || body.mobile || body.telephone || '',
      email: body.email || '',
      campaign: body.campaign || body.campaign_name || body.utm_campaign || '',
      notes: body.notes || body.message || body.comment || '',
      status: 'new',
      source: 'webhook',
      custom_fields: body,
      date: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single()

    if (error) throw error

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
