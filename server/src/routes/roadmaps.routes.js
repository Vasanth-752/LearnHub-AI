import { Router } from 'express'
import {
  getRoadmaps,
  createRoadmap,
  deleteRoadmap,
  toggleMilestone,
} from '../controllers/roadmaps.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// All roadmap routes require authentication
router.use(authenticate)

/**
 * @route GET /api/roadmaps
 * @description Get all saved roadmaps with milestones and progress for current user
 * @access Private
 */
router.get('/', getRoadmaps)

/**
 * @route POST /api/roadmaps
 * @description Save a roadmap from Explore (with milestones)
 * @body { topic: string, tier: 'sprint'|'stride'|'marathon', milestones: string[] }
 * @access Private
 */
router.post('/', createRoadmap)

/**
 * @route DELETE /api/roadmaps/:id
 * @description Delete a roadmap and all its milestones (cascade)
 * @access Private
 */
router.delete('/:id', deleteRoadmap)

/**
 * @route PATCH /api/roadmaps/:roadmapId/milestones/:id
 * @description Toggle milestone completion state
 * @body { completed: boolean }
 * @access Private
 */
router.patch('/:roadmapId/milestones/:id', toggleMilestone)

export default router
