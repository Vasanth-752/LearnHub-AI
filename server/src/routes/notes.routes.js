import { Router } from 'express'
import { getNotes, createNote, deleteNote, pinNote } from '../controllers/notes.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// All notes routes require authentication
router.use(authenticate)

/**
 * @route GET /api/notes
 * @description Get all notes for the current user (pinned first, then newest)
 * @access Private
 */
router.get('/', getNotes)

/**
 * @route POST /api/notes
 * @description Save a new note to the Vault
 * @body { topic: string, content: string }
 * @access Private
 */
router.post('/', createNote)

/**
 * @route DELETE /api/notes/:id
 * @description Delete a note
 * @access Private
 */
router.delete('/:id', deleteNote)

/**
 * @route PATCH /api/notes/:id/pin
 * @description Toggle pin state on a note
 * @body { pinned: boolean }
 * @access Private
 */
router.patch('/:id/pin', pinNote)

export default router
