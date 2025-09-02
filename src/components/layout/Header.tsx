'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, isConfigured } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'platform' | 'tenant' | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        setUser(session.user)
        const role = await checkUserRole(session.user.email!)
        setUserRole(role)
      } else {
        setUser(null)
        setUserRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserRole = async (email: string) => {
    if (!isConfigured) return 'tenant'
    
    try {
      // Check platform users first
      const { data: platformUser } = await supabase
        .from('platform_users')
        .select('id')
        .eq('email', email)
        .single()
      
      return platformUser ? 'platform' : 'tenant'
    } catch {
      return 'tenant' // Safe fallback
    }
  }

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const role = await checkUserRole(session.user.email!)
        setUserRole(role)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getDashboardLink = () => {
    return userRole === 'platform' ? '/superadmin' : '/admin'
  }

  const getUserRoleDisplay = () => {
    return userRole === 'platform' ? 'Super Admin' : 'Admin'
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">∞</span>
            </div>
            <span className="text-xl font-bold text-gray-900">InfinityStack</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/website-analyzer" className="text-gray-600 hover:text-blue-600">
              Website Analyzer
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-blue-600">
              Docs
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.email}</div>
                  {userRole && (
                    <div className="text-gray-500">{getUserRoleDisplay()}</div>
                  )}
                </div>
                <Link
                  href={getDashboardLink()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}