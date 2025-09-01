import { UsageMetrics } from '../types';
import { CostAnalyzer } from './cost-analyzer';

export interface Recommendation {
  type: 'upgrade' | 'downgrade' | 'optimize';
  title: string;
  description: string;
  savings: number;
  action: string;
}

export class RecommendationEngine {
  static generateRecommendations(planId: string, usage: UsageMetrics): Recommendation[] {
    const analysis = CostAnalyzer.analyzeUsage(planId, usage);
    const efficiency = CostAnalyzer.getUsageEfficiency(planId, usage);
    const recommendations: Recommendation[] = [];

    // Plan optimization
    if (analysis.savings > 0) {
      recommendations.push({
        type: analysis.optimal.cost.total < analysis.current.cost.total ? 'downgrade' : 'upgrade',
        title: 'Switch to Optimal Plan',
        description: `Switch to ${analysis.optimal.planId} to reduce costs`,
        savings: analysis.savings,
        action: `Change plan to ${analysis.optimal.planId}`
      });
    }

    // Usage optimization
    if (efficiency < 0.5) {
      recommendations.push({
        type: 'optimize',
        title: 'Optimize Resource Usage',
        description: 'You are underutilizing your current plan resources',
        savings: 0,
        action: 'Consider downgrading or increasing usage'
      });
    }

    // Yearly billing
    const yearlySavings = analysis.current.cost.total * 2;
    recommendations.push({
      type: 'optimize',
      title: 'Switch to Yearly Billing',
      description: 'Save 2 months by switching to annual billing',
      savings: yearlySavings,
      action: 'Switch to yearly billing cycle'
    });

    return recommendations;
  }
}