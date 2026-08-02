/**
 * Standardized API response utilities
 * All responses follow the same envelope shape for consistency
 */

/**
 * Send a successful JSON response
 * @param {import('express').Response} res
 * @param {*} data - Payload to include
 * @param {string} [message] - Optional success message
 * @param {number} [statusCode] - HTTP status code (default 200)
 */
export function apiSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

/**
 * Send an error JSON response
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode] - HTTP status code (default 500)
 * @param {*} [details] - Optional extra error details (only in non-prod)
 */
export function apiError(res, message = 'An unexpected error occurred', statusCode = 500, details = null) {
  const payload = {
    success: false,
    message,
  }

  if (details && process.env.NODE_ENV !== 'production') {
    payload.details = details
  }

  return res.status(statusCode).json(payload)
}
