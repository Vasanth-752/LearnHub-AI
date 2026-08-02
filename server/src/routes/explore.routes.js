import { Router } from 'express'
import { exploreSearch } from '../controllers/explore.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { exploreLimiter } from '../middleware/rateLimiter.js'

const router = Router()

/**
 * @route GET /api/explore
 * @description Search for learning content (AI notes, videos, certifications, roadmap)
 * @access Private (requires valid JWT) - but can work without auth for demo
 * @query q - Search query (required)
 * @rateLimit exploreLimiter (10 requests per minute)
 */
router.get('/', exploreLimiter, authenticate, exploreSearch)

export default router