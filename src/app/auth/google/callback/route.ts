import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      // Exchange code for Google tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/google/callback`
        })
      })

      const tokens = await tokenResponse.json()
      
      if (tokens.error) {
        return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
      }
      
      // Sign in to Supabase with Google tokens
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.id_token
      })

      if (error) {
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }

      return NextResponse.redirect(new URL('/admin', request.url))
    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=no_code', request.url))
}