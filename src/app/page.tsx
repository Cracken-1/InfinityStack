import Link from 'next/link'
import Header from '@/components/layout/Header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            InfinityStack
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Production-ready multi-tenant enterprise cloud management platform designed for scalable business operations.
          </p>
          <div className="space-x-4">
            <Link 
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Multi-Tenant Architecture</h3>
            <p className="text-gray-600">Secure tenant isolation with database-level security and custom branding.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Enterprise Security</h3>
            <p className="text-gray-600">Zero-trust architecture with SOC2 compliance and comprehensive audit logging.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">AI-Powered Insights</h3>
            <p className="text-gray-600">Smart analytics and predictive business intelligence for data-driven decisions.</p>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/website-analyzer"
            className="text-blue-600 hover:underline text-lg"
          >
            Try our Website Analyzer →
          </Link>
        </div>
      </div>
    </div>
  )
}