import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key length:', supabaseAnonKey?.length)
}

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'placeholder_anon_key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20

// Create a mock client for development/demo purposes
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signInWithOtp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    verifyOtp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    exchangeCodeForSession: () => Promise.resolve({ error: new Error('Supabase not configured') })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      order: () => ({
        limit: () => Promise.resolve({ data: [], error: null })
      })
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    upsert: () => Promise.resolve({ data: null, error: null })
  }),
  rpc: () => Promise.resolve({ data: null, error: null })
}

// Use conditional client creation with error handling
let supabaseClient: any
try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder_key') {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  } else {
    supabaseClient = mockSupabaseClient
  }
} catch (error) {
  console.error('Supabase client creation failed:', error)
  supabaseClient = mockSupabaseClient
}

export const supabase = supabaseClient

// Always export the configured status for components to check
export const isConfigured = isSupabaseConfigured

// Server-side client with service role
let supabaseAdminClient: any
try {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && serviceRoleKey && supabaseUrl !== 'https://placeholder.supabase.co') {
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey)
  } else {
    supabaseAdminClient = mockSupabaseClient
  }
} catch (error) {
  console.error('Supabase admin client creation failed:', error)
  supabaseAdminClient = mockSupabaseClient
}

export const supabaseAdmin = supabaseAdminClient

// Export createClient for API routes
export { createClient }

// Export db as alias for supabaseAdmin
export const db = supabaseAdmin

// Set tenant context for RLS
export const setTenantContext = async (tenantId: string) => {
  await supabase.rpc('set_config', {
    setting_name: 'app.current_tenant_id',
    setting_value: tenantId,
    is_local: true
  })
}

// Get user profile (platform or tenant)
export const getUserProfile = async (email: string) => {
  // Check if platform user
  const { data: platformUser } = await supabase
    .from('platform_users')
    .select('*')
    .eq('email', email)
    .single()

  if (platformUser) {
    return { type: 'platform', user: platformUser }
  }

  // Check if tenant user
  const { data: tenantUser } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('email', email)
    .single()

  if (tenantUser) {
    return { type: 'tenant', user: tenantUser }
  }

  return null
}