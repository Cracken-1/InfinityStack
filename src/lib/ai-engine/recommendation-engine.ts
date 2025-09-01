export interface UserProfile {
  userId: string;
  tenantId: string;
  preferences: Record<string, any>;
  behavior: UserBehavior;
  demographics: {
    age?: number;
    location?: string;
    segment?: string;
  };
  interactions: Interaction[];
}

export interface UserBehavior {
  purchaseHistory: Purchase[];
  viewHistory: View[];
  searchHistory: Search[];
  clickPatterns: ClickPattern[];
  sessionDuration: number;
  frequency: 'low' | 'medium' | 'high';
}

export interface Purchase {
  productId: string;
  category: string;
  price: number;
  quantity: number;
  timestamp: string;
  rating?: number;
}

export interface View {
  productId: string;
  category: string;
  duration: number;
  timestamp: string;
}

export interface Search {
  query: string;
  results: number;
  clicked: boolean;
  timestamp: string;
}

export interface ClickPattern {
  element: string;
  frequency: number;
  context: string;
}

export interface Interaction {
  type: 'view' | 'click' | 'purchase' | 'like' | 'share' | 'review';
  itemId: string;
  value?: number;
  timestamp: string;
}

export interface Recommendation {
  itemId: string;
  type: 'product' | 'content' | 'action' | 'offer';
  score: number;
  reason: string;
  category: string;
  metadata: Record<string, any>;
}

export interface RecommendationStrategy {
  name: string;
  weight: number;
  enabled: boolean;
  config: Record<string, any>;
}

export class RecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private itemSimilarity: Map<string, Map<string, number>> = new Map();
  private strategies: RecommendationStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies() {
    this.strategies = [
      {
        name: 'collaborative_filtering',
        weight: 0.3,
        enabled: true,
        config: { minSimilarity: 0.1, maxRecommendations: 10 }
      },
      {
        name: 'content_based',
        weight: 0.25,
        enabled: true,
        config: { categoryWeight: 0.4, priceWeight: 0.3, brandWeight: 0.3 }
      },
      {
        name: 'popularity_based',
        weight: 0.2,
        enabled: true,
        config: { timeDecay: 0.1, minInteractions: 5 }
      },
      {
        name: 'behavioral_patterns',
        weight: 0.15,
        enabled: true,
        config: { sessionWeight: 0.6, frequencyWeight: 0.4 }
      },
      {
        name: 'contextual',
        weight: 0.1,
        enabled: true,
        config: { timeOfDay: true, seasonality: true, location: true }
      }
    ];
  }

  updateUserProfile(userId: string, tenantId: string, interaction: Interaction): void {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        tenantId,
        preferences: {},
        behavior: {
          purchaseHistory: [],
          viewHistory: [],
          searchHistory: [],
          clickPatterns: [],
          sessionDuration: 0,
          frequency: 'low'
        },
        demographics: {},
        interactions: []
      };
      this.userProfiles.set(userId, profile);
    }

    profile.interactions.push(interaction);
    this.updateBehaviorMetrics(profile, interaction);
  }

  private updateBehaviorMetrics(profile: UserProfile, interaction: Interaction): void {
    const behavior = profile.behavior;

    switch (interaction.type) {
      case 'purchase':
        // Add to purchase history (mock data structure)
        behavior.purchaseHistory.push({
          productId: interaction.itemId,
          category: 'unknown', // Would be fetched from product catalog
          price: interaction.value || 0,
          quantity: 1,
          timestamp: interaction.timestamp
        });
        break;

      case 'view':
        behavior.viewHistory.push({
          productId: interaction.itemId,
          category: 'unknown',
          duration: interaction.value || 30,
          timestamp: interaction.timestamp
        });
        break;
    }

    // Update frequency based on interaction count
    const recentInteractions = profile.interactions.filter(i => 
      Date.now() - new Date(i.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    if (recentInteractions.length > 50) behavior.frequency = 'high';
    else if (recentInteractions.length > 15) behavior.frequency = 'medium';
    else behavior.frequency = 'low';
  }

  async generateRecommendations(
    userId: string,
    context: {
      page?: string;
      category?: string;
      currentItem?: string;
      limit?: number;
    } = {}
  ): Promise<Recommendation[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return this.getFallbackRecommendations(context);
    }

    const recommendations: Map<string, Recommendation> = new Map();
    const limit = context.limit || 10;

    // Apply each strategy
    for (const strategy of this.strategies.filter(s => s.enabled)) {
      const strategyRecs = await this.applyStrategy(strategy, profile, context);
      
      // Merge recommendations with weighted scores
      strategyRecs.forEach(rec => {
        const existing = recommendations.get(rec.itemId);
        if (existing) {
          existing.score += rec.score * strategy.weight;
          existing.reason += ` + ${rec.reason}`;
        } else {
          recommendations.set(rec.itemId, {
            ...rec,
            score: rec.score * strategy.weight
          });
        }
      });
    }

    // Sort by score and return top recommendations
    return Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async applyStrategy(
    strategy: RecommendationStrategy,
    profile: UserProfile,
    context: any
  ): Promise<Recommendation[]> {
    switch (strategy.name) {
      case 'collaborative_filtering':
        return this.collaborativeFiltering(profile, strategy.config);
      case 'content_based':
        return this.contentBasedFiltering(profile, strategy.config, context);
      case 'popularity_based':
        return this.popularityBasedRecommendations(profile, strategy.config);
      case 'behavioral_patterns':
        return this.behavioralPatternRecommendations(profile, strategy.config);
      case 'contextual':
        return this.contextualRecommendations(profile, strategy.config, context);
      default:
        return [];
    }
  }

  private async collaborativeFiltering(
    profile: UserProfile,
    config: any
  ): Promise<Recommendation[]> {
    // Find similar users based on purchase/interaction history
    const similarUsers = this.findSimilarUsers(profile);
    const recommendations: Recommendation[] = [];

    similarUsers.forEach(({ userId: similarUserId, similarity }) => {
      if (similarity < config.minSimilarity) return;

      const similarProfile = this.userProfiles.get(similarUserId);
      if (!similarProfile) return;

      // Recommend items that similar users liked but current user hasn't interacted with
      similarProfile.behavior.purchaseHistory.forEach(purchase => {
        const hasInteracted = profile.interactions.some(i => i.itemId === purchase.productId);
        
        if (!hasInteracted) {
          recommendations.push({
            itemId: purchase.productId,
            type: 'product',
            score: similarity * (purchase.rating || 0.8),
            reason: 'Users with similar preferences also liked this',
            category: purchase.category,
            metadata: { strategy: 'collaborative_filtering', similarity }
          });
        }
      });
    });

    return recommendations.slice(0, config.maxRecommendations || 10);
  }

  private async contentBasedFiltering(
    profile: UserProfile,
    config: any,
    context: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Analyze user's preferred categories, price ranges, etc.
    const categoryPreferences = this.analyzeCategoryPreferences(profile);
    const pricePreferences = this.analyzePricePreferences(profile);

    // Mock product catalog - in production, this would query actual products
    const products = this.getMockProducts(profile.tenantId);

    products.forEach(product => {
      const hasInteracted = profile.interactions.some(i => i.itemId === product.id);
      if (hasInteracted) return;

      let score = 0;

      // Category similarity
      const categoryScore = categoryPreferences[product.category] || 0;
      score += categoryScore * config.categoryWeight;

      // Price similarity
      const priceScore = this.calculatePriceScore(product.price, pricePreferences);
      score += priceScore * config.priceWeight;

      // Brand similarity (if available)
      const brandScore = 0.5; // Mock brand score
      score += brandScore * config.brandWeight;

      if (score > 0.3) { // Minimum threshold
        recommendations.push({
          itemId: product.id,
          type: 'product',
          score,
          reason: 'Based on your preferences and past purchases',
          category: product.category,
          metadata: { strategy: 'content_based', categoryScore, priceScore }
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private async popularityBasedRecommendations(
    profile: UserProfile,
    config: any
  ): Promise<Recommendation[]> {
    // Get popular items from all users in the same tenant
    const tenantUsers = Array.from(this.userProfiles.values())
      .filter(p => p.tenantId === profile.tenantId);

    const itemPopularity: Map<string, { count: number; avgRating: number }> = new Map();

    tenantUsers.forEach(user => {
      user.behavior.purchaseHistory.forEach(purchase => {
        const existing = itemPopularity.get(purchase.productId);
        if (existing) {
          existing.count++;
          existing.avgRating = (existing.avgRating + (purchase.rating || 0.8)) / 2;
        } else {
          itemPopularity.set(purchase.productId, {
            count: 1,
            avgRating: purchase.rating || 0.8
          });
        }
      });
    });

    const recommendations: Recommendation[] = [];

    itemPopularity.forEach((stats, itemId) => {
      if (stats.count < config.minInteractions) return;

      const hasInteracted = profile.interactions.some(i => i.itemId === itemId);
      if (hasInteracted) return;

      // Apply time decay
      const score = stats.avgRating * Math.log(stats.count + 1) * (1 - config.timeDecay);

      recommendations.push({
        itemId,
        type: 'product',
        score,
        reason: `Popular among ${stats.count} users`,
        category: 'popular',
        metadata: { strategy: 'popularity_based', interactions: stats.count }
      });
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private async behavioralPatternRecommendations(
    profile: UserProfile,
    config: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Analyze time-based patterns
    const timePatterns = this.analyzeTimePatterns(profile);
    
    // Analyze sequence patterns
    const sequencePatterns = this.analyzeSequencePatterns(profile);

    // Generate recommendations based on patterns
    timePatterns.forEach(pattern => {
      recommendations.push({
        itemId: pattern.itemId,
        type: 'product',
        score: pattern.confidence * config.sessionWeight,
        reason: `You typically browse this category at this time`,
        category: pattern.category,
        metadata: { strategy: 'behavioral_patterns', pattern: 'time_based' }
      });
    });

    sequencePatterns.forEach(pattern => {
      recommendations.push({
        itemId: pattern.nextItem,
        type: 'product',
        score: pattern.probability * config.frequencyWeight,
        reason: `Often purchased together with your recent items`,
        category: pattern.category,
        metadata: { strategy: 'behavioral_patterns', pattern: 'sequence' }
      });
    });

    return recommendations.slice(0, 10);
  }

  private async contextualRecommendations(
    profile: UserProfile,
    config: any,
    context: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();

    // Time-of-day recommendations
    if (config.timeOfDay) {
      const timeBasedItems = this.getTimeBasedRecommendations(currentHour);
      recommendations.push(...timeBasedItems);
    }

    // Seasonal recommendations
    if (config.seasonality) {
      const seasonalItems = this.getSeasonalRecommendations(currentMonth);
      recommendations.push(...seasonalItems);
    }

    // Location-based recommendations
    if (config.location && profile.demographics.location) {
      const locationItems = this.getLocationBasedRecommendations(profile.demographics.location);
      recommendations.push(...locationItems);
    }

    return recommendations.slice(0, 5);
  }

  private findSimilarUsers(profile: UserProfile): Array<{ userId: string; similarity: number }> {
    const similarities: Array<{ userId: string; similarity: number }> = [];

    this.userProfiles.forEach((otherProfile, otherUserId) => {
      if (otherUserId === profile.userId || otherProfile.tenantId !== profile.tenantId) return;

      const similarity = this.calculateUserSimilarity(profile, otherProfile);
      if (similarity > 0.1) {
        similarities.push({ userId: otherUserId, similarity });
      }
    });

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  }

  private calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
    // Simple Jaccard similarity based on purchased items
    const items1 = new Set(user1.behavior.purchaseHistory.map(p => p.productId));
    const items2 = new Set(user2.behavior.purchaseHistory.map(p => p.productId));

    const intersection = new Set(Array.from(items1).filter(x => items2.has(x)));
    const union = new Set([...Array.from(items1), ...Array.from(items2)]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private analyzeCategoryPreferences(profile: UserProfile): Record<string, number> {
    const categoryCount: Record<string, number> = {};
    const totalPurchases = profile.behavior.purchaseHistory.length;

    profile.behavior.purchaseHistory.forEach(purchase => {
      categoryCount[purchase.category] = (categoryCount[purchase.category] || 0) + 1;
    });

    // Convert to preferences (0-1 scale)
    const preferences: Record<string, number> = {};
    Object.entries(categoryCount).forEach(([category, count]) => {
      preferences[category] = count / totalPurchases;
    });

    return preferences;
  }

  private analyzePricePreferences(profile: UserProfile): { min: number; max: number; avg: number } {
    const prices = profile.behavior.purchaseHistory.map(p => p.price);
    
    if (prices.length === 0) {
      return { min: 0, max: 1000, avg: 50 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
    };
  }

  private calculatePriceScore(productPrice: number, pricePrefs: any): number {
    const { min, max, avg } = pricePrefs;
    
    // Score based on how close the price is to user's average
    const distance = Math.abs(productPrice - avg) / (max - min || 1);
    return Math.max(0, 1 - distance);
  }

  private getMockProducts(tenantId: string): Array<{ id: string; category: string; price: number }> {
    return [
      { id: 'prod1', category: 'electronics', price: 299 },
      { id: 'prod2', category: 'clothing', price: 49 },
      { id: 'prod3', category: 'books', price: 19 },
      { id: 'prod4', category: 'electronics', price: 599 },
      { id: 'prod5', category: 'home', price: 129 }
    ];
  }

  private analyzeTimePatterns(profile: UserProfile): Array<{ itemId: string; category: string; confidence: number }> {
    // Mock time pattern analysis
    return [
      { itemId: 'morning_item', category: 'coffee', confidence: 0.8 },
      { itemId: 'evening_item', category: 'entertainment', confidence: 0.7 }
    ];
  }

  private analyzeSequencePatterns(profile: UserProfile): Array<{ nextItem: string; category: string; probability: number }> {
    // Mock sequence pattern analysis
    return [
      { nextItem: 'accessory_item', category: 'accessories', probability: 0.6 },
      { nextItem: 'complementary_item', category: 'related', probability: 0.5 }
    ];
  }

  private getTimeBasedRecommendations(hour: number): Recommendation[] {
    // Mock time-based recommendations
    if (hour < 12) {
      return [{
        itemId: 'morning_special',
        type: 'offer',
        score: 0.7,
        reason: 'Morning special offer',
        category: 'time_based',
        metadata: { timeOfDay: 'morning' }
      }];
    }
    return [];
  }

  private getSeasonalRecommendations(month: number): Recommendation[] {
    // Mock seasonal recommendations
    return [{
      itemId: 'seasonal_item',
      type: 'product',
      score: 0.6,
      reason: 'Seasonal trending item',
      category: 'seasonal',
      metadata: { season: month < 3 || month > 10 ? 'winter' : 'summer' }
    }];
  }

  private getLocationBasedRecommendations(location: string): Recommendation[] {
    // Mock location-based recommendations
    return [{
      itemId: 'local_item',
      type: 'product',
      score: 0.5,
      reason: 'Popular in your area',
      category: 'local',
      metadata: { location }
    }];
  }

  private getFallbackRecommendations(context: any): Recommendation[] {
    // Return popular/trending items for new users
    return [
      {
        itemId: 'trending1',
        type: 'product',
        score: 0.8,
        reason: 'Trending now',
        category: 'trending',
        metadata: { fallback: true }
      },
      {
        itemId: 'popular1',
        type: 'product',
        score: 0.7,
        reason: 'Most popular',
        category: 'popular',
        metadata: { fallback: true }
      }
    ];
  }

  getRecommendationExplanation(recommendation: Recommendation): string {
    const strategy = recommendation.metadata.strategy;
    
    switch (strategy) {
      case 'collaborative_filtering':
        return `Recommended because users with similar preferences (${Math.round(recommendation.metadata.similarity * 100)}% similarity) also liked this item.`;
      case 'content_based':
        return `Recommended based on your interest in ${recommendation.category} items and similar products you've purchased.`;
      case 'popularity_based':
        return `This item is popular among ${recommendation.metadata.interactions} users with similar profiles.`;
      case 'behavioral_patterns':
        return `Recommended based on your browsing patterns and typical purchase behavior.`;
      case 'contextual':
        return `Recommended based on current context: time, location, and seasonal trends.`;
      default:
        return recommendation.reason;
    }
  }
}