import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper to get user from JWT
export async function getUserFromToken(token) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) return null
  return user
}