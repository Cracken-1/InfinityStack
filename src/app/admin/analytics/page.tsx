import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react'
import MetricCard from '@/components/dashboard/MetricCard'
import RevenueChart from '@/components/analytics/RevenueChart'
import OrdersChart from '@/components/analytics/OrdersChart'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary-600">InfinityStack</h1>
                <p className="text-sm text-gray-600">Analytics Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value="$124,500"
              change="+12.5% from last month"
              changeType="positive"
              icon={DollarSign}
            />
            <MetricCard
              title="Total Orders"
              value="1,247"
              change="+8.2% from last month"
              changeType="positive"
              icon={ShoppingCart}
            />
            <MetricCard
              title="Active Customers"
              value="8,432"
              change="+15.3% from last month"
              changeType="positive"
              icon={Users}
            />
            <MetricCard
              title="Conversion Rate"
              value="3.2%"
              change="+0.5% from last month"
              changeType="positive"
              icon={TrendingUp}
            />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8">
            <RevenueChart />
            <OrdersChart />
          </div>

          {/* Additional Analytics */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
              <div className="space-y-3">
                {[
                  { name: 'iPhone 15 Pro', sales: 156, revenue: '$155,844' },
                  { name: 'MacBook Air M3', sales: 89, revenue: '$115,691' },
                  { name: 'AirPods Pro', sales: 234, revenue: '$58,466' }
                ].map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sales} sales</p>
                    </div>
                    <p className="font-medium text-gray-900">{product.revenue}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibent text-gray-900 mb-4">Customer Segments</h3>
              <div className="space-y-3">
                {[
                  { segment: 'VIP Customers', count: 234, percentage: 2.8 },
                  { segment: 'Regular Customers', count: 3456, percentage: 41.0 },
                  { segment: 'New Customers', count: 4742, percentage: 56.2 }
                ].map((segment, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{segment.segment}</p>
                      <p className="text-sm text-gray-500">{segment.count} customers</p>
                    </div>
                    <p className="font-medium text-gray-900">{segment.percentage}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Goals</h3>
              <div className="space-y-4">
                {[
                  { goal: 'Monthly Revenue', current: 124500, target: 150000 },
                  { goal: 'New Customers', current: 156, target: 200 },
                  { goal: 'Order Volume', current: 1247, target: 1500 }
                ].map((goal, index) => {
                  const progress = (goal.current / goal.target) * 100
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">{goal.goal}</span>
                        <span className="text-gray-500">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}