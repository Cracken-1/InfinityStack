import Link from 'next/link'
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Package,
  MapPin,
  Calendar,
  Settings
} from 'lucide-react'
import WebsiteAnalyzerWidget from '@/components/admin/WebsiteAnalyzerWidget'

export default function AdminDashboard() {
  // Mock data - would come from database
  const stats = {
    revenue: '$124,500',
    orders: '1,247',
    customers: '8,432',
    products: '342'
  }

  const recentOrders = [
    { id: '1001', customer: 'John Doe', amount: '$89.99', status: 'completed' },
    { id: '1002', customer: 'Jane Smith', amount: '$156.50', status: 'processing' },
    { id: '1003', customer: 'Mike Johnson', amount: '$67.25', status: 'pending' },
  ]

  const alerts = [
    { type: 'warning', message: 'Low stock alert: iPhone Cases (5 remaining)' },
    { type: 'info', message: 'New customer registration: Sarah Wilson' },
    { type: 'success', message: 'Monthly sales target achieved!' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                InfinityStack
              </Link>
              <span className="text-gray-400">|</span>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/settings" className="text-gray-600 hover:text-gray-900">
                <Settings className="h-6 w-6" />
              </Link>
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.revenue}</p>
                <p className="text-sm text-green-600">+12.5% from last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
                <p className="text-sm text-green-600">+8.2% from last month</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
                <p className="text-sm text-green-600">+15.3% from last month</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
                <p className="text-sm text-blue-600">+23 new this month</p>
              </div>
              <Package className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/admin/products" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Package className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Products</span>
                </Link>
                
                <Link href="/admin/orders" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <ShoppingCart className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Orders</span>
                </Link>
                
                <Link href="/admin/customers" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Customers</span>
                </Link>
                
                <Link href="/admin/ai-insights" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">AI Insights</span>
                </Link>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{order.amount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Alerts */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                    alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    alert.type === 'success' ? 'bg-green-50 border border-green-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'warning' ? 'text-yellow-600' :
                      alert.type === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`} />
                    <p className="text-sm text-gray-700">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Website Analyzer Widget */}
            <WebsiteAnalyzerWidget />

            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">New Orders</span>
                  <span className="font-medium text-gray-900">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium text-gray-900">$2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Customers</span>
                  <span className="font-medium text-gray-900">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-medium text-green-600">3.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}