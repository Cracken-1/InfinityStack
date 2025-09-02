import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    
    if (data.user?.email) {
      const userProfile = await getUserProfile(data.user.email)
      
      if (userProfile?.type === 'platform') {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      } else if (userProfile?.type === 'tenant') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/login', request.url))
}