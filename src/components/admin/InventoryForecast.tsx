'use client'

import { useState } from 'react'
import { TrendingUp, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import { InventoryForecastingEngine } from '@/lib/ai/inventory-forecasting'
import Modal from '@/components/ui/Modal'

interface Product {
  id: string
  name: string
  currentStock: number
  averageDailySales: number
  leadTime: number
  safetyStock: number
}

export default function InventoryForecast() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const products: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      currentStock: 25,
      averageDailySales: 3.2,
      leadTime: 14,
      safetyStock: 10
    },
    {
      id: '2', 
      name: 'MacBook Air M3',
      currentStock: 8,
      averageDailySales: 1.5,
      leadTime: 21,
      safetyStock: 5
    }
  ]

  const handleGenerateForecast = async (product: Product) => {
    setSelectedProduct(product)
    setLoading(true)
    setShowModal(true)

    try {
      const engine = new InventoryForecastingEngine()
      const result = await engine.generateForecast({
        productId: product.id,
        currentStock: product.currentStock,
        averageDailySales: product.averageDailySales,
        seasonalFactor: 1.0,
        leadTime: product.leadTime,
        safetyStock: product.safetyStock
      })
      
      setForecast(result)
    } catch (error) {
      console.error('Forecast generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return 'text-red-600'
    if (risk > 0.4) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiskIcon = (risk: number) => {
    if (risk > 0.7) return <AlertTriangle className="h-4 w-4" />
    if (risk > 0.4) return <TrendingUp className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  return (
    <>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Inventory Forecasting</h3>
        
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {product.currentStock} | Daily Sales: {product.averageDailySales}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleGenerateForecast(product)}
                className="btn-primary"
              >
                Generate Forecast
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="AI Inventory Forecast"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Generating AI forecast...</span>
          </div>
        ) : forecast && selectedProduct ? (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h4>
              <p className="text-gray-600">Forecast Analysis</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Predicted Demand</p>
                <p className="text-2xl font-bold text-blue-600">{forecast.predictedDemand}</p>
                <p className="text-xs text-gray-500">Next {selectedProduct.leadTime} days</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Recommended Order</p>
                <p className="text-2xl font-bold text-green-600">{forecast.recommendedOrder}</p>
                <p className="text-xs text-gray-500">Units to order</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  {getRiskIcon(forecast.stockoutRisk)}
                  <p className="text-sm font-medium text-gray-600">Stockout Risk</p>
                </div>
                <p className={`text-2xl font-bold ${getRiskColor(forecast.stockoutRisk)}`}>
                  {Math.round(forecast.stockoutRisk * 100)}%
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Confidence</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(forecast.confidence * 100)}%
                </p>
              </div>
            </div>

            {forecast.reasoning.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">AI Insights</h5>
                <ul className="space-y-1">
                  {forecast.reasoning.map((reason: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Close
              </button>
              <button className="btn-primary">
                Create Purchase Order
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}