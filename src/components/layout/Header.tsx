'use client'

import Link from 'next/link'
import { Settings, Bell, User } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  backUrl?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, backUrl, actions }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            {backUrl && (
              <Link href={backUrl} className="text-gray-600 hover:text-gray-900">
                ←
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-primary-600">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {actions}
            <button className="text-gray-600 hover:text-gray-900">
              <Bell className="h-6 w-6" />
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              <Settings className="h-6 w-6" />
            </button>
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}