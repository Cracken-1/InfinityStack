import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const orders = [
      {
        id: 'ORD-001',
        customer: 'John Doe',
        email: 'john@example.com',
        total: 299.99,
        status: 'processing',
        items: 2,
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'ORD-002',
        customer: 'Jane Smith',
        email: 'jane@example.com',
        total: 1299.99,
        status: 'shipped',
        items: 1,
        createdAt: '2024-01-14T15:45:00Z'
      }
    ]

    const filteredOrders = status ? orders.filter(o => o.status === status) : orders

    return NextResponse.json({
      success: true,
      data: {
        orders: filteredOrders,
        pagination: {
          page,
          limit,
          total: filteredOrders.length,
          pages: Math.ceil(filteredOrders.length / limit)
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: { id, status, updatedAt: new Date().toISOString() }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}