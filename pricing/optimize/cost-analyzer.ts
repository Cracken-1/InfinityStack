import { UsageMetrics, CostBreakdown } from '../types';
import { PricingCalculator } from '../calculator';
import { PRICING_PLANS } from '../plans';

export class CostAnalyzer {
  static analyzeUsage(currentPlanId: string, usage: UsageMetrics) {
    const currentCost = PricingCalculator.calculateCost(currentPlanId, usage);
    
    // Find optimal plan
    const alternatives = PRICING_PLANS.map(plan => ({
      plan,
      cost: PricingCalculator.calculateCost(plan.id, usage)
    })).sort((a, b) => a.cost.total - b.cost.total);

    const optimal = alternatives[0];
    const savings = currentCost.total - optimal.cost.total;

    return {
      current: { planId: currentPlanId, cost: currentCost },
      optimal: { planId: optimal.plan.id, cost: optimal.cost },
      savings: savings > 0 ? savings : 0,
      alternatives: alternatives.slice(0, 3)
    };
  }

  static getUsageEfficiency(planId: string, usage: UsageMetrics): number {
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) return 0;

    const userEfficiency = plan.limits.users > 0 ? usage.users / plan.limits.users : 1;
    const storageEfficiency = usage.storage / plan.limits.storage;
    
    return Math.min((userEfficiency + storageEfficiency) / 2, 1);
  }
}