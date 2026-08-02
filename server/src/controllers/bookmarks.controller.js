/**
 * Bookmarks Controller — LearnHub AI v2.0 Engagement
 *
 * CRUD for bookmarked items (videos, certifications, notes).
 * All routes require authentication.
 *
 * Routes:
 *   GET    /api/bookmarks        — list all bookmarks for current user
 *   POST   /api/bookmarks        — add a new bookmark
 *   DELETE /api/bookmarks/:id    — remove a bookmark
 */

import { supabase } from '../services/supabase.js'
import { apiSuccess, apiError } from '../utils/response.js'
import { z } from 'zod'

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createBookmarkSchema = z.object({
  type:     z.enum(['videos', 'certifications', 'notes'], {
    errorMap: () => ({ message: 'Type must be videos, certifications, or notes' }),
  }),
  title:    z.string().min(1, 'Title is required').max(300),
  url:      z.string().url('Must be a valid URL').optional().nullable(),
  channel:  z.string().max(200).optional().nullable(),
  provider: z.string().max(200).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

// ─── GET /api/bookmarks ───────────────────────────────────────────────────────

/**
 * List all bookmarks for the authenticated user, newest first.
 */
export async function getBookmarks(req, res) {
  try {
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('id, type, title, url, channel, provider, metadata, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getBookmarks DB error:', error)
      return apiError(res, 'Failed to load bookmarks', 500)
    }

    return apiSuccess(res, bookmarks, 'Bookmarks retrieved')
  } catch (error) {
    console.error('getBookmarks error:', error)
    return apiError(res, 'Failed to load bookmarks', 500)
  }
}

// ─── POST /api/bookmarks ──────────────────────────────────────────────────────

/**
 * Create a new bookmark.
 * Body: { type, title, url?, channel?, provider?, metadata? }
 */
export async function createBookmark(req, res) {
  const parseResult = createBookmarkSchema.safeParse(req.body)

  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { type, title, url, channel, provider, metadata } = parseResult.data

  try {
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: req.user.id,
        type,
        title,
        url: url || null,
        channel: channel || null,
        provider: provider || null,
        metadata: metadata || {},
      })
      .select('id, type, title, url, channel, provider, metadata, created_at')
      .single()

    if (error) {
      console.error('createBookmark DB error:', error)
      return apiError(res, 'Failed to save bookmark', 500)
    }

    return apiSuccess(res, bookmark, 'Bookmark added', 201)
  } catch (error) {
    console.error('createBookmark error:', error)
    return apiError(res, 'Failed to save bookmark', 500)
  }
}

// ─── DELETE /api/bookmarks/:id ────────────────────────────────────────────────

/**
 * Remove a bookmark by ID.
 * Ownership is enforced via user_id in the WHERE clause.
 */
export async function deleteBookmark(req, res) {
  const { id } = req.params

  if (!id) {
    return apiError(res, 'Bookmark ID is required', 400)
  }

  try {
    const { error, count } = await supabase
      .from('bookmarks')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      console.error('deleteBookmark DB error:', error)
      return apiError(res, 'Failed to remove bookmark', 500)
    }

    if (count === 0) {
      return apiError(res, 'Bookmark not found', 404)
    }

    return apiSuccess(res, null, 'Bookmark removed')
  } catch (error) {
    console.error('deleteBookmark error:', error)
    return apiError(res, 'Failed to remove bookmark', 500)
  }
}
