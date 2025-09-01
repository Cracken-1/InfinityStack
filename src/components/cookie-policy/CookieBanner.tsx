'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Cookie } from 'lucide-react'
import { shouldShowCookieBanner, acceptAllCookies, acceptNecessaryOnly, setCookieConsent, type CookieConsent } from '@/lib/cookies'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  })

  useEffect(() => {
    setShowBanner(shouldShowCookieBanner())
  }, [])

  const handleAcceptAll = () => {
    acceptAllCookies()
    setShowBanner(false)
  }

  const handleAcceptNecessary = () => {
    acceptNecessaryOnly()
    setShowBanner(false)
  }

  const handleSaveSettings = () => {
    setCookieConsent(consent)
    setShowBanner(false)
    setShowSettings(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      {!showSettings ? (
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-start gap-4">
            <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">We use cookies</h3>
              <p className="text-sm text-gray-600 mb-4">
                We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                You can manage your preferences or learn more in our{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Accept All
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Necessary Only
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-1 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Necessary Cookies</h4>
                <p className="text-sm text-gray-600">Required for basic site functionality</p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                <p className="text-sm text-gray-600">Help us understand how you use our site</p>
              </div>
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent(prev => ({ ...prev, analytics: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
                <p className="text-sm text-gray-600">Used to show you relevant advertisements</p>
              </div>
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent(prev => ({ ...prev, marketing: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Preference Cookies</h4>
                <p className="text-sm text-gray-600">Remember your settings and preferences</p>
              </div>
              <input
                type="checkbox"
                checked={consent.preferences}
                onChange={(e) => setConsent(prev => ({ ...prev, preferences: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSaveSettings}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Save Preferences
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Accept All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}