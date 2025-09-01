'use client'

import { useState, useEffect } from 'react'
import LineChart from '@/components/charts/LineChart'
import { formatCurrency } from '@/lib/utils'

interface RevenueData {
  date: string
  revenue: number
}

export default function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([])
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000) + 1000
    }))
    setData(mockData)
  }, [period])

  const chartData = data.map(item => ({
    label: item.date,
    value: item.revenue
  }))

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const avgRevenue = totalRevenue / data.length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <p className="text-sm text-gray-600">
            Total: {formatCurrency(totalRevenue)} | Avg: {formatCurrency(avgRevenue)}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>
      <LineChart data={chartData} height={200} color="#10b981" />
    </div>
  )
}