import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const customers = [
      {
        id: 'CUST-001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY',
        totalOrders: 12,
        totalSpent: 2499.88,
        lastOrder: '2024-01-15',
        status: 'active',
        joinedAt: '2023-06-15'
      },
      {
        id: 'CUST-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1 (555) 987-6543',
        location: 'Los Angeles, CA',
        totalOrders: 8,
        totalSpent: 1899.99,
        lastOrder: '2024-01-10',
        status: 'active',
        joinedAt: '2023-08-22'
      }
    ]

    let filteredCustomers = customers
    
    if (search) {
      filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (status && status !== 'all') {
      filteredCustomers = filteredCustomers.filter(c => c.status === status)
    }

    return NextResponse.json({
      success: true,
      data: { customers: filteredCustomers }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}