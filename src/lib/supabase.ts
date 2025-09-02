import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClientComponentClient()

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