import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const companyId = request.nextUrl.searchParams.get('company_id') ?? profile.company_id

    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (profile.role !== 'super_admin') {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!['company_admin', 'super_admin'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, role, company_id, phone } = body

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8) + 'Aa1!',
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (authError) throw authError

    const targetCompanyId = adminProfile.role === 'super_admin' ? company_id : adminProfile.company_id

    await adminSupabase.from('profiles').update({
      full_name,
      role,
      company_id: targetCompanyId,
      phone,
    }).eq('id', authData.user.id)

    // Send password reset so user can set their own password
    await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
