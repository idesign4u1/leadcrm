import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    const companyId = profile?.role === 'super_admin'
      ? request.nextUrl.searchParams.get('company_id') || profile.company_id
      : profile?.company_id

    if (!companyId) return NextResponse.json({ data: [], total: 0 })

    const search = request.nextUrl.searchParams.get('search') || ''
    const status = request.nextUrl.searchParams.get('status') || ''
    const repId = request.nextUrl.searchParams.get('rep_id') || ''
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (repId) query = query.eq('assigned_rep_id', repId)
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,campaign.ilike.%${search}%`)
    }

    // Sales rep sees only their leads
    if (profile?.role === 'sales_rep') {
      query = query.eq('assigned_rep_id', user.id)
    }

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, total: count ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { name, phone, email, campaign, notes, status, assigned_rep_id, assigned_rep_name, custom_fields, date } = body

    const { data, error } = await supabase
      .from('leads')
      .insert({
        company_id: profile?.company_id,
        name, phone, email, campaign, notes,
        status: status || 'new',
        assigned_rep_id,
        assigned_rep_name,
        custom_fields: custom_fields || {},
        date: date || new Date().toISOString(),
        source: 'manual',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
