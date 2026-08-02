import { Router } from 'express'
import { healthCheck } from '../controllers/health.controller.js'

const router = Router()

/**
 * GET /api/health
 * Public endpoint — no authentication required.
 * Used by monitoring services and deployment health checks.
 */
router.get('/', healthCheck)

export default router
