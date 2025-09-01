import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const tenants = [
      {
        id: '1',
        name: 'PandaMart Kenya',
        domain: 'pandamart.co.ke',
        industry: 'RETAIL',
        subscriptionTier: 'PROFESSIONAL',
        users: 156,
        status: 'active',
        createdAt: '2023-06-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'TechCorp Solutions',
        domain: 'techcorp.com',
        industry: 'TECHNOLOGY',
        subscriptionTier: 'ENTERPRISE',
        users: 89,
        status: 'active',
        createdAt: '2023-08-22T14:30:00Z'
      }
    ]

    return NextResponse.json({
      success: true,
      data: { tenants }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, domain, industry, subscriptionTier } = await request.json()

    if (!name || !domain || !industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tenant = {
      id: Date.now().toString(),
      name,
      domain,
      industry,
      subscriptionTier: subscriptionTier || 'STARTER',
      users: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: tenant
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}