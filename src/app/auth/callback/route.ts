import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    
    // Check if platform admin
    const { data: platformUser } = await supabase
      .from('platform_users')
      .select('id')
      .eq('email', data.user.email)
      .single()
    
    if (platformUser) {
      return NextResponse.redirect(`${origin}/superadmin`)
    }
    
    // Default to admin for all other users
    return NextResponse.redirect(`${origin}/admin`)
    
  } catch (error) {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`)
  }
}