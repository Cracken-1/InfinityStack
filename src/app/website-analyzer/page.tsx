'use client'

import { useState } from 'react'
import { Search, Globe, BarChart3, Shield, Zap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AnalysisResults, AnalysisStatus } from '@/types'

export default function WebsiteAnalyzerPage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.PENDING)
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!url.trim()) return

    setStatus(AnalysisStatus.ANALYZING)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const analysisResults = await response.json()
      setResults(analysisResults)
      setStatus(AnalysisStatus.COMPLETED)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStatus(AnalysisStatus.FAILED)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-600">Website Analyzer</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Input Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analyze Any Website in Seconds
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get comprehensive insights about business model, technical stack, performance, 
            security, and competitive positioning with our AI-powered analysis.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., example.com)"
                className="w-full pl-12 pr-32 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                onClick={handleAnalyze}
                disabled={!url.trim() || status === AnalysisStatus.ANALYZING}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {status === AnalysisStatus.ANALYZING ? (
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
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* PageSpeed-style Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Website Analysis Results</h2>
                  <p className="text-gray-600">{url}</p>
                </div>
              </div>

              {/* Core Web Vitals Style Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Business Score */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={results.businessModel.confidence && results.businessModel.confidence > 70 ? '#10b981' : results.businessModel.confidence && results.businessModel.confidence > 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="2"
                        strokeDasharray={`${(results.businessModel.confidence || 0) * 100 / 100}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">{results.businessModel.confidence || 0}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">Business Model</div>
                  <div className="text-xs text-gray-600 capitalize">{results.businessModel.type.toLowerCase()}</div>
                </div>

                {/* Brand Strength */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={results.businessModel.marketAnalysis?.brandStrength && results.businessModel.marketAnalysis.brandStrength > 70 ? '#10b981' : results.businessModel.marketAnalysis?.brandStrength && results.businessModel.marketAnalysis.brandStrength > 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="2"
                        strokeDasharray={`${(results.businessModel.marketAnalysis?.brandStrength || 0) * 100 / 100}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">{results.businessModel.marketAnalysis?.brandStrength || 0}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">Brand Strength</div>
                  <div className="text-xs text-gray-600">{results.businessModel.marketAnalysis?.positioning || 'Unknown'}</div>
                </div>

                {/* SEO Score */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={(results.technical.seo.title && results.technical.seo.metaDescription) ? '#10b981' : results.technical.seo.title ? '#f59e0b' : '#ef4444'}
                        strokeWidth="2"
                        strokeDasharray={`${(results.technical.seo.title && results.technical.seo.metaDescription) ? 85 : results.technical.seo.title ? 50 : 20}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">
                        {(results.technical.seo.title && results.technical.seo.metaDescription) ? 85 : results.technical.seo.title ? 50 : 20}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">SEO</div>
                  <div className="text-xs text-gray-600">Search Optimization</div>
                </div>

                {/* Security Score */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={results.technical.security.https ? '#10b981' : '#ef4444'}
                        strokeWidth="2"
                        strokeDasharray={`${results.technical.security.https ? 90 : 30}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">
                        {results.technical.security.https ? 90 : 30}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">Security</div>
                  <div className="text-xs text-gray-600">{results.technical.security.https ? 'HTTPS Enabled' : 'Needs HTTPS'}</div>
                </div>
              </div>
            </div>

            {/* PageSpeed-style Opportunities */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Opportunities</h3>
                <p className="text-sm text-gray-600 mt-1">These suggestions can help improve your business performance</p>
              </div>
              <div className="divide-y">
                {results.recommendations.slice(0, 6).map((rec, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        rec.priority === 'HIGH' ? 'bg-red-500' :
                        rec.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}>
                        !
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.priority} PRIORITY
                          </span>
                          <span className="text-gray-500">{rec.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PageSpeed-style Metrics */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Metrics</h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Business Model Clarity */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      results.businessModel.confidence && results.businessModel.confidence > 70 ? 'bg-green-500' :
                      results.businessModel.confidence && results.businessModel.confidence > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">Business Model Clarity</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gray-900">{results.businessModel.confidence || 0}</div>
                    <div className="text-xs text-gray-500">Confidence Score</div>
                  </div>
                </div>

                {/* Revenue Diversification */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      results.businessModel.revenue.length > 2 ? 'bg-green-500' :
                      results.businessModel.revenue.length > 1 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">Revenue Diversification</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gray-900">{results.businessModel.revenue.length}</div>
                    <div className="text-xs text-gray-500">Revenue Streams</div>
                  </div>
                </div>

                {/* Brand Strength */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      results.businessModel.marketAnalysis?.brandStrength && results.businessModel.marketAnalysis.brandStrength > 70 ? 'bg-green-500' :
                      results.businessModel.marketAnalysis?.brandStrength && results.businessModel.marketAnalysis.brandStrength > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">Brand Strength</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gray-900">{results.businessModel.marketAnalysis?.brandStrength || 0}</div>
                    <div className="text-xs text-gray-500">Trust Indicators</div>
                  </div>
                </div>

                {/* Competitive Advantages */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      (results.businessModel.competitiveAdvantage?.advantages.length || 0) > 2 ? 'bg-green-500' :
                      (results.businessModel.competitiveAdvantage?.advantages.length || 0) > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">Competitive Advantages</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gray-900">{results.businessModel.competitiveAdvantage?.advantages.length || 0}</div>
                    <div className="text-xs text-gray-500">Identified</div>
                  </div>
                </div>

                {/* SEO Foundation */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      (results.technical.seo.title && results.technical.seo.metaDescription) ? 'bg-green-500' :
                      results.technical.seo.title ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">SEO Foundation</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gray-900">
                      {(results.technical.seo.title && results.technical.seo.metaDescription) ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-500">Basic Elements</div>
                  </div>
                </div>

                {/* Security Implementation */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      results.technical.security.https ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">Security Implementation</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gray-900">
                      {results.technical.security.https ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-500">HTTPS Status</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Intelligence Summary */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Business Intelligence Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Market Position</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Market Size</span>
                        <span className="font-medium">{results.businessModel.businessIntel?.marketSize || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Focus</span>
                        <span className="font-medium">{results.businessModel.marketAnalysis?.marketFocus || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Positioning</span>
                        <span className="font-medium">{results.businessModel.marketAnalysis?.positioning || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Target Audience</h4>
                    <div className="flex flex-wrap gap-1">
                      {results.businessModel.businessIntel?.targetAudience?.map((audience, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {audience}
                        </span>
                      )) || <span className="text-gray-500 text-sm">Not identified</span>}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Growth Indicators</h4>
                    <div className="space-y-1">
                      {results.businessModel.businessIntel?.growthIndicators?.map((indicator, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                          {indicator}
                        </div>
                      )) || <span className="text-gray-500 text-sm">No indicators found</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Business Analysis */}
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Business Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Business Model</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-600 capitalize">{results.businessModel.type.toLowerCase()}</p>
                      {results.businessModel.confidence && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {results.businessModel.confidence}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Revenue Streams</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {results.businessModel.revenue.map((stream, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
                          {stream}
                        </span>
                      ))}
                    </div>
                  </div>

                  {results.businessModel.products.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Products/Services</h4>
                      <div className="mt-2 space-y-1">
                        {results.businessModel.products.slice(0, 5).map((product, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{product.name}</span>
                            <span className="text-gray-900">{product.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(results.businessModel.content?.socialMedia?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Social Media Presence</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {results.businessModel.content?.socialMedia?.map((platform, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Analysis */}
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Technical Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Technology Stack</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {results.technical.stack.map((tech, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">SEO Analysis</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Page Title</span>
                        <span className={results.technical.seo.title ? 'text-green-600' : 'text-red-600'}>
                          {results.technical.seo.title ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Meta Description</span>
                        <span className={results.technical.seo.metaDescription ? 'text-green-600' : 'text-red-600'}>
                          {results.technical.seo.metaDescription ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">H1 Tags</span>
                        <span className="text-gray-900">{results.technical.seo.headings.h1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Images</span>
                        <span className="text-gray-900">{results.technical.seo.images.total}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Security</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">HTTPS</span>
                        <span className={results.technical.security.https ? 'text-green-600' : 'text-red-600'}>
                          {results.technical.security.https ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Analysis */}
            {results.businessModel.content && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Page Structure */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Page Structure</h3>
                  <div className="space-y-3">
                    {(results.businessModel.content?.headings?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Main Headings</h4>
                        <div className="mt-1 space-y-1">
                          {results.businessModel.content?.headings?.slice(0, 5).map((heading, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              <span className="font-mono">H{heading.level}</span>: {heading.text.slice(0, 40)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(results.businessModel.content?.forms?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Forms Detected</h4>
                        <p className="text-xs text-gray-600">{results.businessModel.content?.forms?.length ?? 0} forms found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {(results.businessModel.content?.contactInfo?.emails?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Email Addresses</h4>
                        <div className="mt-1 space-y-1">
                          {results.businessModel.content?.contactInfo?.emails?.map((email, index) => (
                            <div key={index} className="text-xs text-gray-600">{email}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {results.businessModel.content?.contactInfo?.hasContactForm && (
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Contact Form</h4>
                        <p className="text-xs text-green-600">✓ Contact form available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation & Links */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Navigation</h3>
                  <div className="space-y-3">
                    {(results.businessModel.content?.links?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Key Links</h4>
                        <div className="mt-1 space-y-1">
                          {results.businessModel.content?.links?.slice(0, 5).map((link, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {link.text.slice(0, 30)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Total Links</h4>
                      <p className="text-xs text-gray-600">{results.businessModel.content?.links?.length ?? 0} links found</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Recommendations with Dashboard Widgets */}
            {results.recommendations.length > 0 && (
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Strategic Recommendations</h3>
                  <span className="text-sm text-gray-500">{results.recommendations.length} opportunities identified</span>
                </div>
                <div className="space-y-4">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className={`border-l-4 pl-4 ${
                      rec.priority === 'HIGH' ? 'border-red-500 bg-red-50' :
                      rec.priority === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
                      'border-green-500 bg-green-50'
                    } p-4 rounded-r-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority} PRIORITY
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {rec.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{rec.description}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-primary-600 text-sm font-medium">{rec.impact}</p>
                        {rec.dashboardWidget && (
                          <button className="px-3 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700">
                            Add {rec.dashboardWidget} to Dashboard
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboard Customization CTA */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
              <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                Get a custom InfinityStack dashboard with real-time analytics, competitor tracking, 
                and AI-powered insights based on this comprehensive analysis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/admin" className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
                  Create Custom Dashboard
                </Link>
                <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600">
                  Schedule Strategy Call
                </button>
              </div>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Real-time Analytics</div>
                  <div className="text-primary-200">Live performance tracking</div>
                </div>
                <div>
                  <div className="font-semibold">Competitor Monitoring</div>
                  <div className="text-primary-200">Stay ahead of competition</div>
                </div>
                <div>
                  <div className="font-semibold">AI Recommendations</div>
                  <div className="text-primary-200">Smart business insights</div>
                </div>
                <div>
                  <div className="font-semibold">Custom Widgets</div>
                  <div className="text-primary-200">Tailored to your business</div>
                </div>
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  )
}