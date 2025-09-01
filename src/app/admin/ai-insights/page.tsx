import Link from 'next/link'
import { ArrowLeft, Brain, TrendingUp, DollarSign, Package } from 'lucide-react'
import InventoryForecast from '@/components/admin/InventoryForecast'
import PricingOptimizer from '@/components/admin/PricingOptimizer'
import MetricCard from '@/components/dashboard/MetricCard'

export default function AIInsightsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary-600">InfinityStack</h1>
                <p className="text-sm text-gray-600">AI-Powered Business Insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="AI Predictions"
              value="95%"
              change="Accuracy Rate"
              changeType="positive"
              icon={Brain}
            />
            <MetricCard
              title="Revenue Optimization"
              value="+12.3%"
              change="This month"
              changeType="positive"
              icon={DollarSign}
            />
            <MetricCard
              title="Inventory Efficiency"
              value="87%"
              change="+5% improvement"
              changeType="positive"
              icon={Package}
            />
            <MetricCard
              title="Demand Forecast"
              value="Next 30 days"
              change="Updated hourly"
              changeType="neutral"
              icon={TrendingUp}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <InventoryForecast />
            <PricingOptimizer />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's AI Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Seasonal Demand Spike Detected</p>
                  <p className="text-sm text-gray-600">
                    AI predicts 40% increase in electronics demand due to upcoming school season.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Pricing Opportunity Identified</p>
                  <p className="text-sm text-gray-600">
                    iPhone 15 Pro can be priced 5% higher. Potential revenue increase: KSh 125,000/month.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Stock Alert</p>
                  <p className="text-sm text-gray-600">
                    MacBook Air M3 inventory will run out in 6 days. Recommended reorder: 15 units.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3">AI Model Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Demand Forecasting</span>
                  <span className="font-medium text-green-600">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Optimization</span>
                  <span className="font-medium text-green-600">91.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seasonal Patterns</span>
                  <span className="font-medium text-green-600">96.8%</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3">Business Impact</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue Increase</span>
                  <span className="font-medium text-green-600">+12.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Inventory Turnover</span>
                  <span className="font-medium text-green-600">+18.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stockout Reduction</span>
                  <span className="font-medium text-green-600">-67%</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3">Kenya Market Insights</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">M-Pesa Optimization</span>
                  <span className="font-medium text-blue-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seasonal Adjustments</span>
                  <span className="font-medium text-blue-600">Ramadan +40%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Local Preferences</span>
                  <span className="font-medium text-blue-600">Integrated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}