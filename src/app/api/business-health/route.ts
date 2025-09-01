import { NextRequest, NextResponse } from 'next/server'
import { businessHealth } from '@/lib/business-health'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Missing tenantId' },
      { status: 400 }
    )
  }

  try {
    const healthScore = await businessHealth.calculateHealthScore(tenantId)
    return NextResponse.json(healthScore)
  } catch (error) {
    console.error('Business health API error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      )
    }

    const healthScore = await businessHealth.calculateHealthScore(tenantId)
    return NextResponse.json(healthScore)
  } catch (error) {
    console.error('Business health API error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    )
  }
}