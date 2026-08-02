import { Router } from 'express'
import { register, login, logout, syncProfile, getProfile } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const router = Router()

/**
 * @route POST /api/auth/register
 * @description Register a new user with email/password
 * @access Public
 * @rateLimit authLimiter (20 requests per 15 minutes)
 */
router.post('/register', authLimiter, register)

/**
 * @route POST /api/auth/login
 * @description Login with email/password
 * @access Public
 * @rateLimit authLimiter (20 requests per 15 minutes)
 */
router.post('/login', authLimiter, login)

/**
 * @route POST /api/auth/logout
 * @description Logout (client-side token deletion, endpoint for completeness)
 * @access Public
 */
router.post('/logout', logout)

/**
 * @route POST /api/auth/sync
 * @description Sync profile after OAuth callback
 * @access Public (called from client after OAuth redirect)
 */
router.post('/sync', syncProfile)

/**
 * @route GET /api/auth/me
 * @description Get current user profile
 * @access Private (requires valid JWT)
 */
router.get('/me', authenticate, getProfile)

export default router