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
          <div className="space-y-8">
            {/* Enhanced Overview Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card text-center">
                <BarChart3 className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Business Model</h3>
                <p className="text-sm text-gray-600 capitalize">{results.businessModel.type.toLowerCase()}</p>
                {results.businessModel.confidence && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${results.businessModel.confidence}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{results.businessModel.confidence}% confidence</p>
                  </div>
                )}
              </div>
              
              <div className="card text-center">
                <Zap className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Market Position</h3>
                <p className="text-sm text-gray-600">
                  {results.businessModel.marketAnalysis?.positioning || 'Analyzing...'}
                </p>
                {results.businessModel.marketAnalysis?.brandStrength && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${results.businessModel.marketAnalysis.brandStrength}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Brand Strength</p>
                  </div>
                )}
              </div>
              
              <div className="card text-center">
                <Shield className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Competitive Edge</h3>
                <p className="text-sm text-gray-600">
                  {results.businessModel.competitiveAdvantage?.advantages.length || 0} advantages
                </p>
              </div>
              
              <div className="card text-center">
                <Search className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Revenue Streams</h3>
                <p className="text-sm text-gray-600">
                  {results.businessModel.revenue.length} identified
                </p>
              </div>
            </div>

            {/* Business Intelligence Dashboard */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Business Intelligence Report</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  AI-Powered Analysis
                </span>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Market Analysis */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Market Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Size</span>
                      <span className="font-medium">{results.businessModel.businessIntel?.marketSize || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Focus</span>
                      <span className="font-medium">{results.businessModel.marketAnalysis?.marketFocus || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value Prop</span>
                      <span className="font-medium text-sm">{results.businessModel.businessIntel?.valueProposition || 'Not Clear'}</span>
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Target Audience</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.businessModel.businessIntel?.targetAudience?.map((audience, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {audience}
                      </span>
                    )) || <span className="text-gray-500 text-sm">Not identified</span>}
                  </div>
                </div>

                {/* Growth Indicators */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Growth Signals</h4>
                  <div className="space-y-1">
                    {results.businessModel.businessIntel?.growthIndicators?.map((indicator, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {indicator}
                      </div>
                    )) || <span className="text-gray-500 text-sm">No clear indicators</span>}
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