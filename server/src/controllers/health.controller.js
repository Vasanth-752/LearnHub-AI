import { apiSuccess } from '../utils/response.js'

/**
 * Health check controller.
 * Returns a simple OK status to confirm the server is alive and running.
 * Used by deployment platforms (Render, etc.) and monitoring tools.
 */
export function healthCheck(req, res) {
  return apiSuccess(res, {
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }, 'LearnHub AI server is running')
}
