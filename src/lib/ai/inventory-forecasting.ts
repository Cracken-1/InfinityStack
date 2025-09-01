interface ForecastData {
  productId: string
  currentStock: number
  averageDailySales: number
  seasonalFactor: number
  leadTime: number
  safetyStock: number
}

interface ForecastResult {
  productId: string
  predictedDemand: number
  recommendedOrder: number
  stockoutRisk: number
  confidence: number
  reasoning: string[]
}

export class InventoryForecastingEngine {
  private seasonalPatterns = {
    ramadan: { start: '2024-03-10', end: '2024-04-09', factor: 1.4 },
    christmas: { start: '2024-12-15', end: '2024-12-31', factor: 1.6 },
    schoolHolidays: { start: '2024-04-01', end: '2024-04-30', factor: 1.2 }
  }

  async generateForecast(data: ForecastData): Promise<ForecastResult> {
    const seasonalFactor = this.calculateSeasonalFactor()
    const trendFactor = this.calculateTrendFactor(data.averageDailySales)
    const predictedDemand = Math.round(data.averageDailySales * seasonalFactor * trendFactor * data.leadTime)
    
    const recommendedOrder = Math.max(0, predictedDemand + data.safetyStock - data.currentStock)
    const stockoutRisk = this.calculateStockoutRisk(data.currentStock, predictedDemand)
    const confidence = this.calculateConfidence(data)

    return {
      productId: data.productId,
      predictedDemand,
      recommendedOrder,
      stockoutRisk,
      confidence,
      reasoning: this.generateReasoning(seasonalFactor, trendFactor, stockoutRisk)
    }
  }

  private calculateSeasonalFactor(): number {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    
    for (const [season, period] of Object.entries(this.seasonalPatterns)) {
      if (currentDate >= period.start && currentDate <= period.end) {
        return period.factor
      }
    }
    return 1.0
  }

  private calculateTrendFactor(averageSales: number): number {
    if (averageSales > 50) return 1.1
    if (averageSales > 20) return 1.05
    return 1.0
  }

  private calculateStockoutRisk(currentStock: number, predictedDemand: number): number {
    const ratio = currentStock / predictedDemand
    if (ratio < 0.5) return 0.9
    if (ratio < 1.0) return 0.6
    if (ratio < 1.5) return 0.3
    return 0.1
  }

  private calculateConfidence(data: ForecastData): number {
    let confidence = 0.8
    if (data.averageDailySales > 10) confidence += 0.1
    if (data.leadTime <= 7) confidence += 0.05
    return Math.min(0.95, confidence)
  }

  private generateReasoning(seasonal: number, trend: number, risk: number): string[] {
    const reasons = []
    
    if (seasonal > 1.1) reasons.push('High seasonal demand expected')
    if (trend > 1.05) reasons.push('Positive sales trend detected')
    if (risk > 0.7) reasons.push('High stockout risk - urgent reorder needed')
    if (risk < 0.3) reasons.push('Low stockout risk - current stock sufficient')
    
    return reasons
  }
}