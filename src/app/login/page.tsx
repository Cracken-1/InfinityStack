'use client'

import { useState } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import PhoneAuth from '@/components/auth/PhoneAuth'
import MagicLinkAuth from '@/components/auth/MagicLinkAuth'

type AuthMethod = 'email' | 'phone' | 'magic'

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email')

  const renderAuthComponent = () => {
    switch (authMethod) {
      case 'phone':
        return <PhoneAuth />
      case 'magic':
        return <MagicLinkAuth />
      default:
        return <LoginForm />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">InfinityStack</h1>
          <p className="text-gray-600">Enterprise Cloud Management Platform</p>
        </div>

        {/* Auth Method Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setAuthMethod('email')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 ${
              authMethod === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setAuthMethod('phone')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 ${
              authMethod === 'phone'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Phone
          </button>
          <button
            onClick={() => setAuthMethod('magic')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 ${
              authMethod === 'magic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Magic Link
          </button>
        </div>

        {renderAuthComponent()}
      </div>
    </div>
  )
}