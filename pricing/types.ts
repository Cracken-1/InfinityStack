export type PricingTier = 'starter' | 'professional' | 'enterprise';

export interface PricingPlan {
  id: string;
  name: string;
  tier: PricingTier;
  price: number;
  billing: 'monthly' | 'yearly';
  features: string[];
  limits: {
    users: number;
    storage: number; // GB
    apiCalls: number;
  };
}

export interface UsageMetrics {
  users: number;
  storage: number;
  apiCalls: number;
  period: string;
}

export interface CostBreakdown {
  base: number;
  overages: number;
  total: number;
  savings?: number;
}