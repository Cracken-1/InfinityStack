'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MagicLinkAuth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      setSent(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-green-600 text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="text-gray-600 mb-6">
          We sent a magic link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Click the link in your email to sign in. The link will expire in 1 hour.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-blue-600 hover:underline"
        >
          Try different email
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Magic Link Sign In</h2>
      <p className="text-gray-600 text-center mb-6">
        Enter your email and we'll send you a secure link to sign in
      </p>
      
      <form onSubmit={sendMagicLink} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@company.com"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
    </div>
  )
}