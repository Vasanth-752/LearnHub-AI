import rateLimit from 'express-rate-limit'
import { apiError } from '../utils/response.js'

/**
 * General API rate limiter — applies to all /api routes.
 * Allows 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return apiError(res, 'Too many requests. Please slow down and try again.', 429)
  },
})

/**
 * Strict rate limiter for expensive AI operations (Explore search).
 * Allows 10 requests per minute per IP.
 */
export const exploreLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return apiError(res, 'Too many AI search requests. Please wait a moment before searching again.', 429)
  },
})

/**
 * Auth rate limiter — prevents brute-force on login/register routes.
 * Allows 20 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return apiError(res, 'Too many authentication attempts. Please try again in 15 minutes.', 429)
  },
})
