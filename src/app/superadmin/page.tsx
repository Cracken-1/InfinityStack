import Link from 'next/link'
import { 
  Server, 
  Database, 
  Users, 
  Shield, 
  Activity, 
  AlertTriangle,
  Building,
  Code,
  Settings,
  BarChart3
} from 'lucide-react'

export default function SuperadminDashboard() {
  // Mock data - would come from database
  const systemStats = {
    totalTenants: '47',
    activeUsers: '2,341',
    systemUptime: '99.9%',
    apiCalls: '1.2M'
  }

  const tenants = [
    { id: '1', name: 'PandaMart Kenya', industry: 'Retail', users: 156, status: 'active' },
    { id: '2', name: 'TechCorp Solutions', industry: 'Technology', users: 89, status: 'active' },
    { id: '3', name: 'HealthPlus Clinic', industry: 'Healthcare', users: 34, status: 'trial' },
  ]

  const systemAlerts = [
    { type: 'critical', message: 'High CPU usage on server cluster 2 (85%)' },
    { type: 'warning', message: 'Database backup completed with warnings' },
    { type: 'info', message: 'New tenant onboarding: RestaurantPro' },
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
              <h1 className="text-xl font-semibold text-gray-900">Superadmin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/superadmin/settings" className="text-gray-600 hover:text-gray-900">
                <Settings className="h-6 w-6" />
              </Link>
              <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">S</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalTenants}</p>
                <p className="text-sm text-green-600">+3 this month</p>
              </div>
              <Building className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
                <p className="text-sm text-green-600">+156 this week</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.systemUptime}</p>
                <p className="text-sm text-green-600">Last 30 days</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Calls</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.apiCalls}</p>
                <p className="text-sm text-blue-600">This month</p>
              </div>
              <Code className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* System Management */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Management</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/superadmin/tenants" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Building className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Tenants</span>
                </Link>
                
                <Link href="/superadmin/users" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Users</span>
                </Link>
                
                <Link href="/superadmin/security" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Shield className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Security</span>
                </Link>
                
                <Link href="/superadmin/analytics" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Analytics</span>
                </Link>
              </div>
            </div>

            {/* Tenant Management */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Tenants</h3>
                <Link href="/superadmin/tenants" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-sm text-gray-600">{tenant.industry} • {tenant.users} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                        tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* System Alerts */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
              <div className="space-y-3">
                {systemAlerts.map((alert, index) => (
                  <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                    alert.type === 'critical' ? 'bg-red-50 border border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'critical' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <p className="text-sm text-gray-700">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Web Servers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Database</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">API Gateway</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-600">Warning</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Security</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Secure</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-medium text-gray-900">$847,293</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Growth</span>
                  <span className="font-medium text-green-600">+23.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Churn Rate</span>
                  <span className="font-medium text-red-600">2.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Tenant Value</span>
                  <span className="font-medium text-gray-900">$18,027</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}