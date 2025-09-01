import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    const authResult = await checkAuthentication(request)
    if (!authResult.authenticated) {
      return redirectToLogin(request)
    }

    // Check role-based access
    const accessResult = checkRoleAccess(pathname, authResult.user)
    if (!accessResult.allowed) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Set tenant context for multi-tenant isolation
    const response = NextResponse.next()
    if (authResult.user?.tenantId) {
      response.headers.set('x-tenant-id', authResult.user.tenantId)
    }

    return response
  }

  return NextResponse.next()
}

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/login',
    '/website-analyzer',
    '/api/website-analyzer/analyze'
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/admin',
    '/superadmin',
    '/api/admin',
    '/api/superadmin'
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

async function checkAuthentication(request: NextRequest) {
  try {
    // In a real implementation, you would verify JWT token from cookies/headers
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('session')
    
    if (!authHeader && !sessionCookie) {
      return { authenticated: false }
    }

    // Mock authentication check - replace with actual token verification
    const user = await AuthService.getCurrentUser()
    
    return {
      authenticated: !!user,
      user: user?.profile
    }
  } catch (error) {
    return { authenticated: false }
  }
}

function checkRoleAccess(pathname: string, user: any) {
  if (!user) {
    return { allowed: false }
  }

  // Superadmin access
  if (user.role === 'SUPERADMIN') {
    return { allowed: true }
  }

  // Admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return {
      allowed: ['ORG_ADMIN', 'USER', 'STAFF'].includes(user.role)
    }
  }

  // Superadmin routes
  if (pathname.startsWith('/superadmin') || pathname.startsWith('/api/superadmin')) {
    return {
      allowed: user.role === 'SUPERADMIN'
    }
  }

  return { allowed: true }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}