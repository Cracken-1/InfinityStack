export interface SubscriptionTier {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: FeatureAccess[];
  limits: UsageLimits;
  trial: {
    enabled: boolean;
    duration: number; // days
    features: string[];
  };
  popular?: boolean;
  enterprise?: boolean;
  customPricing?: boolean;
}

export interface FeatureAccess {
  featureId: string;
  enabled: boolean;
  limit?: number;
  restrictions?: string[];
}

export interface UsageLimits {
  users: number;
  storage: number; // GB
  apiCalls: number;
  aiRequests: number;
  dashboards: number;
  integrations: number;
  workflows: number;
  reports: number;
  customFields: number;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  tierId: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
  paymentMethod?: string;
  discounts: SubscriptionDiscount[];
  addOns: SubscriptionAddOn[];
  usage: CurrentUsage;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDiscount {
  id: string;
  type: 'percentage' | 'fixed' | 'free_months';
  value: number;
  description: string;
  validUntil?: string;
  appliedAt: string;
}

export interface SubscriptionAddOn {
  id: string;
  name: string;
  type: 'users' | 'storage' | 'api_calls' | 'feature';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CurrentUsage {
  users: number;
  storage: number;
  apiCalls: number;
  aiRequests: number;
  dashboards: number;
  integrations: number;
  workflows: number;
  reports: number;
  period: string;
  lastUpdated: string;
}

export class TierManager {
  private tiers: Map<string, SubscriptionTier> = new Map();
  private subscriptions: Map<string, TenantSubscription> = new Map();
  private featureGates: Map<string, boolean> = new Map();

  constructor() {
    this.initializeDefaultTiers();
  }

  private initializeDefaultTiers(): void {
    const tiers: SubscriptionTier[] = [
      {
        id: 'free',
        name: 'free',
        displayName: 'Free',
        description: 'Perfect for getting started',
        price: { monthly: 0, yearly: 0, currency: 'USD' },
        features: [
          { featureId: 'basic_dashboard', enabled: true },
          { featureId: 'basic_analytics', enabled: true },
          { featureId: 'api_access', enabled: true, limit: 1000 },
          { featureId: 'ai_assistant', enabled: true, limit: 50 },
          { featureId: 'integrations', enabled: false },
          { featureId: 'advanced_reports', enabled: false },
          { featureId: 'white_labeling', enabled: false },
          { featureId: 'sso', enabled: false },
          { featureId: 'priority_support', enabled: false }
        ],
        limits: {
          users: 3,
          storage: 1, // 1GB
          apiCalls: 1000,
          aiRequests: 50,
          dashboards: 2,
          integrations: 0,
          workflows: 1,
          reports: 5,
          customFields: 10
        },
        trial: { enabled: false, duration: 0, features: [] }
      },
      {
        id: 'starter',
        name: 'starter',
        displayName: 'Starter',
        description: 'Great for small teams',
        price: { monthly: 29, yearly: 290, currency: 'USD' },
        features: [
          { featureId: 'basic_dashboard', enabled: true },
          { featureId: 'basic_analytics', enabled: true },
          { featureId: 'api_access', enabled: true, limit: 10000 },
          { featureId: 'ai_assistant', enabled: true, limit: 500 },
          { featureId: 'integrations', enabled: true, limit: 3 },
          { featureId: 'advanced_reports', enabled: true, limit: 10 },
          { featureId: 'white_labeling', enabled: false },
          { featureId: 'sso', enabled: false },
          { featureId: 'priority_support', enabled: true }
        ],
        limits: {
          users: 10,
          storage: 10,
          apiCalls: 10000,
          aiRequests: 500,
          dashboards: 5,
          integrations: 3,
          workflows: 5,
          reports: 25,
          customFields: 50
        },
        trial: { enabled: true, duration: 14, features: ['all_starter_features'] },
        popular: true
      },
      {
        id: 'professional',
        name: 'professional',
        displayName: 'Professional',
        description: 'Perfect for growing businesses',
        price: { monthly: 99, yearly: 990, currency: 'USD' },
        features: [
          { featureId: 'basic_dashboard', enabled: true },
          { featureId: 'advanced_dashboard', enabled: true },
          { featureId: 'basic_analytics', enabled: true },
          { featureId: 'advanced_analytics', enabled: true },
          { featureId: 'api_access', enabled: true, limit: 100000 },
          { featureId: 'ai_assistant', enabled: true, limit: 5000 },
          { featureId: 'integrations', enabled: true, limit: 10 },
          { featureId: 'advanced_reports', enabled: true },
          { featureId: 'white_labeling', enabled: true },
          { featureId: 'sso', enabled: true },
          { featureId: 'priority_support', enabled: true },
          { featureId: 'custom_workflows', enabled: true }
        ],
        limits: {
          users: 50,
          storage: 100,
          apiCalls: 100000,
          aiRequests: 5000,
          dashboards: 25,
          integrations: 10,
          workflows: 25,
          reports: 100,
          customFields: 200
        },
        trial: { enabled: true, duration: 30, features: ['all_professional_features'] }
      },
      {
        id: 'enterprise',
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'For large organizations',
        price: { monthly: 299, yearly: 2990, currency: 'USD' },
        features: [
          { featureId: 'basic_dashboard', enabled: true },
          { featureId: 'advanced_dashboard', enabled: true },
          { featureId: 'basic_analytics', enabled: true },
          { featureId: 'advanced_analytics', enabled: true },
          { featureId: 'api_access', enabled: true },
          { featureId: 'ai_assistant', enabled: true },
          { featureId: 'integrations', enabled: true },
          { featureId: 'advanced_reports', enabled: true },
          { featureId: 'white_labeling', enabled: true },
          { featureId: 'sso', enabled: true },
          { featureId: 'priority_support', enabled: true },
          { featureId: 'custom_workflows', enabled: true },
          { featureId: 'dedicated_support', enabled: true },
          { featureId: 'custom_integrations', enabled: true },
          { featureId: 'advanced_security', enabled: true }
        ],
        limits: {
          users: -1, // unlimited
          storage: 1000,
          apiCalls: -1,
          aiRequests: -1,
          dashboards: -1,
          integrations: -1,
          workflows: -1,
          reports: -1,
          customFields: -1
        },
        trial: { enabled: true, duration: 30, features: ['all_enterprise_features'] },
        enterprise: true
      },
      {
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        description: 'Tailored for your specific needs',
        price: { monthly: 0, yearly: 0, currency: 'USD' },
        features: [], // Configured per customer
        limits: {
          users: -1,
          storage: -1,
          apiCalls: -1,
          aiRequests: -1,
          dashboards: -1,
          integrations: -1,
          workflows: -1,
          reports: -1,
          customFields: -1
        },
        trial: { enabled: true, duration: 60, features: [] },
        customPricing: true
      }
    ];

    tiers.forEach(tier => this.tiers.set(tier.id, tier));
  }

  createSubscription(tenantId: string, tierId: string, billingCycle: 'monthly' | 'yearly'): TenantSubscription {
    const tier = this.tiers.get(tierId);
    if (!tier) throw new Error('Invalid tier');

    const now = new Date();
    const endDate = new Date(now);
    
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription: TenantSubscription = {
      id: crypto.randomUUID(),
      tenantId,
      tierId,
      status: tier.trial.enabled ? 'trial' : 'active',
      billingCycle,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      trialEndDate: tier.trial.enabled ? 
        new Date(now.getTime() + tier.trial.duration * 24 * 60 * 60 * 1000).toISOString() : 
        undefined,
      autoRenew: true,
      discounts: [],
      addOns: [],
      usage: {
        users: 0,
        storage: 0,
        apiCalls: 0,
        aiRequests: 0,
        dashboards: 0,
        integrations: 0,
        workflows: 0,
        reports: 0,
        period: now.toISOString().substring(0, 7), // YYYY-MM
        lastUpdated: now.toISOString()
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.subscriptions.set(tenantId, subscription);
    return subscription;
  }

  upgradeSubscription(tenantId: string, newTierId: string): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    const newTier = this.tiers.get(newTierId);
    if (!newTier) throw new Error('Invalid tier');

    // Calculate prorated amount and new end date
    const now = new Date();
    subscription.tierId = newTierId;
    subscription.status = 'active';
    subscription.updatedAt = now.toISOString();

    // Reset trial if upgrading from trial
    if ((subscription as any).status === 'trial') {
      subscription.trialEndDate = undefined;
    }

    return subscription;
  }

  downgradeSubscription(tenantId: string, newTierId: string): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    // Schedule downgrade for end of current billing period
    subscription.tierId = newTierId;
    subscription.updatedAt = new Date().toISOString();

    return subscription;
  }

  addSubscriptionAddOn(tenantId: string, addOn: Omit<SubscriptionAddOn, 'id'>): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    const newAddOn: SubscriptionAddOn = {
      ...addOn,
      id: crypto.randomUUID()
    };

    subscription.addOns.push(newAddOn);
    subscription.updatedAt = new Date().toISOString();

    return subscription;
  }

  applyDiscount(tenantId: string, discount: Omit<SubscriptionDiscount, 'id' | 'appliedAt'>): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    const newDiscount: SubscriptionDiscount = {
      ...discount,
      id: crypto.randomUUID(),
      appliedAt: new Date().toISOString()
    };

    subscription.discounts.push(newDiscount);
    subscription.updatedAt = new Date().toISOString();

    return subscription;
  }

  calculateSubscriptionCost(tenantId: string): {
    basePrice: number;
    addOnsCost: number;
    discounts: number;
    totalCost: number;
    nextBillingDate: string;
  } {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    const tier = this.tiers.get(subscription.tierId);
    if (!tier) throw new Error('Tier not found');

    const basePrice = subscription.billingCycle === 'monthly' ? 
      tier.price.monthly : tier.price.yearly;

    const addOnsCost = subscription.addOns.reduce((sum, addOn) => sum + addOn.totalPrice, 0);

    let discounts = 0;
    subscription.discounts.forEach(discount => {
      if (!discount.validUntil || new Date(discount.validUntil) > new Date()) {
        if (discount.type === 'percentage') {
          discounts += (basePrice + addOnsCost) * (discount.value / 100);
        } else if (discount.type === 'fixed') {
          discounts += discount.value;
        }
      }
    });

    return {
      basePrice,
      addOnsCost,
      discounts,
      totalCost: Math.max(0, basePrice + addOnsCost - discounts),
      nextBillingDate: subscription.endDate
    };
  }

  updateUsage(tenantId: string, usage: Partial<CurrentUsage>): void {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) return;

    subscription.usage = {
      ...subscription.usage,
      ...usage,
      lastUpdated: new Date().toISOString()
    };
  }

  checkUsageLimits(tenantId: string): {
    withinLimits: boolean;
    violations: Array<{ limit: string; current: number; max: number; percentage: number }>;
    warnings: Array<{ limit: string; current: number; max: number; percentage: number }>;
  } {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    const tier = this.tiers.get(subscription.tierId);
    if (!tier) throw new Error('Tier not found');

    const violations: any[] = [];
    const warnings: any[] = [];

    Object.entries(tier.limits).forEach(([key, limit]) => {
      if (limit === -1) return; // Unlimited

      const current = subscription.usage[key as keyof CurrentUsage] as number;
      const percentage = (current / limit) * 100;

      if (current > limit) {
        violations.push({ limit: key, current, max: limit, percentage });
      } else if (percentage > 80) {
        warnings.push({ limit: key, current, max: limit, percentage });
      }
    });

    return {
      withinLimits: violations.length === 0,
      violations,
      warnings
    };
  }

  getTiers(): SubscriptionTier[] {
    return Array.from(this.tiers.values());
  }

  getTier(tierId: string): SubscriptionTier | null {
    return this.tiers.get(tierId) || null;
  }

  getSubscription(tenantId: string): TenantSubscription | null {
    return this.subscriptions.get(tenantId) || null;
  }

  isFeatureEnabled(tenantId: string, featureId: string): boolean {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) return false;

    const tier = this.tiers.get(subscription.tierId);
    if (!tier) return false;

    const feature = tier.features.find(f => f.featureId === featureId);
    return feature?.enabled || false;
  }

  getFeatureLimit(tenantId: string, featureId: string): number | null {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) return null;

    const tier = this.tiers.get(subscription.tierId);
    if (!tier) return null;

    const feature = tier.features.find(f => f.featureId === featureId);
    return feature?.limit || null;
  }

  cancelSubscription(tenantId: string, immediate = false): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    if (immediate) {
      subscription.status = 'cancelled';
      subscription.endDate = new Date().toISOString();
    } else {
      subscription.autoRenew = false;
      // Will be cancelled at end of billing period
    }

    subscription.updatedAt = new Date().toISOString();
    return subscription;
  }

  reactivateSubscription(tenantId: string): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.status = 'active';
    subscription.autoRenew = true;
    subscription.updatedAt = new Date().toISOString();

    return subscription;
  }

  getSubscriptionAnalytics(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    churnRate: number;
    averageRevenuePerUser: number;
    tierDistribution: Record<string, number>;
  } {
    const subscriptions = Array.from(this.subscriptions.values());
    const active = subscriptions.filter(s => s.status === 'active');
    const trials = subscriptions.filter(s => s.status === 'trial');

    const tierDistribution = subscriptions.reduce((acc, sub) => {
      acc[sub.tierId] = (acc[sub.tierId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = subscriptions.reduce((sum, sub) => {
      const cost = this.calculateSubscriptionCost(sub.tenantId);
      return sum + cost.totalCost;
    }, 0);

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: active.length,
      trialSubscriptions: trials.length,
      churnRate: 0.05, // Mock 5% churn rate
      averageRevenuePerUser: subscriptions.length > 0 ? totalRevenue / subscriptions.length : 0,
      tierDistribution
    };
  }
}