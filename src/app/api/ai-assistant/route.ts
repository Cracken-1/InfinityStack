import { NextRequest, NextResponse } from 'next/server'
import { aiAssistant } from '@/lib/ai-assistant'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId, businessType, currentPage, recentActions, businessMetrics } = await request.json()

    const context = {
      tenantId,
      userId,
      businessType,
      currentPage,
      recentActions: recentActions || [],
      businessMetrics: businessMetrics || {}
    }

    const response = await aiAssistant.getContextualHelp(context)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json(
      { error: 'Failed to get assistant help' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  const userId = searchParams.get('userId')

  if (!tenantId || !userId) {
    return NextResponse.json(
      { error: 'Missing tenantId or userId' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient()
    
    const { data: metrics } = await supabase
      .from('business_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5)

    const context = {
      tenantId,
      userId,
      businessType: 'retail',
      currentPage: '/',
      recentActions: [],
      businessMetrics: metrics || []
    }

    const response = await aiAssistant.getContextualHelp(context)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json(
      { error: 'Failed to get assistant help' },
      { status: 500 }
    )
  }
}