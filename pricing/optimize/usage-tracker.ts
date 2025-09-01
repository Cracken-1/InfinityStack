import { UsageMetrics } from '../types';

export class UsageTracker {
  static trackUsage(tenantId: string, metrics: Partial<UsageMetrics>) {
    // Minimal tracking implementation
    const timestamp = new Date().toISOString();
    const usage = {
      tenantId,
      timestamp,
      ...metrics
    };
    
    // In production, this would save to database
    console.log('Usage tracked:', usage);
    return usage;
  }

  static getUsageTrends(tenantId: string, days: number = 30): UsageMetrics[] {
    // Mock trend data - in production, fetch from database
    const trends: UsageMetrics[] = [];
    for (let i = 0; i < days; i++) {
      trends.push({
        users: Math.floor(Math.random() * 20) + 5,
        storage: Math.floor(Math.random() * 50) + 10,
        apiCalls: Math.floor(Math.random() * 5000) + 1000,
        period: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    return trends.reverse();
  }

  static predictUsage(trends: UsageMetrics[]): UsageMetrics {
    if (trends.length === 0) return { users: 0, storage: 0, apiCalls: 0, period: '' };
    
    const latest = trends[trends.length - 1];
    const growth = trends.length > 1 ? 
      (latest.users - trends[0].users) / trends.length : 0;
    
    return {
      users: Math.max(latest.users + growth * 7, latest.users),
      storage: latest.storage * 1.1,
      apiCalls: latest.apiCalls * 1.15,
      period: 'next-week'
    };
  }
}