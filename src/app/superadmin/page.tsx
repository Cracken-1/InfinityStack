import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SecurityDashboard from '@/components/security/SecurityDashboard'

function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Administration</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Tenants</h3>
            <p className="text-3xl font-bold text-blue-600">45</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
            <p className="text-3xl font-bold text-green-600">1,234</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibent text-gray-900">Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">$123,456</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
            <p className="text-3xl font-bold text-orange-600">12</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg">
                Manage Tenants
              </button>
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg">
                Review Access Requests
              </button>
              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg">
                System Settings
              </button>
              <button className="w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded-lg">
                Security Monitoring
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Platform Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New tenant registered</span>
                <span className="text-sm text-gray-500">1 hour ago</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Access request approved</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">System maintenance completed</span>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        <SecurityDashboard />
      </div>
    </div>
  )
}

export default function SuperAdminPage() {
  return (
    <ProtectedRoute requireSuperAdmin={true}>
      <SuperAdminDashboard />
    </ProtectedRoute>
  )
}