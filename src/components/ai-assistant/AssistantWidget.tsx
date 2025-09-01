'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Zap, TrendingUp, AlertTriangle } from 'lucide-react'
import { aiAssistant, type AssistantContext, type AssistantResponse } from '@/lib/ai-assistant'
import { useAuth } from '@/hooks/useAuth'

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [response, setResponse] = useState<AssistantResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      loadAssistantHelp()
    }
  }, [isOpen, user])

  const loadAssistantHelp = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const context: AssistantContext = {
        tenantId: 'default-tenant',
        userId: user.id,
        businessType: 'retail',
        currentPage: window.location.pathname,
        recentActions: [],
        businessMetrics: {}
      }
      
      const assistantResponse = await aiAssistant.getContextualHelp(context)
      setResponse(assistantResponse)
    } catch (error) {
      console.error('Assistant error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high': return <TrendingUp className="w-4 h-4 text-orange-500" />
      default: return <Zap className="w-4 h-4 text-blue-500" />
    }
  }

  const handleActionClick = (action: any) => {
    if (action.type === 'navigate') {
      window.location.href = action.data.path
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Analyzing your business...</p>
              </div>
            ) : response ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  {getPriorityIcon(response.priority)}
                  <p className="text-sm text-gray-700">{response.message}</p>
                </div>

                {response.insights && response.insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Insights</h4>
                    {response.insights.map((insight, index) => (
                      <p key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {insight}
                      </p>
                    ))}
                  </div>
                )}

                {response.actions && response.actions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Suggested Actions</h4>
                    {response.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleActionClick(action)}
                        className="w-full text-left text-xs bg-blue-50 hover:bg-blue-100 p-2 rounded border border-blue-200 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Click to get personalized business insights</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}