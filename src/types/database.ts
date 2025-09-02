export interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  industry?: string
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  subscription_status: string
  max_users: number
  max_locations: number
  settings: Record<string, any>
  branding: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string
  role: string
  permissions: Record<string, any>
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  tenant_id: string
  category_id?: string
  name: string
  description?: string
  sku?: string
  price?: number
  cost?: number
  stock_quantity: number
  min_stock_level: number
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  tenant_id: string
  customer_id?: string
  location_id?: string
  order_number: string
  status: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_status: string
  payment_method?: string
  notes?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}