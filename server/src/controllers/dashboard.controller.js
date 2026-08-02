/**
 * Dashboard Controller — LearnHub AI v2.0 Engagement
 *
 * Powers the Pulse Dashboard with three separate endpoints:
 *   GET /api/dashboard/stats    — aggregate learning statistics
 *   GET /api/dashboard/streak   — streak data + 90-day heatmap
 *   GET /api/dashboard/progress — per-roadmap progress data for bar chart
 *
 * All routes require authentication.
 * Uses Promise.allSettled where possible to prevent partial failures from
 * breaking the entire dashboard load.
 */

import { supabase } from '../services/supabase.js'
import { getStreakData } from '../services/streak.service.js'
import { apiSuccess, apiError } from '../utils/response.js'

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────

/**
 * Aggregate learning stats:
 *   - notes_count:      total saved notes
 *   - active_pathways:  roadmaps with progress < 100%
 *   - topics_explored:  distinct search count
 *   - completion_rate:  avg progress across all roadmaps
 */
export async function getDashboardStats(req, res) {
  const userId = req.user.id

  try {
    const [notesResult, roadmapsResult, searchesResult] = await Promise.allSettled([
      // Count saved notes
      supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Fetch all roadmaps with milestones for progress calculation
      supabase
        .from('roadmaps')
        .select('id, milestones(completed)')
        .eq('user_id', userId),

      // Count distinct searches (topics explored)
      supabase
        .from('searches')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    // Notes count
    const notes_count = notesResult.status === 'fulfilled'
      ? (notesResult.value.count || 0)
      : 0

    // Topics explored
    const topics_explored = searchesResult.status === 'fulfilled'
      ? (searchesResult.value.count || 0)
      : 0

    // Roadmap stats
    let active_pathways = 0
    let completion_rate = 0

    if (roadmapsResult.status === 'fulfilled' && roadmapsResult.value.data) {
      const roadmaps = roadmapsResult.value.data

      const roadmapProgress = roadmaps.map(rm => {
        const total = rm.milestones.length
        if (total === 0) return 0
        const completed = rm.milestones.filter(m => m.completed).length
        return Math.round((completed / total) * 100)
      })

      active_pathways = roadmapProgress.filter(p => p < 100).length

      if (roadmapProgress.length > 0) {
        completion_rate = Math.round(
          roadmapProgress.reduce((sum, p) => sum + p, 0) / roadmapProgress.length
        )
      }
    }

    return apiSuccess(res, {
      notes_count,
      active_pathways,
      topics_explored,
      completion_rate,
    }, 'Stats retrieved')

  } catch (error) {
    console.error('getDashboardStats error:', error)
    return apiError(res, 'Failed to load dashboard stats', 500)
  }
}

// ─── GET /api/dashboard/streak ────────────────────────────────────────────────

/**
 * Streak and activity data:
 *   - current_streak: consecutive days of activity
 *   - longest_streak: all-time best streak
 *   - calendar: last 35 days grouped for the weekly calendar widget
 *   - heatmap:  last 90 days for the contribution heatmap
 */
export async function getDashboardStreak(req, res) {
  try {
    const streakData = await getStreakData(req.user.id)

    if (!streakData) {
      // Return zero-state data so the dashboard renders empty instead of erroring
      return apiSuccess(res, {
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        calendar: [],
        heatmap: [],
      }, 'Streak data retrieved')
    }

    return apiSuccess(res, streakData, 'Streak data retrieved')

  } catch (error) {
    console.error('getDashboardStreak error:', error)
    return apiError(res, 'Failed to load streak data', 500)
  }
}

// ─── GET /api/dashboard/progress ─────────────────────────────────────────────

/**
 * Per-roadmap progress data for the Recharts bar chart.
 * Returns roadmaps with their progress percentage and milestone counts.
 */
export async function getDashboardProgress(req, res) {
  try {
    const { data: roadmaps, error } = await supabase
      .from('roadmaps')
      .select(`
        id,
        topic,
        tier,
        milestones(completed)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10) // Cap at 10 for chart readability

    if (error) {
      console.error('getDashboardProgress DB error:', error)
      return apiError(res, 'Failed to load progress data', 500)
    }

    const progressData = roadmaps.map(rm => {
      const total = rm.milestones.length
      const completed = rm.milestones.filter(m => m.completed).length
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0
      return {
        id: rm.id,
        topic: rm.topic.length > 20 ? rm.topic.substring(0, 20) + '…' : rm.topic,
        tier: rm.tier,
        progress,
        completed,
        total,
      }
    })

    return apiSuccess(res, { roadmaps: progressData }, 'Progress data retrieved')

  } catch (error) {
    console.error('getDashboardProgress error:', error)
    return apiError(res, 'Failed to load progress data', 500)
  }
}
