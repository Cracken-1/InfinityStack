import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  sku: z.string().min(1, 'SKU is required')
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional()
})

export const tenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  domain: z.string().min(1, 'Domain is required'),
  industry: z.enum(['RETAIL', 'RESTAURANT', 'LOGISTICS', 'HEALTHCARE', 'TECHNOLOGY']),
  subscriptionTier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional()
})

export const websiteAnalysisSchema = z.object({
  url: z.string().url('Invalid URL format'),
  tenantId: z.string().optional()
})

export type LoginInput = z.infer<typeof loginSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type TenantInput = z.infer<typeof tenantSchema>
export type WebsiteAnalysisInput = z.infer<typeof websiteAnalysisSchema>