'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { businessHealth, type BusinessHealthScore } from '@/lib/business-health'
import { useAuth } from '@/hooks/useAuth'

export function BusinessHealthWidget() {
  const [healthScore, setHealthScore] = useState<BusinessHealthScore | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadHealthScore()
    }
  }, [user])

  const loadHealthScore = async () => {
    if (!user) return
    
    try {
      const score = await businessHealth.calculateHealthScore('default-tenant')
      setHealthScore(score)
    } catch (error) {
      console.error('Health score error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!healthScore) return null

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Business Health</h3>
        </div>
        <div className="flex items-center gap-1">
          {getTrendIcon(healthScore.trends.direction)}
          <span className="text-sm text-gray-600">
            {healthScore.trends.change > 0 ? '+' : ''}{healthScore.trends.change}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBackground(healthScore.overall)} ${getScoreColor(healthScore.overall)}`}>
          {healthScore.overall}/100
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Updated {new Date(healthScore.lastUpdated).toLocaleTimeString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(healthScore.categories).map(([category, score]) => (
          <div key={category} className="text-center">
            <div className={`text-lg font-semibold ${getScoreColor(score)}`}>
              {Math.round(score)}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {category.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>

      {healthScore.recommendations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
          <div className="space-y-1">
            {healthScore.recommendations.slice(0, 2).map((rec, index) => (
              <p key={index} className="text-xs text-gray-600">
                • {rec}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}