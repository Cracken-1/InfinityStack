'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  BarChart3, Users, DollarSign, TrendingUp, Globe, Shield, 
  Search, Target, Award, Zap, Menu, Bell, Settings, User,
  ChevronDown, Home, Analytics, Briefcase, MessageSquare
} from 'lucide-react'

interface DashboardData {
  companyName: string
  websiteUrl: string
  businessModel: any
  metrics: any[]
}

export default function CustomDashboard() {
  const params = useParams()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  useEffect(() => {
    fetchDashboardData(params.id as string)
  }, [params.id])

  const fetchDashboardData = async (dashboardId: string) => {
    const mockData: DashboardData = {
      companyName: 'Your Company',
      websiteUrl: 'example.com',
      businessModel: {
        type: 'ECOMMERCE',
        confidence: 85,
        revenue: ['Product Sales', 'Subscription Revenue'],
        marketAnalysis: { brandStrength: 72, positioning: 'Market Leader' }
      },
      metrics: [
        { title: 'Revenue', value: '$124,500', change: '+12.5%', trend: 'up' },
        { title: 'Visitors', value: '45,231', change: '+8.2%', trend: 'up' },
        { title: 'Conversion', value: '3.2%', change: '+0.5%', trend: 'up' },
        { title: 'Brand Score', value: '72/100', change: '+5', trend: 'up' }
      ]
    }
    setDashboardData(mockData)
  }

  if (!dashboardData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300`}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-gray-900">{dashboardData.companyName}</h2>
                <p className="text-xs text-gray-500">{dashboardData.websiteUrl}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {[
            { icon: Home, label: 'Overview', active: true },
            { icon: Analytics, label: 'Analytics' },
            { icon: Target, label: 'Marketing' },
            { icon: Users, label: 'Customers' },
            { icon: Briefcase, label: 'Business Intel' },
            { icon: Globe, label: 'SEO Monitor' },
            { icon: Shield, label: 'Security' }
          ].map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                item.active ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Business Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time insights for {dashboardData.websiteUrl}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign Out</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardData.metrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm text-green-600">{metric.change} from last month</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Business Intelligence Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Business Model Performance</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray={`${dashboardData.businessModel.confidence}, 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{dashboardData.businessModel.confidence}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{dashboardData.businessModel.type}</p>
                  <p className="text-sm text-gray-600">Confidence Score</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Streams</h3>
              <div className="space-y-3">
                {dashboardData.businessModel.revenue.map((stream: string, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{stream}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${60 + index * 20}%` }}></div>
                      </div>
                      <span className="text-sm font-medium">{60 + index * 20}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}