'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, getUserProfile } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await getUserProfile(session.user.email!)
        setUserProfile(profile)
        setUser(session.user)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await getUserProfile(session.user.email!)
      setUserProfile(profile)
      setUser(session.user)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getDashboardLink = () => {
    if (userProfile?.type === 'platform') {
      return '/superadmin'
    }
    return '/admin'
  }

  const getUserRole = () => {
    if (userProfile?.type === 'platform') {
      return 'Super Admin'
    }
    if (userProfile?.type === 'tenant') {
      return userProfile.user.role === 'admin' ? 'Admin' : 'Staff'
    }
    return null
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
                  {getUserRole() && (
                    <div className="text-gray-500">{getUserRole()}</div>
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