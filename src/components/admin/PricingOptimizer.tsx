'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { DynamicPricingEngine } from '@/lib/ai/dynamic-pricing'
import Modal from '@/components/ui/Modal'

interface Product {
  id: string
  name: string
  currentPrice: number
  cost: number
  competitorPrices: number[]
  demandLevel: 'low' | 'medium' | 'high'
  stockLevel: number
  category: string
}

export default function PricingOptimizer() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const products: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      currentPrice: 999,
      cost: 750,
      competitorPrices: [1050, 995, 1020],
      demandLevel: 'high',
      stockLevel: 25,
      category: 'Electronics'
    },
    {
      id: '2',
      name: 'MacBook Air M3', 
      currentPrice: 1299,
      cost: 980,
      competitorPrices: [1350, 1280, 1320],
      demandLevel: 'medium',
      stockLevel: 8,
      category: 'Electronics'
    }
  ]

  const handleOptimizePrice = async (product: Product) => {
    setSelectedProduct(product)
    setLoading(true)
    setShowModal(true)

    try {
      const engine = new DynamicPricingEngine()
      const result = await engine.generatePricingRecommendation({
        productId: product.id,
        currentPrice: product.currentPrice,
        cost: product.cost,
        competitorPrices: product.competitorPrices,
        demandLevel: product.demandLevel,
        stockLevel: product.stockLevel,
        category: product.category
      })
      setRecommendation(result)
    } catch (error) {
      console.error('Price optimization failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Target className="h-4 w-4 text-gray-600" />
  }

  return (
    <>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Dynamic Pricing</h3>
        
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Current: KSh {product.currentPrice.toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getDemandColor(product.demandLevel)}`}>
                      {product.demandLevel} demand
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleOptimizePrice(product)}
                className="btn-primary"
              >
                Optimize Price
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="AI Price Optimization"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Optimizing price with AI...</span>
          </div>
        ) : recommendation && selectedProduct ? (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h4>
              <p className="text-gray-600">Price Optimization Analysis</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Current Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  KSh {selectedProduct.currentPrice.toLocaleString()}
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Recommended Price</p>
                <p className="text-2xl font-bold text-green-600">
                  KSh {recommendation.recommendedPrice.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  {getPriceChangeIcon(recommendation.priceChange)}
                  <p className="text-sm font-medium text-gray-600">Price Change</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {recommendation.priceChange > 0 ? '+' : ''}{recommendation.priceChange.toFixed(1)}%
                </p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                <p className="text-lg font-bold text-gray-900">
                  {recommendation.expectedImpact.revenueChange > 0 ? '+' : ''}
                  {recommendation.expectedImpact.revenueChange.toFixed(1)}%
                </p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Confidence</p>
                <p className="text-lg font-bold text-purple-600">
                  {Math.round(recommendation.confidence * 100)}%
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Expected Impact</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Demand Change</p>
                  <p className="font-medium">
                    {recommendation.expectedImpact.demandChange > 0 ? '+' : ''}
                    {recommendation.expectedImpact.demandChange.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Revenue Change</p>
                  <p className="font-medium">
                    {recommendation.expectedImpact.revenueChange > 0 ? '+' : ''}
                    {recommendation.expectedImpact.revenueChange.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Margin Change</p>
                  <p className="font-medium">
                    {recommendation.expectedImpact.marginChange > 0 ? '+' : ''}
                    {recommendation.expectedImpact.marginChange.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {recommendation.reasoning && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">AI Reasoning</h5>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  {recommendation.reasoning}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary">
                Apply New Price
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}