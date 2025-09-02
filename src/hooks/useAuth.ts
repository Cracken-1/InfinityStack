'use client'

import { useState, useEffect } from 'react'
import { supabase, getUserProfile } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  type: 'platform' | 'tenant'
  role: string
  tenantId?: string
  permissions: string[]
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        await loadUserProfile(session.user.email!)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await loadUserProfile(session.user.email!)
    }
    setLoading(false)
  }

  const loadUserProfile = async (email: string) => {
    const profile = await getUserProfile(email)
    if (profile) {
      const authUser: AuthUser = {
        id: profile.user.id,
        email: profile.user.email,
        type: profile.type as 'platform' | 'tenant',
        role: profile.user.role || 'user',
        tenantId: profile.type === 'tenant' ? profile.user.tenant_id : undefined,
        permissions: getPermissions(profile.type, profile.user.role)
      }
      setUser(authUser)
    }
  }

  const getPermissions = (type: string, role: string): string[] => {
    if (type === 'platform') {
      return ['manage_tenants', 'manage_users', 'view_analytics', 'system_settings']
    }
    
    if (type === 'tenant') {
      switch (role) {
        case 'admin':
          return ['manage_users', 'manage_products', 'manage_orders', 'view_analytics']
        case 'manager':
          return ['manage_products', 'manage_orders', 'view_reports']
        case 'staff':
          return ['view_products', 'create_orders']
        default:
          return []
      }
    }
    
    return []
  }

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false
  }

  const isSuperAdmin = (): boolean => {
    return user?.type === 'platform'
  }

  const isAdmin = (): boolean => {
    return user?.type === 'tenant' && user?.role === 'admin'
  }

  return {
    user,
    loading,
    hasPermission,
    isSuperAdmin,
    isAdmin
  }
}