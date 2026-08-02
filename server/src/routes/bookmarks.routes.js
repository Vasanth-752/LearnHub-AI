import { Router } from 'express'
import { getBookmarks, createBookmark, deleteBookmark } from '../controllers/bookmarks.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

/**
 * @route GET /api/bookmarks
 * @description Get all bookmarks for current user (newest first)
 * @access Private
 */
router.get('/', getBookmarks)

/**
 * @route POST /api/bookmarks
 * @description Add a new bookmark (video, cert, or note)
 * @body { type, title, url?, channel?, provider?, metadata? }
 * @access Private
 */
router.post('/', createBookmark)

/**
 * @route DELETE /api/bookmarks/:id
 * @description Remove a bookmark
 * @access Private
 */
router.delete('/:id', deleteBookmark)

export default router
