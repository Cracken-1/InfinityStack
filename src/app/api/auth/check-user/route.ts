import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Simulate user lookup
    const mockUsers = [
      { email: 'admin@example.com', tier: 'ENTERPRISE', hasAccess: true },
      { email: 'user@demo.com', tier: 'PROFESSIONAL', hasAccess: true }
    ]

    const existingUser = mockUsers.find(user => user.email === email)

    if (existingUser) {
      return NextResponse.json({
        exists: true,
        user: {
          email: existingUser.email,
          tier: existingUser.tier,
          hasAccess: existingUser.hasAccess
        }
      })
    }

    return NextResponse.json({
      exists: false,
      requiresRegistration: true
    })
  } catch (error) {
    console.error('User check error:', error)
    return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
  }
}