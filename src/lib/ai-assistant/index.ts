import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface AssistantContext {
  tenantId: string
  userId: string
  businessType: string
  currentPage: string
  recentActions: string[]
  businessMetrics: Record<string, any>
}

export interface AssistantResponse {
  message: string
  actions?: AssistantAction[]
  insights?: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface AssistantAction {
  type: 'navigate' | 'create' | 'update' | 'analyze'
  label: string
  data: Record<string, any>
}

class AIAssistant {
  private supabase = supabaseAdmin

  async getContextualHelp(context: AssistantContext): Promise<AssistantResponse> {
    try {
      const businessInsights = await this.analyzeBusinessState(context)
      const recommendations = await this.generateRecommendations(context, businessInsights)
      
      return {
        message: this.generateContextualMessage(context, recommendations),
        actions: recommendations.actions,
        insights: recommendations.insights,
        priority: recommendations.priority
      }
    } catch (error) {
      logger.error('AI Assistant error:', error as Error)
      return {
        message: "I'm here to help! What would you like to know about your business?",
        priority: 'low'
      }
    }
  }

  private async analyzeBusinessState(context: AssistantContext) {
    const { data: metrics } = await this.supabase
      .from('business_metrics')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false })
      .limit(10)

    return {
      revenue: metrics?.find((m: any) => m.metric_type === 'revenue')?.value || 0,
      orders: metrics?.find((m: any) => m.metric_type === 'orders')?.value || 0,
      customers: metrics?.find((m: any) => m.metric_type === 'customers')?.value || 0,
      trends: this.calculateTrends(metrics || [])
    }
  }

  private async generateRecommendations(context: AssistantContext, insights: any) {
    const actions: AssistantAction[] = []
    const recommendations: string[] = []
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (insights.revenue < 1000 && context.businessType === 'retail') {
      priority = 'high'
      recommendations.push('Your revenue is below average. Consider running a promotion.')
      actions.push({
        type: 'create',
        label: 'Create Promotion',
        data: { type: 'promotion', template: 'revenue_boost' }
      })
    }

    if (insights.customers > 0 && insights.orders / insights.customers < 1.5) {
      recommendations.push('Customer retention could be improved. Try loyalty programs.')
      actions.push({
        type: 'navigate',
        label: 'Setup Loyalty Program',
        data: { path: '/admin/customers/loyalty' }
      })
    }

    return { actions, insights: recommendations, priority }
  }

  private generateContextualMessage(context: AssistantContext, recommendations: any): string {
    const timeOfDay = new Date().getHours()
    const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening'
    
    if (recommendations.insights.length > 0) {
      return `${greeting}! I've analyzed your business and found ${recommendations.insights.length} opportunities for improvement.`
    }
    
    return `${greeting}! Your business is performing well. How can I help you today?`
  }

  private calculateTrends(metrics: any[]): Record<string, number> {
    const trends: Record<string, number> = {}
    const metricTypes = Array.from(new Set(metrics.map((m: any) => m.metric_type)))
    
    metricTypes.forEach(type => {
      const typeMetrics = metrics.filter((m: any) => m.metric_type === type)
      if (typeMetrics.length >= 2) {
        const latest = typeMetrics[0].value
        const previous = typeMetrics[1].value
        trends[type] = previous > 0 ? ((latest - previous) / previous) * 100 : 0
      }
    })
    
    return trends
  }
}

export const aiAssistant = new AIAssistant()