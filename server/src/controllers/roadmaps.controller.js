/**
 * Roadmaps Controller — LearnHub AI v1.5 Persistence
 *
 * Handles CRUD for saved learning roadmaps and milestone completion toggling.
 * All routes require authentication — req.user is set by authenticate middleware.
 *
 * Routes:
 *   GET    /api/roadmaps                                — list all roadmaps with milestones
 *   POST   /api/roadmaps                               — save a roadmap + its milestones
 *   DELETE /api/roadmaps/:id                           — delete a roadmap (cascades milestones)
 *   PATCH  /api/roadmaps/:roadmapId/milestones/:id     — toggle milestone completion
 */

import { supabase } from '../services/supabase.js'
import { apiSuccess, apiError } from '../utils/response.js'
import { logActivity } from '../services/streak.service.js'
import { z } from 'zod'

// ─── Validation Schemas ───────────────────────────────────────────────────────

const milestoneInputSchema = z.string().min(1, 'Milestone title required')

const createRoadmapSchema = z.object({
  topic:      z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
  tier:       z.enum(['sprint', 'stride', 'marathon'], {
    errorMap: () => ({ message: 'Tier must be sprint, stride, or marathon' }),
  }),
  milestones: z.array(milestoneInputSchema).min(1, 'At least one milestone required').max(30),
})

const toggleMilestoneSchema = z.object({
  completed: z.boolean(),
})

// ─── GET /api/roadmaps ────────────────────────────────────────────────────────

/**
 * List all roadmaps for the authenticated user with their milestones.
 * Returns newest roadmaps first. Milestones ordered by order_index.
 */
export async function getRoadmaps(req, res) {
  try {
    const { data: roadmaps, error } = await supabase
      .from('roadmaps')
      .select(`
        id,
        topic,
        tier,
        created_at,
        updated_at,
        milestones (
          id,
          title,
          description,
          completed,
          order_index
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .order('order_index', { referencedTable: 'milestones', ascending: true })

    if (error) {
      console.error('getRoadmaps DB error:', error)
      return apiError(res, 'Failed to load roadmaps', 500)
    }

    // Calculate progress for each roadmap
    const roadmapsWithProgress = roadmaps.map(roadmap => {
      const total = roadmap.milestones.length
      const completed = roadmap.milestones.filter(m => m.completed).length
      return {
        ...roadmap,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })

    return apiSuccess(res, roadmapsWithProgress, 'Roadmaps retrieved')
  } catch (error) {
    console.error('getRoadmaps error:', error)
    return apiError(res, 'Failed to load roadmaps', 500)
  }
}

// ─── POST /api/roadmaps ───────────────────────────────────────────────────────

/**
 * Save a new roadmap with its milestones.
 * Body: { topic, tier, milestones: string[] }
 *
 * Uses two sequential inserts:
 * 1. Insert the roadmap row
 * 2. Bulk insert all milestone rows with order_index preserved
 */
export async function createRoadmap(req, res) {
  const parseResult = createRoadmapSchema.safeParse(req.body)

  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { topic, tier, milestones: milestoneStrings } = parseResult.data

  try {
    // 1. Create the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert({
        user_id: req.user.id,
        topic,
        tier,
      })
      .select('id, topic, tier, created_at, updated_at')
      .single()

    if (roadmapError) {
      console.error('createRoadmap insert error:', roadmapError)
      return apiError(res, 'Failed to save roadmap', 500)
    }

    // 2. Bulk insert milestones with preserved order
    const milestoneRows = milestoneStrings.map((title, index) => ({
      roadmap_id:  roadmap.id,
      title,
      completed:   false,
      order_index: index,
    }))

    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .insert(milestoneRows)
      .select('id, title, description, completed, order_index')

    if (milestonesError) {
      console.error('createRoadmap milestones insert error:', milestonesError)
      // Rollback: delete the roadmap (milestones will cascade)
      await supabase.from('roadmaps').delete().eq('id', roadmap.id)
      return apiError(res, 'Failed to save roadmap milestones', 500)
    }

    return apiSuccess(res, {
      ...roadmap,
      milestones,
      progress: 0,
    }, 'Pathway saved', 201)

  } catch (error) {
    console.error('createRoadmap error:', error)
    return apiError(res, 'Failed to save roadmap', 500)
  }
}

// ─── DELETE /api/roadmaps/:id ─────────────────────────────────────────────────

/**
 * Delete a roadmap (milestones cascade automatically via FK).
 * Ownership is enforced by including user_id in the WHERE clause.
 */
export async function deleteRoadmap(req, res) {
  const { id } = req.params

  if (!id) {
    return apiError(res, 'Roadmap ID is required', 400)
  }

  try {
    const { error, count } = await supabase
      .from('roadmaps')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      console.error('deleteRoadmap DB error:', error)
      return apiError(res, 'Failed to delete roadmap', 500)
    }

    if (count === 0) {
      return apiError(res, 'Roadmap not found', 404)
    }

    return apiSuccess(res, null, 'Roadmap deleted')
  } catch (error) {
    console.error('deleteRoadmap error:', error)
    return apiError(res, 'Failed to delete roadmap', 500)
  }
}

// ─── PATCH /api/roadmaps/:roadmapId/milestones/:id ────────────────────────────

/**
 * Toggle a milestone's completion state.
 * Body: { completed: boolean }
 *
 * Validates ownership by checking the milestone's roadmap belongs to the user.
 * Returns the updated milestone and the new calculated progress % for the roadmap.
 */
export async function toggleMilestone(req, res) {
  const { roadmapId, id: milestoneId } = req.params

  const parseResult = toggleMilestoneSchema.safeParse(req.body)
  if (!parseResult.success) {
    return apiError(res, 'Validation failed', 400, parseResult.error.flatten().fieldErrors)
  }

  const { completed } = parseResult.data

  try {
    // Verify ownership: milestone must belong to a roadmap owned by this user
    const { data: roadmap, error: ownershipError } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('id', roadmapId)
      .eq('user_id', req.user.id)
      .single()

    if (ownershipError || !roadmap) {
      return apiError(res, 'Roadmap not found', 404)
    }

    // Update the milestone
    const { data: milestone, error: updateError } = await supabase
      .from('milestones')
      .update({ completed })
      .eq('id', milestoneId)
      .eq('roadmap_id', roadmapId)
      .select('id, title, completed, order_index')
      .single()

    if (updateError || !milestone) {
      console.error('toggleMilestone update error:', updateError)
      return apiError(res, 'Failed to update milestone', 500)
    }

    // Recalculate overall progress for this roadmap
    const { data: allMilestones, error: fetchError } = await supabase
      .from('milestones')
      .select('completed')
      .eq('roadmap_id', roadmapId)

    let progress = 0
    if (!fetchError && allMilestones.length > 0) {
      const completedCount = allMilestones.filter(m => m.completed).length
      progress = Math.round((completedCount / allMilestones.length) * 100)
    }

    // Log activity when marking a milestone as completed (non-fatal)
    if (completed) {
      logActivity(req.user.id).catch(() => {})
    }

    return apiSuccess(res, { milestone, progress }, 'Milestone updated')
  } catch (error) {
    console.error('toggleMilestone error:', error)
    return apiError(res, 'Failed to update milestone', 500)
  }
}
