export const APP_CONFIG = {
  name: 'InfinityStack',
  description: 'Production-ready multi-tenant enterprise cloud management platform',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile'
  },
  admin: {
    dashboard: '/api/admin/dashboard',
    products: '/api/admin/products',
    orders: '/api/admin/orders',
    customers: '/api/admin/customers'
  },
  superadmin: {
    tenants: '/api/superadmin/tenants',
    users: '/api/superadmin/users',
    analytics: '/api/superadmin/analytics'
  },
  websiteAnalyzer: {
    analyze: '/api/website-analyzer/analyze'
  }
}

export const SUBSCRIPTION_TIERS = {
  STARTER: {
    name: 'Starter',
    price: 29,
    features: ['Basic Dashboard', 'Up to 5 Users', 'Email Support'],
    limits: { users: 5, products: 100, locations: 1 }
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 99,
    features: ['Advanced Analytics', 'Up to 50 Users', 'Priority Support', 'Website Analyzer'],
    limits: { users: 50, products: 1000, locations: 5 }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    features: ['Custom Integrations', 'Unlimited Users', '24/7 Support', 'AI Insights'],
    limits: { users: -1, products: -1, locations: -1 }
  }
}

export const USER_ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  USER: 'USER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
} as const

export const INDUSTRIES = {
  RETAIL: 'Retail',
  RESTAURANT: 'Restaurant',
  LOGISTICS: 'Logistics',
  HEALTHCARE: 'Healthcare',
  TECHNOLOGY: 'Technology'
} as const

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Health & Beauty',
  'Automotive',
  'Food & Beverages'
]

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
}

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/
}