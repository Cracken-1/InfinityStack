import { PricingPlan } from './types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter-monthly',
    name: 'Starter',
    tier: 'starter',
    price: 29,
    billing: 'monthly',
    features: ['Basic Dashboard', 'Up to 5 Users', '10GB Storage'],
    limits: { users: 5, storage: 10, apiCalls: 1000 }
  },
  {
    id: 'professional-monthly',
    name: 'Professional',
    tier: 'professional',
    price: 99,
    billing: 'monthly',
    features: ['Advanced Analytics', 'Up to 25 Users', '100GB Storage', 'API Access'],
    limits: { users: 25, storage: 100, apiCalls: 10000 }
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 299,
    billing: 'monthly',
    features: ['Custom Integrations', 'Unlimited Users', '1TB Storage', 'Priority Support'],
    limits: { users: -1, storage: 1000, apiCalls: 100000 }
  }
];

export const getPlanById = (id: string) => PRICING_PLANS.find(plan => plan.id === id);
export const getPlansByTier = (tier: string) => PRICING_PLANS.filter(plan => plan.tier === tier);