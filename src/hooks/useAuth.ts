'use client'

import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '@/lib/supabase'

// Cache to prevent multiple DB calls
const roleCache = new Map<string, { type: 'platform' | 'tenant', timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
        await loadUserProfile(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserRole = async (email: string): Promise<'platform' | 'tenant'> => {
    // Check cache first
    const cached = roleCache.get(email)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.type
    }

    if (!isConfigured) return 'tenant'
    
    try {
      const { data: platformUser } = await supabase
        .from('platform_users')
        .select('id')
        .eq('email', email)
        .single()
      
      const userType = platformUser ? 'platform' : 'tenant'
      
      // Cache the result
      roleCache.set(email, { type: userType, timestamp: Date.now() })
      
      return userType
    } catch {
      const fallbackType = 'tenant'
      roleCache.set(email, { type: fallbackType, timestamp: Date.now() })
      return fallbackType
    }
  }

  const loadUserProfile = async (supabaseUser: any) => {
    try {
      const userType = await checkUserRole(supabaseUser.email)
      
      const authUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        type: userType,
        role: userType === 'platform' ? 'super_admin' : 'admin',
        tenantId: userType === 'tenant' ? 'default' : undefined,
        permissions: getPermissions(userType, userType === 'platform' ? 'super_admin' : 'admin')
      }
      setUser(authUser)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      // Fallback user to prevent auth failures
      const fallbackUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        type: 'tenant',
        role: 'admin',
        tenantId: 'default',
        permissions: getPermissions('tenant', 'admin')
      }
      setUser(fallbackUser)
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