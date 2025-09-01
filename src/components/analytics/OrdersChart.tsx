'use client'

import { useState, useEffect } from 'react'
import BarChart from '@/components/charts/BarChart'
import { ORDER_STATUSES } from '@/lib/constants'

export default function OrdersChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockData = [
      { label: 'Pending', value: 23, color: 'bg-yellow-500' },
      { label: 'Processing', value: 45, color: 'bg-blue-500' },
      { label: 'Shipped', value: 67, color: 'bg-purple-500' },
      { label: 'Delivered', value: 189, color: 'bg-green-500' },
      { label: 'Cancelled', value: 12, color: 'bg-red-500' }
    ]
    setData(mockData)
  }, [])

  const totalOrders = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Orders by Status</h3>
          <p className="text-sm text-gray-600">Total: {totalOrders} orders</p>
        </div>
      </div>
      <BarChart data={data} height={200} />
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded ${item.color}`} />
            <span className="text-gray-600">{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}