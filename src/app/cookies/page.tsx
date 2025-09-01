import Link from 'next/link'
import { Cookie, Shield, Eye, Settings } from 'lucide-react'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Cookie className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-xl text-gray-600">
            Learn how InfinityStack uses cookies to enhance your experience
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-2 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Quick Summary
            </h2>
            <p className="text-blue-800 mb-0">
              We use cookies to improve your experience, analyze site usage, and personalize content. 
              You can control cookie preferences through our cookie banner or browser settings.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files stored on your device when you visit our website. 
              They help us remember your preferences, understand how you use our site, and provide a better experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
            
            <div className="grid gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  Necessary Cookies
                </h3>
                <p className="text-gray-700 mb-3">
                  Essential for basic website functionality. These cannot be disabled.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Authentication and security</li>
                  <li>• Session management</li>
                  <li>• Load balancing</li>
                  <li>• CSRF protection</li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <Settings className="w-5 h-5 text-blue-600 mr-2" />
                  Analytics Cookies
                </h3>
                <p className="text-gray-700 mb-3">
                  Help us understand how visitors interact with our website.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Google Analytics (_ga, _gid, _gat)</li>
                  <li>• Page view tracking</li>
                  <li>• User behavior analysis</li>
                  <li>• Performance monitoring</li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Marketing Cookies</h3>
                <p className="text-gray-700 mb-3">
                  Used to show relevant advertisements and measure campaign effectiveness.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Facebook Pixel (_fbp, _fbc)</li>
                  <li>• Google Ads conversion tracking</li>
                  <li>• Retargeting campaigns</li>
                  <li>• Social media integration</li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Preference Cookies</h3>
                <p className="text-gray-700 mb-3">
                  Remember your settings and preferences for a personalized experience.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Language preferences</li>
                  <li>• Theme settings</li>
                  <li>• Dashboard customizations</li>
                  <li>• Notification preferences</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Cookie Banner</h3>
                <p className="text-blue-800 text-sm">
                  Use our cookie banner to accept all cookies, necessary only, or customize your preferences.
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Browser Settings</h3>
                <p className="text-gray-700 text-sm mb-2">
                  You can also manage cookies through your browser settings.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> privacy@infinitystack.com</li>
                <li><strong>Phone:</strong> +1 (555) 123-4567</li>
              </ul>
            </div>
          </section>

          <div className="border-t pt-8 mt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>
              <Link href="/" className="text-blue-600 hover:underline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}