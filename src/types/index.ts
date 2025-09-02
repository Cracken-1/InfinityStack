// Core Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  USER = 'USER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export interface Tenant {
  id: string
  name: string
  domain: string
  industry: Industry
  subscriptionTier: SubscriptionTier
  settings: TenantSettings
  createdAt: string
  updatedAt: string
}

export enum Industry {
  RETAIL = 'RETAIL',
  RESTAURANT = 'RESTAURANT',
  LOGISTICS = 'LOGISTICS',
  HEALTHCARE = 'HEALTHCARE',
  TECHNOLOGY = 'TECHNOLOGY'
}

export enum SubscriptionTier {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export interface TenantSettings {
  branding: {
    logo?: string
    primaryColor: string
    secondaryColor: string
  }
  features: {
    websiteAnalyzer: boolean
    aiInsights: boolean
    advancedReporting: boolean
  }
  limits: {
    users: number
    locations: number
    products: number
  }
}

// Website Analyzer Types
export interface WebsiteAnalysis {
  id: string
  url: string
  tenantId: string
  status: AnalysisStatus
  results?: AnalysisResults
  createdAt: string
  updatedAt: string
}

export enum AnalysisStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface AnalysisResults {
  businessModel: BusinessModelAnalysis
  technical: TechnicalAnalysis
  competitive: CompetitiveAnalysis
  recommendations: Recommendation[]
}

export interface BusinessModelAnalysis {
  type: 'ECOMMERCE' | 'SAAS' | 'MARKETPLACE' | 'CONTENT'
  revenue: string[]
  products: any[]
  pricing: any
  content?: {
    headings: { level: number; text: string }[]
    links: { url: string; text: string }[]
    images: { src: string; alt: string }[]
    forms: { action: string; method: string; inputs: number }[]
    socialMedia: string[]
    contactInfo: {
      emails: string[]
      phones: string[]
      hasContactForm: boolean
    }
  }
  confidence?: number
  marketAnalysis?: {
    brandStrength: number
    marketFocus: string
    competitiveKeywords: string[]
    positioning: string
  }
  competitiveAdvantage?: {
    advantages: string[]
    uniqueSellingPoints: string[]
    marketDifferentiators: string[]
  }
  businessIntel?: {
    targetAudience: string[]
    valueProposition: string
    marketSize: string
    growthIndicators: string[]
  }
}

export interface TechnicalAnalysis {
  stack: string[]
  performance: any
  security: any
  seo: any
}

export interface CompetitiveAnalysis {
  competitors: any[]
  marketPosition: string
  opportunities: string[]
  threats: string[]
}

export interface Recommendation {
  category: 'PERFORMANCE' | 'SECURITY' | 'SEO' | 'BUSINESS'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  impact: string
  dashboardWidget?: string
}

// Dashboard Types
export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  data: any
  position: { x: number; y: number; w: number; h: number }
}

export enum WidgetType {
  METRIC = 'METRIC',
  CHART = 'CHART',
  TABLE = 'TABLE',
  MAP = 'MAP'
}