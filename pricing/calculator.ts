import { PricingPlan, UsageMetrics, CostBreakdown } from './types';
import { getPlanById } from './plans';

export class PricingCalculator {
  static calculateCost(planId: string, usage: UsageMetrics): CostBreakdown {
    const plan = getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const base = plan.price;
    let overages = 0;

    // Calculate overages
    if (plan.limits.users > 0 && usage.users > plan.limits.users) {
      overages += (usage.users - plan.limits.users) * 5; // $5 per extra user
    }
    
    if (usage.storage > plan.limits.storage) {
      overages += (usage.storage - plan.limits.storage) * 0.5; // $0.5 per GB
    }

    if (usage.apiCalls > plan.limits.apiCalls) {
      overages += Math.ceil((usage.apiCalls - plan.limits.apiCalls) / 1000) * 2; // $2 per 1k calls
    }

    return { base, overages, total: base + overages };
  }

  static getYearlySavings(planId: string): number {
    const plan = getPlanById(planId);
    return plan ? plan.price * 2 : 0; // 2 months free yearly
  }
}