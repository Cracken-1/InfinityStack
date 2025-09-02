import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface BusinessHealthScore {
  overall: number
  categories: {
    revenue: number
    customers: number
    operations: number
    growth: number
  }
  trends: {
    direction: 'up' | 'down' | 'stable'
    change: number
  }
  recommendations: string[]
  lastUpdated: Date
}

export interface HealthMetric {
  name: string
  value: number
  weight: number
  benchmark: number
  trend: number
}

class BusinessHealthEngine {
  private supabase = supabaseAdmin

  async calculateHealthScore(tenantId: string): Promise<BusinessHealthScore> {
    try {
      const metrics = await this.gatherMetrics(tenantId)
      const scores = this.calculateCategoryScores(metrics)
      const overall = this.calculateOverallScore(scores)
      const trends = await this.calculateTrends(tenantId, overall)
      const recommendations = this.generateRecommendations(scores, metrics)

      const healthScore: BusinessHealthScore = {
        overall,
        categories: scores,
        trends,
        recommendations,
        lastUpdated: new Date()
      }

      await this.saveHealthScore(tenantId, healthScore)
      return healthScore
    } catch (error) {
      logger.error('Business health calculation error:', error as Error)
      return this.getDefaultHealthScore()
    }
  }

  private async gatherMetrics(tenantId: string): Promise<Record<string, HealthMetric>> {
    const { data: businessData } = await this.supabase
      .from('business_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(30)

    const { data: customerData } = await this.supabase
      .from('customers')
      .select('count')
      .eq('tenant_id', tenantId)

    const { data: orderData } = await this.supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return this.processMetrics(businessData || [], customerData?.[0]?.count || 0, orderData || [])
  }

  private processMetrics(businessData: any[], customerCount: number, orderData: any[]): Record<string, HealthMetric> {
    const revenue = orderData.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const avgOrderValue = orderData.length > 0 ? revenue / orderData.length : 0
    const orderFrequency = orderData.length / 30 // orders per day

    return {
      revenue: {
        name: 'Monthly Revenue',
        value: revenue,
        weight: 0.3,
        benchmark: 10000,
        trend: this.calculateMetricTrend(businessData, 'revenue')
      },
      customers: {
        name: 'Customer Count',
        value: customerCount,
        weight: 0.2,
        benchmark: 100,
        trend: this.calculateMetricTrend(businessData, 'customers')
      },
      avgOrderValue: {
        name: 'Average Order Value',
        value: avgOrderValue,
        weight: 0.2,
        benchmark: 100,
        trend: 0
      },
      orderFrequency: {
        name: 'Order Frequency',
        value: orderFrequency,
        weight: 0.15,
        benchmark: 5,
        trend: 0
      },
      customerRetention: {
        name: 'Customer Retention',
        value: this.calculateRetention(orderData),
        weight: 0.15,
        benchmark: 0.7,
        trend: 0
      }
    }
  }

  private calculateCategoryScores(metrics: Record<string, HealthMetric>) {
    return {
      revenue: this.scoreMetric(metrics.revenue) * 0.6 + this.scoreMetric(metrics.avgOrderValue) * 0.4,
      customers: this.scoreMetric(metrics.customers) * 0.7 + this.scoreMetric(metrics.customerRetention) * 0.3,
      operations: this.scoreMetric(metrics.orderFrequency),
      growth: Math.max(0, Math.min(100, (metrics.revenue.trend + 50) * 2))
    }
  }

  private scoreMetric(metric: HealthMetric): number {
    const ratio = metric.value / metric.benchmark
    let score = Math.min(100, ratio * 100)
    
    // Apply trend bonus/penalty
    if (metric.trend > 0) score *= 1.1
    else if (metric.trend < -10) score *= 0.9
    
    return Math.max(0, Math.min(100, score))
  }

  private calculateOverallScore(scores: any): number {
    return Math.round(
      scores.revenue * 0.35 +
      scores.customers * 0.25 +
      scores.operations * 0.2 +
      scores.growth * 0.2
    )
  }

  private async calculateTrends(tenantId: string, currentScore: number) {
    const { data: previousScores } = await this.supabase
      .from('business_health_history')
      .select('overall_score')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!previousScores || previousScores.length === 0) {
      return { direction: 'stable' as const, change: 0 }
    }

    const previousScore = previousScores[0].overall_score
    const change = currentScore - previousScore
    
    return {
      direction: (change > 2 ? 'up' : change < -2 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      change: Math.round(change * 10) / 10
    }
  }

  private generateRecommendations(scores: any, metrics: Record<string, HealthMetric>): string[] {
    const recommendations: string[] = []

    if (scores.revenue < 60) {
      recommendations.push('Focus on increasing revenue through promotions or new products')
    }
    
    if (scores.customers < 50) {
      recommendations.push('Implement customer acquisition campaigns')
    }
    
    if (metrics.customerRetention.value < 0.5) {
      recommendations.push('Improve customer retention with loyalty programs')
    }
    
    if (scores.operations < 70) {
      recommendations.push('Optimize operational efficiency and order processing')
    }

    return recommendations.slice(0, 3) // Top 3 recommendations
  }

  private calculateMetricTrend(data: any[], metricType: string): number {
    const metricData = data.filter(d => d.metric_type === metricType)
    if (metricData.length < 2) return 0

    const recent = metricData.slice(0, 7).reduce((sum, d) => sum + d.value, 0) / 7
    const older = metricData.slice(7, 14).reduce((sum, d) => sum + d.value, 0) / 7
    
    return older > 0 ? ((recent - older) / older) * 100 : 0
  }

  private calculateRetention(orderData: any[]): number {
    const customerOrders = new Map<string, number>()
    orderData.forEach(order => {
      const customerId = order.customer_id
      customerOrders.set(customerId, (customerOrders.get(customerId) || 0) + 1)
    })

    const repeatCustomers = Array.from(customerOrders.values()).filter(count => count > 1).length
    const totalCustomers = customerOrders.size
    
    return totalCustomers > 0 ? repeatCustomers / totalCustomers : 0
  }

  private async saveHealthScore(tenantId: string, score: BusinessHealthScore) {
    await this.supabase
      .from('business_health_history')
      .insert({
        tenant_id: tenantId,
        overall_score: score.overall,
        category_scores: score.categories,
        trends: score.trends,
        recommendations: score.recommendations,
        created_at: new Date()
      })
  }

  private getDefaultHealthScore(): BusinessHealthScore {
    return {
      overall: 50,
      categories: { revenue: 50, customers: 50, operations: 50, growth: 50 },
      trends: { direction: 'stable', change: 0 },
      recommendations: ['Start tracking your business metrics for better insights'],
      lastUpdated: new Date()
    }
  }
}

export const businessHealth = new BusinessHealthEngine()