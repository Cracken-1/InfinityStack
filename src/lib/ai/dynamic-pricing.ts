interface PricingData {
  productId: string
  currentPrice: number
  cost: number
  competitorPrices: number[]
  demandLevel: 'low' | 'medium' | 'high'
  stockLevel: number
  category: string
}

interface PricingRecommendation {
  productId: string
  recommendedPrice: number
  priceChange: number
  expectedImpact: {
    demandChange: number
    revenueChange: number
    marginChange: number
  }
  confidence: number
  reasoning: string
}

export class DynamicPricingEngine {
  private kenyaMarketFactors = {
    mPesaFriendly: [50, 100, 200, 500, 1000], // Common M-Pesa amounts
    psychologicalPricing: 0.99, // .99 ending preference
    competitionSensitivity: 0.15
  }

  async generatePricingRecommendation(data: PricingData): Promise<PricingRecommendation> {
    const marketPrice = this.calculateMarketPrice(data.competitorPrices)
    const demandMultiplier = this.getDemandMultiplier(data.demandLevel)
    const stockMultiplier = this.getStockMultiplier(data.stockLevel)
    
    let recommendedPrice = marketPrice * demandMultiplier * stockMultiplier
    
    // Apply Kenya-specific adjustments
    recommendedPrice = this.applyKenyaMarketPsychology(recommendedPrice)
    
    // Ensure minimum margin
    const minPrice = data.cost * 1.2 // 20% minimum margin
    recommendedPrice = Math.max(recommendedPrice, minPrice)
    
    const priceChange = ((recommendedPrice - data.currentPrice) / data.currentPrice) * 100
    const expectedImpact = this.calculateExpectedImpact(priceChange, data)
    
    return {
      productId: data.productId,
      recommendedPrice: Math.round(recommendedPrice),
      priceChange,
      expectedImpact,
      confidence: this.calculateConfidence(data),
      reasoning: this.generateReasoning(data, recommendedPrice, marketPrice)
    }
  }

  private calculateMarketPrice(competitorPrices: number[]): number {
    if (competitorPrices.length === 0) return 0
    return competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length
  }

  private getDemandMultiplier(demand: string): number {
    switch (demand) {
      case 'high': return 1.1
      case 'medium': return 1.0
      case 'low': return 0.95
      default: return 1.0
    }
  }

  private getStockMultiplier(stockLevel: number): number {
    if (stockLevel < 10) return 1.05 // Low stock = slight price increase
    if (stockLevel > 100) return 0.98 // High stock = slight discount
    return 1.0
  }

  private applyKenyaMarketPsychology(price: number): number {
    // Find nearest M-Pesa friendly amount
    const mPesaAmount = this.kenyaMarketFactors.mPesaFriendly.find(amount => 
      Math.abs(amount - price) < price * 0.1
    )
    
    if (mPesaAmount) {
      return mPesaAmount
    }
    
    // Apply .99 pricing psychology
    const basePrice = Math.floor(price)
    return basePrice + this.kenyaMarketFactors.psychologicalPricing
  }

  private calculateExpectedImpact(priceChange: number, data: PricingData) {
    const elasticity = this.getPriceElasticity(data.category)
    const demandChange = -priceChange * elasticity
    const revenueChange = priceChange + demandChange
    const marginChange = ((data.currentPrice * (1 + priceChange/100)) - data.cost) / data.cost * 100
    
    return {
      demandChange: Math.round(demandChange * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      marginChange: Math.round(marginChange * 100) / 100
    }
  }

  private getPriceElasticity(category: string): number {
    const elasticities: Record<string, number> = {
      'Electronics': 1.2,
      'Food': 0.8,
      'Clothing': 1.0,
      'Health': 0.6,
      'Books': 1.4
    }
    return elasticities[category] || 1.0
  }

  private calculateConfidence(data: PricingData): number {
    let confidence = 0.7
    if (data.competitorPrices.length >= 3) confidence += 0.15
    if (data.demandLevel === 'high') confidence += 0.1
    return Math.min(0.95, confidence)
  }

  private generateReasoning(data: PricingData, recommended: number, market: number): string {
    const reasons = []
    
    if (recommended > data.currentPrice) {
      reasons.push('Market conditions support price increase')
    } else if (recommended < data.currentPrice) {
      reasons.push('Competitive pressure suggests price reduction')
    }
    
    if (data.demandLevel === 'high') {
      reasons.push('High demand allows premium pricing')
    }
    
    if (this.kenyaMarketFactors.mPesaFriendly.includes(recommended)) {
      reasons.push('Price optimized for M-Pesa transactions')
    }
    
    return reasons.join('. ')
  }
}