import { getUserFromToken } from '../services/supabase.js'
import { apiError } from '../utils/response.js'

/**
 * Authentication middleware.
 * Extracts the Bearer JWT from Authorization header, validates it against
 * Supabase and attaches the user to req.user.
 *
 * Usage: apply to any protected route.
 *   router.use(authenticate)
 *   router.get('/protected', authenticate, handler)
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiError(res, 'Unauthorized — missing or malformed Authorization header', 401)
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return apiError(res, 'Unauthorized — missing token', 401)
  }

  try {
    const user = await getUserFromToken(token)

    if (!user) {
      return apiError(res, 'Unauthorized — invalid or expired token', 401)
    }

    // Attach user to request for downstream handlers
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return apiError(res, 'Unauthorized', 401)
  }
}
