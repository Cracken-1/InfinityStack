import Link from 'next/link'
import { FileText, Scale, AlertTriangle } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600">
            Please read these terms carefully before using InfinityStack.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Notice
            </h2>
            <p className="text-yellow-800 mb-0">
              By using InfinityStack, you agree to these terms. If you don't agree, please don't use our services.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing or using InfinityStack, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              InfinityStack provides a multi-tenant business management platform with AI-powered features including:
            </p>
            <ul className="space-y-1 text-gray-700">
              <li>• Business analytics and insights</li>
              <li>• Workflow automation</li>
              <li>• Real-time collaboration tools</li>
              <li>• Customer and inventory management</li>
              <li>• Website analysis tools</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Account Responsibility</h3>
                <p className="text-sm text-gray-600">
                  You are responsible for maintaining the confidentiality of your account credentials 
                  and all activities under your account.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Accurate Information</h3>
                <p className="text-sm text-gray-600">
                  You must provide accurate and complete information when creating your account 
                  and keep it updated.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="space-y-1 text-gray-700">
              <li>• Use the service for illegal activities</li>
              <li>• Attempt to gain unauthorized access</li>
              <li>• Interfere with service operation</li>
              <li>• Upload malicious content</li>
              <li>• Violate intellectual property rights</li>
              <li>• Spam or send unsolicited communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Scale className="w-6 h-6 text-blue-600 mr-2" />
              5. Subscription and Billing
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Subscription fees are billed in advance on a monthly or annual basis. 
                All fees are non-refundable except as required by law.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Free Trial</h3>
                <p className="text-blue-800 text-sm">
                  We may offer free trials. At the end of the trial, you'll be charged 
                  unless you cancel before the trial ends.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data and Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your data privacy is governed by our Privacy Policy. We implement appropriate 
              security measures but cannot guarantee absolute security.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                You retain ownership of your data. We only use it to provide services 
                as described in our Privacy Policy.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700">
              InfinityStack is provided "as is" without warranties. We are not liable for 
              indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-700 mb-4">
              Either party may terminate the agreement at any time. Upon termination:
            </p>
            <ul className="space-y-1 text-gray-700">
              <li>• Your access to the service will be suspended</li>
              <li>• You may export your data for 30 days</li>
              <li>• We may delete your data after the retention period</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these terms from time to time. We'll notify you of significant 
              changes via email or through the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these terms:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> legal@infinitystack.com</li>
                <li><strong>Phone:</strong> +1 (555) 123-4567</li>
              </ul>
            </div>
          </section>

          <div className="border-t pt-8 mt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-blue-600 hover:underline">
                Cookie Policy
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