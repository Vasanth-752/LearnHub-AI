import { Router } from 'express'
import { generateRecap, getRecaps } from '../controllers/recap.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

/**
 * @route GET /api/recap
 * @description Get all past recaps for the user
 * @access Private
 */
router.get('/', getRecaps)

/**
 * @route POST /api/recap/generate
 * @description Generate a new recap using Gemini Flash based on last 7 days of activity
 * @access Private
 */
router.post('/generate', generateRecap)

export default router
