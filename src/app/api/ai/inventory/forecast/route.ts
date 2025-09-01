import { NextRequest, NextResponse } from 'next/server'
import { InventoryForecastingEngine } from '@/lib/ai/inventory-forecasting'

export async function POST(request: NextRequest) {
  try {
    const { productId, currentStock, averageDailySales, leadTime, safetyStock } = await request.json()

    if (!productId || currentStock === undefined || !averageDailySales) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const engine = new InventoryForecastingEngine()
    const forecast = await engine.generateForecast({
      productId,
      currentStock,
      averageDailySales,
      seasonalFactor: 1.0,
      leadTime: leadTime || 14,
      safetyStock: safetyStock || 10
    })

    return NextResponse.json({
      success: true,
      data: forecast
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}