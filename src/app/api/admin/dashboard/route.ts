import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || 'default'

    // Get dashboard metrics
    const [orders, customers, products, revenue] = await Promise.all([
      getOrdersMetrics(tenantId),
      getCustomersMetrics(tenantId),
      getProductsMetrics(tenantId),
      getRevenueMetrics(tenantId)
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders,
        customers,
        products,
        revenue,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function getOrdersMetrics(tenantId: string) {
  // Mock data - would query actual database
  return {
    total: 1247,
    pending: 23,
    processing: 45,
    shipped: 67,
    delivered: 1089,
    cancelled: 23,
    todayCount: 23,
    todayRevenue: 2847.50,
    growth: 8.2
  }
}

async function getCustomersMetrics(tenantId: string) {
  return {
    total: 8432,
    active: 7234,
    new: 156,
    vip: 234,
    averageOrderValue: 89.50,
    growth: 15.3
  }
}

async function getProductsMetrics(tenantId: string) {
  return {
    total: 342,
    active: 298,
    lowStock: 12,
    outOfStock: 5,
    categories: 8,
    growth: 23
  }
}

async function getRevenueMetrics(tenantId: string) {
  return {
    total: 124500,
    monthly: 45600,
    daily: 2847,
    growth: 12.5,
    target: 150000,
    targetProgress: 83
  }
}