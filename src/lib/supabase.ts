import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey && supabaseAnonKey !== 'placeholder_anon_key'

// Create a mock client for development/demo purposes
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    exchangeCodeForSession: () => Promise.resolve({ error: new Error('Supabase not configured') })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
  })
}

export const supabase = isSupabaseConfigured ? createClientComponentClient() : mockSupabaseClient as any

// Server-side client with service role
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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