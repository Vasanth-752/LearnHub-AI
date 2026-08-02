/**
 * Notes Controller — LearnHub AI v1.5 Persistence
 *
 * Handles CRUD operations for user-saved study notes.
 * All routes require authentication — req.user is set by authenticate middleware.
 *
 * Routes:
 *   GET    /api/notes           — list all notes for current user
 *   POST   /api/notes           — save a new note
 *   DELETE /api/notes/:id       — delete a note
 *   PATCH  /api/notes/:id/pin   — toggle pin state
 */

import { supabase } from '../services/supabase.js'
import { apiSuccess, apiError } from '../utils/response.js'
import { logActivity } from '../services/streak.service.js'
import { z } from 'zod'

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createNoteSchema = z.object({
  topic:   z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
  content: z.string().min(1, 'Content is required'),
})

const pinNoteSchema = z.object({
  pinned: z.boolean(),
})

// ─── GET /api/notes ───────────────────────────────────────────────────────────

/**
 * List all notes for the authenticated user.
 * Returns pinned notes first, then by newest created_at.
 */
export async function getNotes(req, res) {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, topic, content, pinned, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getNotes DB error:', error)
      return apiError(res, 'Failed to load notes', 500)
    }

    return apiSuccess(res, notes, 'Notes retrieved')
  } catch (error) {
    console.error('getNotes error:', error)
    return apiError(res, 'Failed to load notes', 500)
  }
}

// ─── POST /api/notes ──────────────────────────────────────────────────────────

/**
 * Save a new study note.
 * Body: { topic, content }
 */
export async function createNote(req, res) {
  const parseResult = createNoteSchema.safeParse(req.body)

  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { topic, content } = parseResult.data

  try {
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: req.user.id,
        topic,
        content,
        pinned: false,
      })
      .select('id, topic, content, pinned, created_at, updated_at')
      .single()

    if (error) {
      console.error('createNote DB error:', error)
      return apiError(res, 'Failed to save note', 500)
    }

    // Log activity for streak tracking (non-fatal)
    logActivity(req.user.id).catch(() => {})

    return apiSuccess(res, note, 'Note saved to Vault', 201)
  } catch (error) {
    console.error('createNote error:', error)
    return apiError(res, 'Failed to save note', 500)
  }
}

// ─── DELETE /api/notes/:id ────────────────────────────────────────────────────

/**
 * Delete a note by ID.
 * Verifies ownership via user_id constraint in the WHERE clause.
 */
export async function deleteNote(req, res) {
  const { id } = req.params

  if (!id) {
    return apiError(res, 'Note ID is required', 400)
  }

  try {
    const { error, count } = await supabase
      .from('notes')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      console.error('deleteNote DB error:', error)
      return apiError(res, 'Failed to delete note', 500)
    }

    if (count === 0) {
      return apiError(res, 'Note not found', 404)
    }

    return apiSuccess(res, null, 'Note deleted')
  } catch (error) {
    console.error('deleteNote error:', error)
    return apiError(res, 'Failed to delete note', 500)
  }
}

// ─── PATCH /api/notes/:id/pin ─────────────────────────────────────────────────

/**
 * Toggle the pin state of a note.
 * Body: { pinned: boolean }
 */
export async function pinNote(req, res) {
  const { id } = req.params

  const parseResult = pinNoteSchema.safeParse(req.body)
  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { pinned } = parseResult.data

  try {
    const { data: note, error } = await supabase
      .from('notes')
      .update({ pinned })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, topic, pinned, updated_at')
      .single()

    if (error) {
      console.error('pinNote DB error:', error)
      return apiError(res, 'Failed to update note', 500)
    }

    if (!note) {
      return apiError(res, 'Note not found', 404)
    }

    return apiSuccess(res, note, pinned ? 'Note pinned' : 'Note unpinned')
  } catch (error) {
    console.error('pinNote error:', error)
    return apiError(res, 'Failed to update note', 500)
  }
}
