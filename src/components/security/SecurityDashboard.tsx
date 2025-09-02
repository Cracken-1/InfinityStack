'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [failedAttempts, setFailedAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      // Get recent security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Get failed login attempts
      const { data: attempts } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      setSecurityEvents(events || [])
      setFailedAttempts(attempts || [])
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading security data...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Security Dashboard</h2>

      {/* Security Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
        <div className="space-y-2">
          {securityEvents.map((event: any) => (
            <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{event.event_type}</span>
                <span className="text-gray-500 ml-2">{event.ip_address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  event.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                  event.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {event.risk_level}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Failed Login Attempts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Failed Login Attempts</h3>
        <div className="space-y-2">
          {failedAttempts.map((attempt: any) => (
            <div key={attempt.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
              <div>
                <span className="font-medium">{attempt.email}</span>
                <span className="text-gray-500 ml-2">{attempt.ip_address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  {attempt.attempt_count} attempts
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(attempt.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}