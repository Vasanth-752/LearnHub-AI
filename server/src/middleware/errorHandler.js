import { apiError } from '../utils/response.js'

/**
 * Global error handler middleware — must be registered LAST in Express middleware chain.
 * Catches all errors passed via next(err) or thrown in async handlers.
 */
export function errorHandler(err, req, res, next) {
  // Log full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err)
  } else {
    console.error(`[${new Date().toISOString()}] ERROR: ${err.message}`)
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return apiError(res, 'Validation error', 400, err.flatten?.().fieldErrors)
  }

  // Handle JWT / auth errors
  if (err.message === 'Unauthorized' || err.status === 401) {
    return apiError(res, 'Unauthorized', 401)
  }

  // Handle known operational errors with a statusCode
  if (err.statusCode) {
    return apiError(res, err.message, err.statusCode)
  }

  // Default: 500 Internal Server Error
  return apiError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    process.env.NODE_ENV !== 'production' ? err.stack : undefined
  )
}

/**
 * 404 handler — catch unmatched routes before the error handler
 */
export function notFoundHandler(req, res) {
  return apiError(res, `Route not found: ${req.method} ${req.path}`, 404)
}
