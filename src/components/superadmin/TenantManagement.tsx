'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Tenant {
  id: string
  name: string
  domain: string
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  user_count: number
  created_at: string
  expires_at?: string
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select(`
        *,
        users(count)
      `)
      .order('created_at', { ascending: false })
    
    setTenants(data || [])
    setLoading(false)
  }

  const updateTenantStatus = async (tenantId: string, status: string) => {
    await supabase
      .from('tenants')
      .update({ status })
      .eq('id', tenantId)
    
    fetchTenants()
  }

  const updateSubscriptionTier = async (tenantId: string, tier: string) => {
    await supabase
      .from('tenants')
      .update({ subscription_tier: tier })
      .eq('id', tenantId)
    
    fetchTenants()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tenant Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Tenants</h3>
          <p className="text-3xl font-bold text-blue-600">{tenants.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Tenants</h3>
          <p className="text-3xl font-bold text-green-600">
            {tenants.filter(t => t.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Trial Tenants</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {tenants.filter(t => t.status === 'trial').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.domain}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={tenant.subscription_tier}
                    onChange={(e) => updateSubscriptionTier(tenant.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                    tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {tenant.user_count || 0}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {tenant.status === 'active' && (
                      <button
                        onClick={() => updateTenantStatus(tenant.id, 'suspended')}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Suspend
                      </button>
                    )}
                    {tenant.status === 'suspended' && (
                      <button
                        onClick={() => updateTenantStatus(tenant.id, 'active')}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        Activate
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-900 text-sm">
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}