import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import exploreRoutes from './explore.routes.js'
import notesRoutes from './notes.routes.js'
import roadmapsRoutes from './roadmaps.routes.js'
import bookmarksRoutes from './bookmarks.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import recapRoutes from './recap.routes.js'

const router = Router()

/**
 * Route aggregator — mounts all feature routers under /api
 * Add new feature routes here as they are built in future versions.
 *
 * v0.1: Health check
 * v1.0: Auth, Explore
 * v1.5: Notes, Roadmaps
 * v2.0: Bookmarks, Streaks, Dashboard
 * v2.5: Recap
 */
router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/explore', exploreRoutes)
router.use('/notes', notesRoutes)
router.use('/roadmaps', roadmapsRoutes)
router.use('/bookmarks', bookmarksRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/recap', recapRoutes)

export default router