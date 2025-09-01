import Link from 'next/link'
import { Shield, Lock, Eye, Database } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Your privacy is important to us. Learn how we protect your data.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="w-6 h-6 text-blue-600 mr-2" />
              Information We Collect
            </h2>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly, automatically through your use of our services, 
              and from third parties.
            </p>
            <div className="grid gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Account Information</h3>
                <p className="text-sm text-gray-600">Name, email, company details, billing information</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Usage Data</h3>
                <p className="text-sm text-gray-600">How you interact with our platform, features used, performance metrics</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Business Data</h3>
                <p className="text-sm text-gray-600">Data you upload, create, or process through our platform</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="w-6 h-6 text-green-600 mr-2" />
              How We Use Your Information
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Provide and improve our services</li>
              <li>• Process transactions and send notifications</li>
              <li>• Provide customer support</li>
              <li>• Analyze usage patterns and optimize performance</li>
              <li>• Ensure security and prevent fraud</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="w-6 h-6 text-red-600 mr-2" />
              Data Security
            </h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-1 text-blue-800 text-sm">
                <li>• End-to-end encryption for data in transit and at rest</li>
                <li>• Multi-factor authentication and access controls</li>
                <li>• Regular security audits and penetration testing</li>
                <li>• SOC2 Type II compliance</li>
                <li>• GDPR and CCPA compliance</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="space-y-2 text-gray-700">
              <li>• Access your personal data</li>
              <li>• Correct inaccurate information</li>
              <li>• Delete your data (right to be forgotten)</li>
              <li>• Export your data (data portability)</li>
              <li>• Opt-out of marketing communications</li>
              <li>• Restrict processing of your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions or to exercise your rights:
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
              <Link href="/cookies" className="text-blue-600 hover:underline">
                Cookie Policy
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