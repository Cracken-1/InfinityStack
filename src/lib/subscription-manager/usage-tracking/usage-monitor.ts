export interface UsageEvent {
  id: string;
  tenantId: string;
  userId?: string;
  resourceType: string;
  action: string;
  quantity: number;
  unit: string;
  metadata: Record<string, any>;
  timestamp: string;
  billable: boolean;
}

export interface UsageQuota {
  id: string;
  tenantId: string;
  resourceType: string;
  limit: number;
  period: 'hourly' | 'daily' | 'monthly' | 'yearly';
  resetDate: string;
  currentUsage: number;
  warningThreshold: number; // percentage
  enabled: boolean;
}

export interface UsageAlert {
  id: string;
  tenantId: string;
  quotaId: string;
  type: 'warning' | 'limit_reached' | 'overage';
  message: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  triggeredAt: string;
  acknowledged: boolean;
}

export interface UsageAnalytics {
  tenantId: string;
  period: string;
  resourceBreakdown: Record<string, {
    usage: number;
    cost: number;
    trend: 'up' | 'down' | 'stable';
    projectedMonthly: number;
  }>;
  totalUsage: number;
  totalCost: number;
  efficiency: number;
  recommendations: string[];
}

export interface UsageProjection {
  resourceType: string;
  currentUsage: number;
  projectedUsage: number;
  projectedCost: number;
  confidence: number;
  factors: string[];
}

export class UsageMonitor {
  private events: UsageEvent[] = [];
  private quotas: Map<string, UsageQuota> = new Map();
  private alerts: Map<string, UsageAlert> = new Map();
  private aggregatedUsage: Map<string, Record<string, number>> = new Map();

  constructor() {
    this.startUsageAggregation();
    this.startQuotaMonitoring();
  }

  recordUsage(usage: Omit<UsageEvent, 'id' | 'timestamp'>): UsageEvent {
    const event: UsageEvent = {
      ...usage,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.events.push(event);
    this.updateAggregatedUsage(event);
    this.checkQuotas(event.tenantId, event.resourceType);

    // Keep only last 30 days of events
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => new Date(e.timestamp) > cutoff);

    return event;
  }

  createQuota(quota: Omit<UsageQuota, 'id' | 'currentUsage' | 'resetDate'>): UsageQuota {
    const newQuota: UsageQuota = {
      ...quota,
      id: crypto.randomUUID(),
      currentUsage: 0,
      resetDate: this.calculateResetDate(quota.period)
    };

    this.quotas.set(newQuota.id, newQuota);
    return newQuota;
  }

  private calculateResetDate(period: UsageQuota['period']): string {
    const now = new Date();
    
    switch (period) {
      case 'hourly':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1).toISOString();
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      case 'yearly':
        return new Date(now.getFullYear() + 1, 0, 1).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private updateAggregatedUsage(event: UsageEvent): void {
    const key = `${event.tenantId}_${event.resourceType}`;
    const current = this.aggregatedUsage.get(key) || {};
    
    const today = new Date().toISOString().split('T')[0];
    const thisHour = new Date().toISOString().substring(0, 13);
    const thisMonth = new Date().toISOString().substring(0, 7);

    current[`${today}_daily`] = (current[`${today}_daily`] || 0) + event.quantity;
    current[`${thisHour}_hourly`] = (current[`${thisHour}_hourly`] || 0) + event.quantity;
    current[`${thisMonth}_monthly`] = (current[`${thisMonth}_monthly`] || 0) + event.quantity;

    this.aggregatedUsage.set(key, current);
  }

  private checkQuotas(tenantId: string, resourceType: string): void {
    const relevantQuotas = Array.from(this.quotas.values())
      .filter(q => q.tenantId === tenantId && q.resourceType === resourceType && q.enabled);

    relevantQuotas.forEach(quota => {
      const currentUsage = this.getCurrentUsage(tenantId, resourceType, quota.period);
      quota.currentUsage = currentUsage;

      const percentage = (currentUsage / quota.limit) * 100;

      // Check for alerts
      if (percentage >= 100 && !this.hasActiveAlert(quota.id, 'limit_reached')) {
        this.createAlert(quota, 'limit_reached', currentUsage, percentage);
      } else if (percentage >= quota.warningThreshold && !this.hasActiveAlert(quota.id, 'warning')) {
        this.createAlert(quota, 'warning', currentUsage, percentage);
      }

      // Reset quota if period has passed
      if (new Date() >= new Date(quota.resetDate)) {
        quota.currentUsage = 0;
        quota.resetDate = this.calculateResetDate(quota.period);
      }
    });
  }

  private getCurrentUsage(tenantId: string, resourceType: string, period: UsageQuota['period']): number {
    const key = `${tenantId}_${resourceType}`;
    const usage = this.aggregatedUsage.get(key) || {};
    
    const now = new Date();
    let periodKey: string;

    switch (period) {
      case 'hourly':
        periodKey = `${now.toISOString().substring(0, 13)}_hourly`;
        break;
      case 'daily':
        periodKey = `${now.toISOString().split('T')[0]}_daily`;
        break;
      case 'monthly':
        periodKey = `${now.toISOString().substring(0, 7)}_monthly`;
        break;
      case 'yearly':
        // Sum all months in current year
        const year = now.getFullYear();
        return Object.entries(usage)
          .filter(([key]) => key.startsWith(`${year}`) && key.endsWith('_monthly'))
          .reduce((sum, [, value]) => sum + value, 0);
      default:
        return 0;
    }

    return usage[periodKey] || 0;
  }

  private hasActiveAlert(quotaId: string, type: UsageAlert['type']): boolean {
    return Array.from(this.alerts.values()).some(alert => 
      alert.quotaId === quotaId && 
      alert.type === type && 
      !alert.acknowledged
    );
  }

  private createAlert(quota: UsageQuota, type: UsageAlert['type'], currentUsage: number, percentage: number): void {
    const alert: UsageAlert = {
      id: crypto.randomUUID(),
      tenantId: quota.tenantId,
      quotaId: quota.id,
      type,
      message: this.generateAlertMessage(quota, type, currentUsage, percentage),
      currentUsage,
      limit: quota.limit,
      percentage,
      triggeredAt: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.set(alert.id, alert);
    this.notifyAlert(alert);
  }

  private generateAlertMessage(quota: UsageQuota, type: UsageAlert['type'], usage: number, percentage: number): string {
    const resourceName = quota.resourceType.replace('_', ' ').toUpperCase();
    
    switch (type) {
      case 'warning':
        return `${resourceName} usage is at ${percentage.toFixed(1)}% (${usage}/${quota.limit}) of your ${quota.period} limit`;
      case 'limit_reached':
        return `${resourceName} usage limit reached! You've used ${usage} of your ${quota.limit} ${quota.period} allowance`;
      case 'overage':
        return `${resourceName} usage exceeded! You've used ${usage} which is ${(usage - quota.limit)} over your ${quota.limit} limit`;
      default:
        return `${resourceName} usage alert`;
    }
  }

  private notifyAlert(alert: UsageAlert): void {
    console.warn(`🚨 USAGE ALERT [${alert.type.toUpperCase()}]: ${alert.message}`);
    
    // In production, integrate with notification systems
    // - Send email notifications
    // - Trigger webhooks
    // - Update dashboard alerts
    // - Send to monitoring systems
  }

  getUsageAnalytics(tenantId: string, period = 'monthly'): UsageAnalytics {
    const tenantEvents = this.events.filter(e => e.tenantId === tenantId);
    
    // Filter events by period
    const periodStart = this.getPeriodStart(period);
    const periodEvents = tenantEvents.filter(e => new Date(e.timestamp) >= periodStart);

    // Group by resource type
    const resourceBreakdown: Record<string, any> = {};
    
    periodEvents.forEach(event => {
      if (!resourceBreakdown[event.resourceType]) {
        resourceBreakdown[event.resourceType] = {
          usage: 0,
          cost: 0,
          events: []
        };
      }
      
      resourceBreakdown[event.resourceType].usage += event.quantity;
      resourceBreakdown[event.resourceType].cost += this.calculateEventCost(event);
      resourceBreakdown[event.resourceType].events.push(event);
    });

    // Calculate trends and projections
    Object.keys(resourceBreakdown).forEach(resourceType => {
      const resource = resourceBreakdown[resourceType];
      resource.trend = this.calculateTrend(tenantId, resourceType);
      resource.projectedMonthly = this.projectMonthlyUsage(resource.events);
      delete resource.events; // Remove events from final output
    });

    const totalUsage = Object.values(resourceBreakdown).reduce((sum: number, r: any) => sum + r.usage, 0);
    const totalCost = Object.values(resourceBreakdown).reduce((sum: number, r: any) => sum + r.cost, 0);

    return {
      tenantId,
      period: period,
      resourceBreakdown,
      totalUsage,
      totalCost,
      efficiency: this.calculateEfficiency(tenantId),
      recommendations: this.generateRecommendations(tenantId, resourceBreakdown)
    };
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart;
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    }
  }

  private calculateEventCost(event: UsageEvent): number {
    if (!event.billable) return 0;
    
    // Mock cost calculation - in production, use actual pricing
    const rates: Record<string, number> = {
      'api_calls': 0.001,
      'storage': 0.1,
      'ai_requests': 0.01,
      'bandwidth': 0.05
    };
    
    return (rates[event.resourceType] || 0) * event.quantity;
  }

  private calculateTrend(tenantId: string, resourceType: string): 'up' | 'down' | 'stable' {
    const recentEvents = this.events
      .filter(e => e.tenantId === tenantId && e.resourceType === resourceType)
      .slice(-20); // Last 20 events

    if (recentEvents.length < 10) return 'stable';

    const firstHalf = recentEvents.slice(0, 10);
    const secondHalf = recentEvents.slice(10);

    const firstHalfAvg = firstHalf.reduce((sum, e) => sum + e.quantity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, e) => sum + e.quantity, 0) / secondHalf.length;

    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  private projectMonthlyUsage(events: UsageEvent[]): number {
    if (events.length === 0) return 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();

    const monthlyEvents = events.filter(e => new Date(e.timestamp) >= monthStart);
    const currentUsage = monthlyEvents.reduce((sum, e) => sum + e.quantity, 0);

    return (currentUsage / daysPassed) * daysInMonth;
  }

  private calculateEfficiency(tenantId: string): number {
    // Mock efficiency calculation based on usage patterns
    const quotas = Array.from(this.quotas.values()).filter(q => q.tenantId === tenantId);
    
    if (quotas.length === 0) return 1;

    const utilizationRates = quotas.map(quota => {
      const utilization = quota.currentUsage / quota.limit;
      return Math.min(utilization, 1); // Cap at 100%
    });

    const avgUtilization = utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length;
    
    // Efficiency is higher when utilization is closer to optimal range (60-80%)
    const optimal = 0.7;
    const distance = Math.abs(avgUtilization - optimal);
    return Math.max(0, 1 - distance);
  }

  private generateRecommendations(tenantId: string, resourceBreakdown: Record<string, any>): string[] {
    const recommendations: string[] = [];

    Object.entries(resourceBreakdown).forEach(([resourceType, data]) => {
      if (data.trend === 'up' && data.projectedMonthly > data.usage * 2) {
        recommendations.push(`Consider upgrading your ${resourceType} plan - usage is trending up significantly`);
      }
      
      if (data.usage === 0) {
        recommendations.push(`You're not using ${resourceType} - consider downgrading to save costs`);
      }
    });

    const efficiency = this.calculateEfficiency(tenantId);
    if (efficiency < 0.5) {
      recommendations.push('Your resource utilization is low - consider optimizing your usage patterns');
    }

    return recommendations;
  }

  generateUsageProjections(tenantId: string): UsageProjection[] {
    const resourceTypes = Array.from(new Set(this.events
      .filter(e => e.tenantId === tenantId)
      .map(e => e.resourceType)));

    return resourceTypes.map(resourceType => {
      const recentEvents = this.events
        .filter(e => e.tenantId === tenantId && e.resourceType === resourceType)
        .slice(-30); // Last 30 events

      const currentUsage = this.getCurrentUsage(tenantId, resourceType, 'monthly');
      const projectedUsage = this.projectMonthlyUsage(recentEvents);
      const projectedCost = projectedUsage * this.calculateEventCost({
        resourceType,
        quantity: 1,
        billable: true
      } as UsageEvent);

      return {
        resourceType,
        currentUsage,
        projectedUsage,
        projectedCost,
        confidence: Math.min(0.9, recentEvents.length / 30), // Higher confidence with more data
        factors: this.getProjectionFactors(resourceType, recentEvents)
      };
    });
  }

  private getProjectionFactors(resourceType: string, events: UsageEvent[]): string[] {
    const factors: string[] = [];
    
    // Analyze usage patterns
    const hourlyDistribution = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourlyDistribution)
      .sort(([,a], [,b]) => b - a)[0];

    if (peakHour) {
      factors.push(`Peak usage at ${peakHour[0]}:00`);
    }

    // Check for growth trends
    const trend = this.calculateTrend('', resourceType);
    if (trend !== 'stable') {
      factors.push(`Usage trending ${trend}`);
    }

    // Check for seasonal patterns
    if (events.length > 7) {
      factors.push('Historical usage patterns');
    }

    return factors;
  }

  private startUsageAggregation(): void {
    // Aggregate usage data every minute
    setInterval(() => {
      this.aggregateUsageData();
    }, 60000);
  }

  private startQuotaMonitoring(): void {
    // Check quotas every 5 minutes
    setInterval(() => {
      this.monitorAllQuotas();
    }, 300000);
  }

  private aggregateUsageData(): void {
    // Clean up old aggregated data
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
    
    this.aggregatedUsage.forEach((usage, key) => {
      Object.keys(usage).forEach(periodKey => {
        const [dateTime] = periodKey.split('_');
        if (new Date(dateTime) < cutoff) {
          delete usage[periodKey];
        }
      });
    });
  }

  private monitorAllQuotas(): void {
    Array.from(this.quotas.values()).forEach(quota => {
      if (quota.enabled) {
        this.checkQuotas(quota.tenantId, quota.resourceType);
      }
    });
  }

  getUsageEvents(tenantId: string, resourceType?: string, limit = 100): UsageEvent[] {
    let events = this.events.filter(e => e.tenantId === tenantId);
    
    if (resourceType) {
      events = events.filter(e => e.resourceType === resourceType);
    }
    
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getQuotas(tenantId: string): UsageQuota[] {
    return Array.from(this.quotas.values()).filter(q => q.tenantId === tenantId);
  }

  getAlerts(tenantId: string, acknowledged = false): UsageAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.tenantId === tenantId && a.acknowledged === acknowledged)
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  updateQuota(quotaId: string, updates: Partial<UsageQuota>): UsageQuota | null {
    const quota = this.quotas.get(quotaId);
    if (!quota) return null;

    Object.assign(quota, updates);
    return quota;
  }

  deleteQuota(quotaId: string): boolean {
    return this.quotas.delete(quotaId);
  }
}