import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { requestId, subscriptionTier = 'starter' } = await request.json()

    // Get access request
    const { data: accessRequest, error: requestError } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !accessRequest) {
      throw new Error('Access request not found')
    }

    // Create tenant
    const tenantSlug = accessRequest.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert([{
        name: accessRequest.company_name,
        slug: tenantSlug,
        industry: accessRequest.industry,
        subscription_tier: subscriptionTier
      }])
      .select()
      .single()

    if (tenantError) throw tenantError

    // Create Supabase Auth user
    const tempPassword = Math.random().toString(36).slice(-12)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: accessRequest.email,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) throw authError

    // Create user in our database
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authUser.user.id,
        tenant_id: tenant.id,
        email: accessRequest.email,
        full_name: accessRequest.full_name,
        role: 'admin',
        password_hash: 'managed_by_supabase_auth'
      }])

    if (userError) throw userError

    // Update access request status
    await supabaseAdmin
      .from('access_requests')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    return NextResponse.json({ 
      success: true, 
      tenant,
      tempPassword,
      message: 'User created successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}