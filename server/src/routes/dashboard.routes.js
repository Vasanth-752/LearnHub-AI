import { Router } from 'express'
import {
  getDashboardStats,
  getDashboardStreak,
  getDashboardProgress,
} from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

/**
 * @route GET /api/dashboard/stats
 * @description Aggregate stats: notes count, active pathways, topics explored, completion rate
 * @access Private
 */
router.get('/stats', getDashboardStats)

/**
 * @route GET /api/dashboard/streak
 * @description Streak data: current/longest streak, 35-day calendar, 90-day heatmap
 * @access Private
 */
router.get('/streak', getDashboardStreak)

/**
 * @route GET /api/dashboard/progress
 * @description Per-roadmap progress for bar chart (last 10 roadmaps)
 * @access Private
 */
router.get('/progress', getDashboardProgress)

export default router
