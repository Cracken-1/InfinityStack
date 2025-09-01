import { supabase } from './supabase'
import { User, UserRole, Tenant } from '@/types'

export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Get user profile with tenant info
    const userProfile = await this.getUserProfile(data.user.id)
    return { user: data.user, profile: userProfile }
  }

  static async signUp(email: string, password: string, userData: {
    name: string
    role: UserRole
    tenantId?: string
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const profile = await this.getUserProfile(user.id)
    return { user, profile }
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq('id', userId)
      .single()
    
    if (error) return null
    return data
  }

  static async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        ...tenantData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('domain', domain)
      .single()
    
    if (error) return null
    return data
  }

  static hasPermission(user: User, permission: string): boolean {
    const rolePermissions = {
      [UserRole.SUPERADMIN]: ['*'],
      [UserRole.ORG_ADMIN]: ['tenant:*', 'user:read', 'user:write'],
      [UserRole.USER]: ['user:read'],
      [UserRole.STAFF]: ['user:read', 'order:read', 'product:read'],
      [UserRole.CUSTOMER]: ['user:read']
    }

    const permissions = rolePermissions[user.role] || []
    return permissions.includes('*') || permissions.includes(permission)
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }
}