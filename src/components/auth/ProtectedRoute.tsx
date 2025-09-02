'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requireSuperAdmin?: boolean
  requireAdmin?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requiredPermissions = [],
  requireSuperAdmin = false,
  requireAdmin = false
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, isSuperAdmin, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requireSuperAdmin && !isSuperAdmin()) {
        router.push('/unauthorized')
        return
      }

      if (requireAdmin && !isAdmin() && !isSuperAdmin()) {
        router.push('/unauthorized')
        return
      }

      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          hasPermission(permission)
        )
        if (!hasAllPermissions) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [user, loading, router, requiredPermissions, requireSuperAdmin, requireAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}