import { supabase, getUserFromToken } from '../services/supabase.js'
import { apiSuccess, apiError } from '../utils/response.js'
import { z } from 'zod'

/**
 * Validation schemas
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const syncSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email format'),
  name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
})

/**
 * Register a new user with email/password
 * Creates Supabase Auth user and upserts profile
 */
export async function register(req, res) {
  const parseResult = registerSchema.safeParse(req.body)

  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { email, password, name } = parseResult.data

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: { full_name: name },
    })

    if (authError) {
      console.error('Supabase auth createUser error:', authError)
      if (authError.message.includes('already registered')) {
        return apiError(res, 'An account with this email already exists', 409)
      }
      return apiError(res, 'Failed to create account', 500)
    }

    const user = authData.user

    // Upsert profile in public.profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        name: name || user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      // Don't fail registration if profile creation fails - user can still log in
    }

    return apiSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: name || user.user_metadata?.full_name || '',
      },
      session: null, // No session returned from admin.createUser
    }, 'Account created successfully. Please log in.', 201)

  } catch (error) {
    console.error('Register error:', error)
    return apiError(res, 'Registration failed', 500)
  }
}

/**
 * Login with email/password
 * Returns session with access_token for client-side auth
 */
export async function login(req, res) {
  const parseResult = loginSchema.safeParse(req.body)

  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { email, password } = parseResult.data

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Supabase signInWithPassword error:', error)
      if (error.message.includes('Invalid login credentials')) {
        return apiError(res, 'Invalid email or password', 401)
      }
      return apiError(res, 'Login failed', 500)
    }

    // Ensure profile exists (upsert in case it was created via OAuth)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || '',
        avatar_url: data.user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert on login error:', profileError)
    }

    return apiSuccess(res, {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || '',
      },
      session: data.session,
    }, 'Login successful')

  } catch (error) {
    console.error('Login error:', error)
    return apiError(res, 'Login failed', 500)
  }
}

/**
 * Logout - client-side handled, but this endpoint exists for completeness
 * Supabase handles token invalidation client-side
 */
export async function logout(req, res) {
  // With JWT-based auth, logout is primarily client-side (token deletion)
  // This endpoint can be used for server-side session cleanup if needed
  return apiSuccess(res, null, 'Logged out successfully')
}

/**
 * Sync profile - called after OAuth callback to ensure profile exists
 * Upserts profile data from Supabase Auth user metadata
 */
export async function syncProfile(req, res) {
  const parseResult = syncSchema.safeParse(req.body)

  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { user_id, email, name, avatar_url } = parseResult.data

  try {
    // Verify the user exists in auth (optional security check)
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id)

    if (userError || !user) {
      return apiError(res, 'User not found', 404)
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user_id,
        email,
        name: name || user.user_metadata?.full_name || '',
        avatar_url: avatar_url || user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile sync error:', profileError)
      return apiError(res, 'Failed to sync profile', 500)
    }

    return apiSuccess(res, { user_id }, 'Profile synced successfully')

  } catch (error) {
    console.error('Sync profile error:', error)
    return apiError(res, 'Profile sync failed', 500)
  }
}

/**
 * Get current user profile (protected route)
 */
export async function getProfile(req, res) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, name, avatar_url, created_at')
      .eq('id', req.user.id)
      .single()

    if (error || !profile) {
      return apiError(res, 'Profile not found', 404)
    }

    return apiSuccess(res, profile, 'Profile retrieved')

  } catch (error) {
    console.error('Get profile error:', error)
    return apiError(res, 'Failed to retrieve profile', 500)
  }
}