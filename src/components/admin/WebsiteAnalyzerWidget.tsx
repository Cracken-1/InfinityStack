'use client'

import { useState } from 'react'
import { Globe, Search, TrendingUp, Shield, Zap } from 'lucide-react'
import Modal from '@/components/ui/Modal'

export default function WebsiteAnalyzerWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!url.trim()) return

    setAnalyzing(true)
    try {
      const response = await fetch('/api/website-analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await response.json()
      if (data.success) {
        setResults(data.analysis.results)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsModalOpen(true)}>
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Globe className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Website Analyzer</h3>
            <p className="text-gray-600">Analyze any website for business insights</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Website Analyzer"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., example.com)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleAnalyze}
                disabled={!url.trim() || analyzing}
                className="btn-primary disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Business Model</p>
                  <p className="text-xs text-gray-600 capitalize">{results.businessModel?.type?.toLowerCase()}</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Zap className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Tech Stack</p>
                  <p className="text-xs text-gray-600">{results.technical?.stack?.length || 0} technologies</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-xs text-gray-600">
                    {results.technical?.security?.https ? 'HTTPS' : 'No HTTPS'}
                  </p>
                </div>
              </div>

              {results.recommendations && results.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Recommendations</h4>
                  <div className="space-y-2">
                    {results.recommendations.slice(0, 3).map((rec: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          rec.priority === 'HIGH' ? 'bg-red-500' :
                          rec.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                          <p className="text-xs text-gray-600">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button className="btn-primary">
                  Generate Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}