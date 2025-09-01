import { createClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface SmartNotification {
  id: string
  tenantId: string
  userId: string
  type: 'alert' | 'insight' | 'action' | 'milestone'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  data?: Record<string, any>
  actionUrl?: string
  dismissed: boolean
  createdAt: Date
}

export interface NotificationRule {
  id: string
  tenantId: string
  trigger: string
  condition: Record<string, any>
  template: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
}

class SmartNotificationEngine {
  private supabase = createClient()

  async processBusinessEvent(tenantId: string, eventType: string, data: Record<string, any>) {
    try {
      const rules = await this.getActiveRules(tenantId, eventType)
      
      for (const rule of rules) {
        if (this.evaluateCondition(rule.condition, data)) {
          await this.createNotification(tenantId, rule, data)
        }
      }
    } catch (error) {
      logger.error('Smart notification processing error:', error as Error)
    }
  }

  async getNotifications(tenantId: string, userId: string, limit = 20): Promise<SmartNotification[]> {
    const { data } = await this.supabase
      .from('smart_notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('dismissed', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    return data || []
  }

  async dismissNotification(notificationId: string) {
    await this.supabase
      .from('smart_notifications')
      .update({ dismissed: true })
      .eq('id', notificationId)
  }

  private async getActiveRules(tenantId: string, eventType: string): Promise<NotificationRule[]> {
    const { data } = await this.supabase
      .from('notification_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('trigger', eventType)
      .eq('enabled', true)

    return data || []
  }

  private evaluateCondition(condition: Record<string, any>, data: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(condition)) {
      const actualValue = this.getNestedValue(data, key)
      
      if (typeof expectedValue === 'object' && expectedValue.operator) {
        if (!this.evaluateOperator(actualValue, expectedValue.operator, expectedValue.value)) {
          return false
        }
      } else if (actualValue !== expectedValue) {
        return false
      }
    }
    return true
  }

  private evaluateOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'gt': return actual > expected
      case 'lt': return actual < expected
      case 'gte': return actual >= expected
      case 'lte': return actual <= expected
      case 'eq': return actual === expected
      case 'ne': return actual !== expected
      case 'contains': return String(actual).includes(expected)
      default: return false
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private async createNotification(tenantId: string, rule: NotificationRule, data: Record<string, any>) {
    const notification: Partial<SmartNotification> = {
      tenantId: tenantId,
      userId: data.userId || 'system',
      type: this.getNotificationType(rule.trigger),
      priority: rule.priority,
      title: this.processTemplate(rule.template, data, 'title'),
      message: this.processTemplate(rule.template, data, 'message'),
      data: data,
      dismissed: false,
      createdAt: new Date()
    }

    await this.supabase
      .from('smart_notifications')
      .insert(notification)
  }

  private getNotificationType(trigger: string): 'alert' | 'insight' | 'action' | 'milestone' {
    if (trigger.includes('error') || trigger.includes('failure')) return 'alert'
    if (trigger.includes('milestone') || trigger.includes('achievement')) return 'milestone'
    if (trigger.includes('recommendation') || trigger.includes('insight')) return 'insight'
    return 'action'
  }

  private processTemplate(template: string, data: Record<string, any>, type: 'title' | 'message'): string {
    const templates = {
      revenue_drop: {
        title: 'Revenue Alert',
        message: 'Revenue has dropped by {percentage}% in the last {period}'
      },
      new_customer: {
        title: 'New Customer',
        message: 'Welcome {customerName}! They joined via {source}'
      },
      inventory_low: {
        title: 'Low Inventory',
        message: '{productName} is running low ({quantity} remaining)'
      }
    }

    const templateData = templates[template as keyof typeof templates]
    if (!templateData) return `${type}: ${template}`

    let text = templateData[type]
    Object.entries(data).forEach(([key, value]) => {
      text = text.replace(`{${key}}`, String(value))
    })

    return text
  }
}

export const smartNotifications = new SmartNotificationEngine()

// Default notification rules
export const defaultNotificationRules: Omit<NotificationRule, 'id' | 'tenantId'>[] = [
  {
    trigger: 'revenue_change',
    condition: { 'change.percentage': { operator: 'lt', value: -10 } },
    template: 'revenue_drop',
    priority: 'high',
    enabled: true
  },
  {
    trigger: 'customer_registered',
    condition: {},
    template: 'new_customer',
    priority: 'medium',
    enabled: true
  },
  {
    trigger: 'inventory_update',
    condition: { 'inventory.quantity': { operator: 'lt', value: 10 } },
    template: 'inventory_low',
    priority: 'medium',
    enabled: true
  }
]