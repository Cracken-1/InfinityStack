import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip Supabase middleware if not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  
  if (!isConfigured) {
    return res
  }
  
  const { createMiddlewareClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/admin', '/superadmin']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Log security events
  if (session) {
    const userAgent = req.headers.get('user-agent') || ''
    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || ''
    
    // Log suspicious activity (example: unusual user agent)
    const isSuspicious = userAgent.includes('bot') || userAgent.includes('crawler')
    
    if (isSuspicious) {
      // Log to security events table
      await supabase
        .from('security_events')
        .insert({
          user_id: session.user.id,
          event_type: 'suspicious_access',
          ip_address: ipAddress,
          user_agent: userAgent,
          risk_level: 'medium',
          metadata: { path: req.nextUrl.pathname }
        })
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*']
}