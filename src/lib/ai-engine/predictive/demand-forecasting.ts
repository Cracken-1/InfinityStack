export interface SalesData {
  date: string;
  productId: string;
  quantity: number;
  revenue: number;
  seasonality?: number;
  promotions?: boolean;
  externalFactors?: Record<string, any>;
}

export interface ForecastResult {
  productId: string;
  predictions: Array<{
    date: string;
    predictedQuantity: number;
    predictedRevenue: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: 'high' | 'medium' | 'low' | 'none';
  recommendations: string[];
}

export interface MarketTrend {
  category: string;
  trend: number; // -1 to 1
  confidence: number;
  factors: string[];
  impact: 'high' | 'medium' | 'low';
}

export class DemandForecastingEngine {
  private historicalData: Map<string, SalesData[]> = new Map();
  private models: Map<string, any> = new Map();

  addHistoricalData(data: SalesData[]): void {
    data.forEach(record => {
      const existing = this.historicalData.get(record.productId) || [];
      existing.push(record);
      existing.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.historicalData.set(record.productId, existing);
    });
  }

  async forecastDemand(
    productId: string, 
    forecastDays: number = 30,
    includeExternalFactors: boolean = true
  ): Promise<ForecastResult> {
    const historicalData = this.historicalData.get(productId);
    if (!historicalData || historicalData.length < 7) {
      throw new Error('Insufficient historical data for forecasting');
    }

    // Analyze historical patterns
    const patterns = this.analyzePatterns(historicalData);
    
    // Generate predictions
    const predictions = this.generatePredictions(
      historicalData, 
      forecastDays, 
      patterns,
      includeExternalFactors
    );

    // Calculate accuracy based on recent predictions vs actual
    const accuracy = this.calculateAccuracy(historicalData);

    // Determine trend and seasonality
    const trend = this.determineTrend(historicalData);
    const seasonality = this.analyzeSeasonality(historicalData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      predictions, 
      patterns, 
      trend, 
      seasonality
    );

    return {
      productId,
      predictions,
      accuracy,
      trend,
      seasonality,
      recommendations
    };
  }

  private analyzePatterns(data: SalesData[]): {
    avgDailyQuantity: number;
    avgDailyRevenue: number;
    volatility: number;
    weeklyPattern: number[];
    monthlyPattern: number[];
    growthRate: number;
  } {
    const quantities = data.map(d => d.quantity);
    const revenues = data.map(d => d.revenue);

    const avgDailyQuantity = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const avgDailyRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;

    // Calculate volatility (standard deviation)
    const quantityVariance = quantities.reduce((sum, q) => sum + Math.pow(q - avgDailyQuantity, 2), 0) / quantities.length;
    const volatility = Math.sqrt(quantityVariance) / avgDailyQuantity;

    // Weekly pattern (day of week analysis)
    const weeklyPattern = new Array(7).fill(0);
    data.forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      weeklyPattern[dayOfWeek] += record.quantity;
    });

    // Monthly pattern
    const monthlyPattern = new Array(12).fill(0);
    data.forEach(record => {
      const month = new Date(record.date).getMonth();
      monthlyPattern[month] += record.quantity;
    });

    // Growth rate calculation
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.quantity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.quantity, 0) / secondHalf.length;
    
    const growthRate = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    return {
      avgDailyQuantity,
      avgDailyRevenue,
      volatility,
      weeklyPattern,
      monthlyPattern,
      growthRate
    };
  }

  private generatePredictions(
    historicalData: SalesData[],
    forecastDays: number,
    patterns: any,
    includeExternalFactors: boolean
  ): ForecastResult['predictions'] {
    const predictions: ForecastResult['predictions'] = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);

      // Base prediction using trend and seasonality
      let basePrediction = patterns.avgDailyQuantity * (1 + patterns.growthRate * (i / 365));

      // Apply weekly seasonality
      const dayOfWeek = forecastDate.getDay();
      const weeklyMultiplier = patterns.weeklyPattern[dayOfWeek] / patterns.avgDailyQuantity || 1;
      basePrediction *= weeklyMultiplier;

      // Apply monthly seasonality
      const month = forecastDate.getMonth();
      const monthlyMultiplier = patterns.monthlyPattern[month] / patterns.avgDailyQuantity || 1;
      basePrediction *= monthlyMultiplier * 0.1 + 0.9; // Reduce monthly impact

      // Add external factors if requested
      if (includeExternalFactors) {
        basePrediction *= this.getExternalFactorMultiplier(forecastDate);
      }

      // Calculate confidence based on volatility and forecast distance
      const confidence = Math.max(0.3, 0.9 - (patterns.volatility * 0.5) - (i / forecastDays * 0.3));

      // Calculate bounds
      const errorMargin = basePrediction * patterns.volatility * (1 + i / forecastDays);
      const upperBound = basePrediction + errorMargin;
      const lowerBound = Math.max(0, basePrediction - errorMargin);

      predictions.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedQuantity: Math.round(basePrediction),
        predictedRevenue: Math.round(basePrediction * patterns.avgDailyRevenue / patterns.avgDailyQuantity),
        confidence,
        upperBound: Math.round(upperBound),
        lowerBound: Math.round(lowerBound)
      });
    }

    return predictions;
  }

  private getExternalFactorMultiplier(date: Date): number {
    // Simulate external factors like holidays, events, weather
    const month = date.getMonth();
    const dayOfMonth = date.getDate();

    // Holiday seasons (November-December boost)
    if (month === 10 || month === 11) return 1.2;

    // Summer season
    if (month >= 5 && month <= 7) return 1.1;

    // End of month effect
    if (dayOfMonth >= 28) return 1.05;

    // Random market fluctuations
    return 0.95 + Math.random() * 0.1;
  }

  private calculateAccuracy(data: SalesData[]): number {
    // Simulate accuracy calculation by comparing recent predictions with actual
    // In production, this would use actual prediction history
    return 0.75 + Math.random() * 0.2; // 75-95% accuracy
  }

  private determineTrend(data: SalesData[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 14) return 'stable';

    const recentData = data.slice(-14);
    const olderData = data.slice(-28, -14);

    const recentAvg = recentData.reduce((sum, d) => sum + d.quantity, 0) / recentData.length;
    const olderAvg = olderData.reduce((sum, d) => sum + d.quantity, 0) / olderData.length;

    const changePercent = (recentAvg - olderAvg) / olderAvg;

    if (changePercent > 0.05) return 'increasing';
    if (changePercent < -0.05) return 'decreasing';
    return 'stable';
  }

  private analyzeSeasonality(data: SalesData[]): 'high' | 'medium' | 'low' | 'none' {
    if (data.length < 30) return 'none';

    // Calculate coefficient of variation for weekly patterns
    const weeklyTotals = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);

    data.forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      weeklyTotals[dayOfWeek] += record.quantity;
      weeklyCounts[dayOfWeek]++;
    });

    const weeklyAverages = weeklyTotals.map((total, i) => 
      weeklyCounts[i] > 0 ? total / weeklyCounts[i] : 0
    );

    const overallAvg = weeklyAverages.reduce((sum, avg) => sum + avg, 0) / 7;
    const variance = weeklyAverages.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0) / 7;
    const coefficientOfVariation = Math.sqrt(variance) / overallAvg;

    if (coefficientOfVariation > 0.3) return 'high';
    if (coefficientOfVariation > 0.15) return 'medium';
    if (coefficientOfVariation > 0.05) return 'low';
    return 'none';
  }

  private generateRecommendations(
    predictions: ForecastResult['predictions'],
    patterns: any,
    trend: string,
    seasonality: string
  ): string[] {
    const recommendations: string[] = [];

    // Trend-based recommendations
    if (trend === 'increasing') {
      recommendations.push('Consider increasing inventory levels to meet growing demand');
      recommendations.push('Evaluate pricing strategy for potential optimization');
    } else if (trend === 'decreasing') {
      recommendations.push('Review marketing strategies to boost demand');
      recommendations.push('Consider promotional campaigns to stimulate sales');
    }

    // Seasonality recommendations
    if (seasonality === 'high') {
      recommendations.push('Plan inventory based on strong seasonal patterns');
      recommendations.push('Prepare targeted marketing for peak seasons');
    }

    // Volatility recommendations
    if (patterns.volatility > 0.3) {
      recommendations.push('Maintain higher safety stock due to demand volatility');
      recommendations.push('Consider flexible supply chain arrangements');
    }

    // Forecast-specific recommendations
    const avgPrediction = predictions.reduce((sum, p) => sum + p.predictedQuantity, 0) / predictions.length;
    if (avgPrediction > patterns.avgDailyQuantity * 1.2) {
      recommendations.push('Significant demand increase expected - prepare additional inventory');
    }

    return recommendations;
  }

  async analyzeMarketTrends(category: string): Promise<MarketTrend[]> {
    // Simulate market trend analysis
    const trends: MarketTrend[] = [
      {
        category: 'Technology',
        trend: 0.15,
        confidence: 0.85,
        factors: ['AI adoption', 'Remote work growth', 'Digital transformation'],
        impact: 'high'
      },
      {
        category: 'Sustainability',
        trend: 0.25,
        confidence: 0.9,
        factors: ['Environmental awareness', 'Regulatory changes', 'Consumer preferences'],
        impact: 'high'
      },
      {
        category: 'Health & Wellness',
        trend: 0.12,
        confidence: 0.8,
        factors: ['Aging population', 'Preventive care focus', 'Mental health awareness'],
        impact: 'medium'
      }
    ];

    return trends.filter(t => t.category.toLowerCase().includes(category.toLowerCase()));
  }

  getInventoryRecommendations(productId: string, currentStock: number): {
    recommendedStock: number;
    reorderPoint: number;
    maxStock: number;
    urgency: 'low' | 'medium' | 'high';
    reasoning: string;
  } {
    const forecast = this.historicalData.get(productId);
    if (!forecast) {
      return {
        recommendedStock: currentStock,
        reorderPoint: Math.floor(currentStock * 0.3),
        maxStock: Math.floor(currentStock * 1.5),
        urgency: 'low',
        reasoning: 'Insufficient data for accurate recommendation'
      };
    }

    // Calculate based on forecast (simplified)
    const avgDemand = forecast.reduce((sum, d) => sum + d.quantity, 0) / forecast.length;
    const recommendedStock = Math.ceil(avgDemand * 30); // 30 days supply
    const reorderPoint = Math.ceil(avgDemand * 7); // 7 days supply
    const maxStock = Math.ceil(avgDemand * 60); // 60 days max

    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (currentStock <= reorderPoint) urgency = 'high';
    else if (currentStock <= recommendedStock * 0.5) urgency = 'medium';

    return {
      recommendedStock,
      reorderPoint,
      maxStock,
      urgency,
      reasoning: `Based on ${forecast.length} days of historical data with average daily demand of ${avgDemand.toFixed(1)} units`
    };
  }
}