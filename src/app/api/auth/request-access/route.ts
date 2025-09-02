import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, fullName, email, phone, industry, message } = body

    // Check if request already exists
    const { data: existing } = await supabaseAdmin
      .from('access_requests')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Access request already exists for this email' },
        { status: 400 }
      )
    }

    // Create access request
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .insert([{
        company_name: companyName,
        full_name: fullName,
        email,
        phone,
        industry,
        message,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}