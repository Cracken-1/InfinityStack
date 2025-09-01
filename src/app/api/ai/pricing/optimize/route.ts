import { NextRequest, NextResponse } from 'next/server'
import { DynamicPricingEngine } from '@/lib/ai/dynamic-pricing'

export async function POST(request: NextRequest) {
  try {
    const { productId, currentPrice, cost, competitorPrices, demandLevel, stockLevel, category } = await request.json()

    if (!productId || !currentPrice || !cost || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const engine = new DynamicPricingEngine()
    const recommendation = await engine.generatePricingRecommendation({
      productId,
      currentPrice,
      cost,
      competitorPrices: competitorPrices || [],
      demandLevel: demandLevel || 'medium',
      stockLevel: stockLevel || 50,
      category
    })

    return NextResponse.json({
      success: true,
      data: recommendation
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}