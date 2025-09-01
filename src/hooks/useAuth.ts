'use client'

import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/auth'
import { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const result = await AuthService.getCurrentUser()
      setState({
        user: result?.profile || null,
        loading: false,
        error: null
      })
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { profile } = await AuthService.signIn(email, password)
      setState({
        user: profile,
        loading: false,
        error: null
      })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      await AuthService.signOut()
      setState({
        user: null,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return {
    ...state,
    signIn,
    signOut,
    refresh: checkAuth
  }
}