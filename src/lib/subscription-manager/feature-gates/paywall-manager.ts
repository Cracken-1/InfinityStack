export interface PaywallConfig {
  id: string;
  name: string;
  type: 'hard' | 'soft' | 'metered' | 'freemium';
  trigger: PaywallTrigger;
  presentation: PaywallPresentation;
  actions: PaywallAction[];
  targeting: PaywallTargeting;
  enabled: boolean;
  createdAt: string;
}

export interface PaywallTrigger {
  type: 'usage_limit' | 'feature_access' | 'time_based' | 'action_based';
  conditions: {
    feature?: string;
    usageType?: string;
    threshold?: number;
    timeframe?: string;
    actions?: string[];
  };
}

export interface PaywallPresentation {
  title: string;
  message: string;
  style: 'modal' | 'banner' | 'inline' | 'redirect';
  design: {
    theme: 'light' | 'dark' | 'branded';
    position: 'center' | 'top' | 'bottom';
    dismissible: boolean;
    showProgress?: boolean;
  };
  content: {
    benefits: string[];
    comparison?: TierComparison[];
    testimonials?: string[];
    urgency?: string;
  };
}

export interface PaywallAction {
  type: 'upgrade' | 'trial' | 'contact_sales' | 'learn_more' | 'dismiss';
  label: string;
  targetTier?: string;
  url?: string;
  primary: boolean;
}

export interface PaywallTargeting {
  userSegments: string[];
  excludeTrials: boolean;
  excludeRecentUpgrades: boolean;
  frequency: {
    maxPerDay: number;
    maxPerWeek: number;
    cooldownHours: number;
  };
}

export interface TierComparison {
  feature: string;
  currentTier: string | number;
  targetTier: string | number;
  highlight: boolean;
}

export interface PaywallEvent {
  id: string;
  tenantId: string;
  userId: string;
  paywallId: string;
  action: 'shown' | 'dismissed' | 'upgraded' | 'trial_started' | 'contact_requested';
  context: Record<string, any>;
  timestamp: string;
}

export interface FeatureGate {
  featureId: string;
  requiredTier: string;
  gracePeriod?: number; // days
  softLimit?: number;
  hardLimit?: number;
  paywallId?: string;
}

export class PaywallManager {
  private paywalls: Map<string, PaywallConfig> = new Map();
  private featureGates: Map<string, FeatureGate> = new Map();
  private events: PaywallEvent[] = [];
  private userInteractions: Map<string, { lastShown: string; count: number }> = new Map();

  constructor() {
    this.initializeDefaultPaywalls();
    this.initializeFeatureGates();
  }

  private initializeDefaultPaywalls(): void {
    const paywalls: PaywallConfig[] = [
      {
        id: 'api_limit_reached',
        name: 'API Limit Reached',
        type: 'hard',
        trigger: {
          type: 'usage_limit',
          conditions: {
            usageType: 'api_calls',
            threshold: 100 // 100% of limit
          }
        },
        presentation: {
          title: 'API Limit Reached',
          message: 'You\'ve reached your monthly API limit. Upgrade to continue using our services.',
          style: 'modal',
          design: {
            theme: 'branded',
            position: 'center',
            dismissible: false,
            showProgress: true
          },
          content: {
            benefits: [
              '10x more API calls',
              'Priority support',
              'Advanced analytics',
              'Custom integrations'
            ],
            urgency: 'Upgrade now to avoid service interruption'
          }
        },
        actions: [
          { type: 'upgrade', label: 'Upgrade Now', targetTier: 'professional', primary: true },
          { type: 'contact_sales', label: 'Contact Sales', primary: false }
        ],
        targeting: {
          userSegments: ['free', 'starter'],
          excludeTrials: false,
          excludeRecentUpgrades: true,
          frequency: {
            maxPerDay: 3,
            maxPerWeek: 10,
            cooldownHours: 4
          }
        },
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ai_usage_warning',
        name: 'AI Usage Warning',
        type: 'soft',
        trigger: {
          type: 'usage_limit',
          conditions: {
            usageType: 'ai_requests',
            threshold: 80 // 80% of limit
          }
        },
        presentation: {
          title: 'AI Usage Alert',
          message: 'You\'re approaching your AI request limit. Consider upgrading for unlimited access.',
          style: 'banner',
          design: {
            theme: 'light',
            position: 'top',
            dismissible: true,
            showProgress: true
          },
          content: {
            benefits: [
              'Unlimited AI requests',
              'Advanced AI models',
              'Priority processing',
              'Custom AI training'
            ]
          }
        },
        actions: [
          { type: 'upgrade', label: 'Upgrade', targetTier: 'professional', primary: true },
          { type: 'learn_more', label: 'Learn More', url: '/pricing', primary: false },
          { type: 'dismiss', label: 'Dismiss', primary: false }
        ],
        targeting: {
          userSegments: ['free', 'starter'],
          excludeTrials: true,
          excludeRecentUpgrades: true,
          frequency: {
            maxPerDay: 2,
            maxPerWeek: 5,
            cooldownHours: 8
          }
        },
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'premium_feature_gate',
        name: 'Premium Feature Access',
        type: 'freemium',
        trigger: {
          type: 'feature_access',
          conditions: {
            feature: 'advanced_analytics'
          }
        },
        presentation: {
          title: 'Unlock Advanced Analytics',
          message: 'Get deeper insights with our advanced analytics suite.',
          style: 'modal',
          design: {
            theme: 'branded',
            position: 'center',
            dismissible: true
          },
          content: {
            benefits: [
              'Custom dashboards',
              'Predictive analytics',
              'Real-time insights',
              'Export capabilities'
            ],
            comparison: [
              { feature: 'Basic Reports', currentTier: '5', targetTier: 'Unlimited', highlight: false },
              { feature: 'Custom Dashboards', currentTier: '❌', targetTier: '✅', highlight: true },
              { feature: 'AI Insights', currentTier: '❌', targetTier: '✅', highlight: true },
              { feature: 'Data Export', currentTier: 'CSV', targetTier: 'All Formats', highlight: false }
            ]
          }
        },
        actions: [
          { type: 'trial', label: 'Start Free Trial', targetTier: 'professional', primary: true },
          { type: 'upgrade', label: 'Upgrade Now', targetTier: 'professional', primary: false },
          { type: 'dismiss', label: 'Maybe Later', primary: false }
        ],
        targeting: {
          userSegments: ['free', 'starter'],
          excludeTrials: false,
          excludeRecentUpgrades: false,
          frequency: {
            maxPerDay: 1,
            maxPerWeek: 3,
            cooldownHours: 24
          }
        },
        enabled: true,
        createdAt: new Date().toISOString()
      }
    ];

    paywalls.forEach(paywall => this.paywalls.set(paywall.id, paywall));
  }

  private initializeFeatureGates(): void {
    const gates: FeatureGate[] = [
      { featureId: 'advanced_analytics', requiredTier: 'professional', paywallId: 'premium_feature_gate' },
      { featureId: 'white_labeling', requiredTier: 'professional' },
      { featureId: 'sso', requiredTier: 'professional' },
      { featureId: 'custom_integrations', requiredTier: 'enterprise' },
      { featureId: 'dedicated_support', requiredTier: 'enterprise' },
      { featureId: 'api_access', requiredTier: 'free', softLimit: 1000, hardLimit: 1200, paywallId: 'api_limit_reached' },
      { featureId: 'ai_assistant', requiredTier: 'free', softLimit: 40, hardLimit: 50, paywallId: 'ai_usage_warning' }
    ];

    gates.forEach(gate => this.featureGates.set(gate.featureId, gate));
  }

  async checkFeatureAccess(tenantId: string, userId: string, featureId: string, context?: Record<string, any>): Promise<{
    allowed: boolean;
    paywall?: PaywallConfig;
    reason?: string;
    gracePeriod?: number;
  }> {
    const gate = this.featureGates.get(featureId);
    if (!gate) {
      return { allowed: true }; // No gate = allowed
    }

    // Check if user has required tier (this would integrate with TierManager)
    const hasRequiredTier = await this.checkTierAccess(tenantId, gate.requiredTier);
    
    if (hasRequiredTier) {
      return { allowed: true };
    }

    // Check usage limits for metered features
    if (gate.softLimit || gate.hardLimit) {
      const usage = await this.getCurrentUsage(tenantId, featureId);
      
      if (gate.hardLimit && usage >= gate.hardLimit) {
        const paywall = gate.paywallId ? this.paywalls.get(gate.paywallId) : null;
        return {
          allowed: false,
          paywall: paywall || undefined,
          reason: 'Hard limit reached'
        };
      }
      
      if (gate.softLimit && usage >= gate.softLimit) {
        const paywall = gate.paywallId ? this.paywalls.get(gate.paywallId) : null;
        return {
          allowed: true, // Still allowed but show paywall
          paywall: paywall || undefined,
          reason: 'Soft limit reached'
        };
      }
    }

    // Check grace period for new users
    if (gate.gracePeriod) {
      const accountAge = await this.getAccountAge(tenantId);
      if (accountAge <= gate.gracePeriod) {
        return {
          allowed: true,
          gracePeriod: gate.gracePeriod - accountAge
        };
      }
    }

    // Feature requires upgrade
    const paywall = gate.paywallId ? this.paywalls.get(gate.paywallId) : null;
    return {
      allowed: false,
      paywall: paywall || undefined,
      reason: 'Tier upgrade required'
    };
  }

  async shouldShowPaywall(tenantId: string, userId: string, paywallId: string): Promise<{
    show: boolean;
    reason?: string;
  }> {
    const paywall = this.paywalls.get(paywallId);
    if (!paywall || !paywall.enabled) {
      return { show: false, reason: 'Paywall not found or disabled' };
    }

    // Check targeting rules
    const userTier = await this.getUserTier(tenantId);
    if (!paywall.targeting.userSegments.includes(userTier)) {
      return { show: false, reason: 'User not in target segment' };
    }

    // Check frequency limits
    const interactionKey = `${userId}_${paywallId}`;
    const interaction = this.userInteractions.get(interactionKey);
    
    if (interaction) {
      const hoursSinceLastShown = (Date.now() - new Date(interaction.lastShown).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastShown < paywall.targeting.frequency.cooldownHours) {
        return { show: false, reason: 'Cooldown period active' };
      }
      
      // Check daily/weekly limits
      const today = new Date().toDateString();
      const lastShownDate = new Date(interaction.lastShown).toDateString();
      
      if (today === lastShownDate && interaction.count >= paywall.targeting.frequency.maxPerDay) {
        return { show: false, reason: 'Daily limit reached' };
      }
    }

    // Check exclusion rules
    if (paywall.targeting.excludeTrials && await this.isOnTrial(tenantId)) {
      return { show: false, reason: 'User on trial' };
    }

    if (paywall.targeting.excludeRecentUpgrades && await this.hasRecentUpgrade(tenantId)) {
      return { show: false, reason: 'Recent upgrade detected' };
    }

    return { show: true };
  }

  async showPaywall(tenantId: string, userId: string, paywallId: string, context?: Record<string, any>): Promise<PaywallEvent> {
    const paywall = this.paywalls.get(paywallId);
    if (!paywall) throw new Error('Paywall not found');

    // Record interaction
    const interactionKey = `${userId}_${paywallId}`;
    const interaction = this.userInteractions.get(interactionKey) || { lastShown: '', count: 0 };
    
    const today = new Date().toDateString();
    const lastShownDate = new Date(interaction.lastShown || 0).toDateString();
    
    interaction.lastShown = new Date().toISOString();
    interaction.count = today === lastShownDate ? interaction.count + 1 : 1;
    
    this.userInteractions.set(interactionKey, interaction);

    // Create event
    const event: PaywallEvent = {
      id: crypto.randomUUID(),
      tenantId,
      userId,
      paywallId,
      action: 'shown',
      context: context || {},
      timestamp: new Date().toISOString()
    };

    this.events.push(event);
    return event;
  }

  async handlePaywallAction(tenantId: string, userId: string, paywallId: string, action: PaywallAction['type'], context?: Record<string, any>): Promise<PaywallEvent> {
    const event: PaywallEvent = {
      id: crypto.randomUUID(),
      tenantId,
      userId,
      paywallId,
      action: action === 'upgrade' ? 'upgraded' : 
              action === 'trial' ? 'trial_started' :
              action === 'contact_sales' ? 'contact_requested' : 'dismissed',
      context: context || {},
      timestamp: new Date().toISOString()
    };

    this.events.push(event);

    // Handle specific actions
    switch (action) {
      case 'upgrade':
        // Trigger upgrade flow
        await this.triggerUpgrade(tenantId, context?.targetTier);
        break;
      case 'trial':
        // Start trial
        await this.startTrial(tenantId, context?.targetTier);
        break;
      case 'contact_sales':
        // Create sales lead
        await this.createSalesLead(tenantId, userId, paywallId);
        break;
    }

    return event;
  }

  createPaywall(config: Omit<PaywallConfig, 'id' | 'createdAt'>): PaywallConfig {
    const paywall: PaywallConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.paywalls.set(paywall.id, paywall);
    return paywall;
  }

  updatePaywall(paywallId: string, updates: Partial<PaywallConfig>): PaywallConfig | null {
    const paywall = this.paywalls.get(paywallId);
    if (!paywall) return null;

    const updated = { ...paywall, ...updates };
    this.paywalls.set(paywallId, updated);
    return updated;
  }

  getPaywallAnalytics(paywallId?: string): {
    totalShown: number;
    conversionRate: number;
    dismissalRate: number;
    actionBreakdown: Record<string, number>;
    revenueGenerated: number;
  } {
    const relevantEvents = paywallId ? 
      this.events.filter(e => e.paywallId === paywallId) : 
      this.events;

    const shown = relevantEvents.filter(e => e.action === 'shown').length;
    const conversions = relevantEvents.filter(e => e.action === 'upgraded' || e.action === 'trial_started').length;
    const dismissals = relevantEvents.filter(e => e.action === 'dismissed').length;

    const actionBreakdown = relevantEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalShown: shown,
      conversionRate: shown > 0 ? (conversions / shown) * 100 : 0,
      dismissalRate: shown > 0 ? (dismissals / shown) * 100 : 0,
      actionBreakdown,
      revenueGenerated: conversions * 99 // Mock revenue calculation
    };
  }

  // Helper methods (would integrate with actual systems)
  private async checkTierAccess(tenantId: string, requiredTier: string): Promise<boolean> {
    // Mock implementation - would check with TierManager
    return Math.random() > 0.5;
  }

  private async getCurrentUsage(tenantId: string, featureId: string): Promise<number> {
    // Mock implementation - would check actual usage
    return Math.floor(Math.random() * 100);
  }

  private async getAccountAge(tenantId: string): Promise<number> {
    // Mock implementation - would check account creation date
    return Math.floor(Math.random() * 30);
  }

  private async getUserTier(tenantId: string): Promise<string> {
    // Mock implementation - would check with TierManager
    return ['free', 'starter', 'professional'][Math.floor(Math.random() * 3)];
  }

  private async isOnTrial(tenantId: string): Promise<boolean> {
    // Mock implementation
    return Math.random() > 0.7;
  }

  private async hasRecentUpgrade(tenantId: string): Promise<boolean> {
    // Mock implementation
    return Math.random() > 0.9;
  }

  private async triggerUpgrade(tenantId: string, targetTier?: string): Promise<void> {
    console.log(`Triggering upgrade for tenant ${tenantId} to ${targetTier}`);
  }

  private async startTrial(tenantId: string, targetTier?: string): Promise<void> {
    console.log(`Starting trial for tenant ${tenantId} for ${targetTier}`);
  }

  private async createSalesLead(tenantId: string, userId: string, paywallId: string): Promise<void> {
    console.log(`Creating sales lead for tenant ${tenantId}, user ${userId}, paywall ${paywallId}`);
  }

  getPaywalls(): PaywallConfig[] {
    return Array.from(this.paywalls.values());
  }

  getFeatureGates(): FeatureGate[] {
    return Array.from(this.featureGates.values());
  }
}