/**
 * Recap Controller — LearnHub AI v2.5 Intelligence
 *
 * Handles generating and fetching weekly AI summaries.
 */

import { supabase } from '../services/supabase.js'
import { generateRecap as generateAiRecap } from '../services/ai.service.js'
import { apiSuccess, apiError } from '../utils/response.js'

/**
 * Helper to calculate start and end dates for the 7-day window.
 */
function getWindowDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 7)
  return { start: start.toISOString(), end: end.toISOString() }
}

// ─── POST /api/recap/generate ──────────────────────────────────────────────────

export async function generateRecap(req, res) {
  const userId = req.user.id
  const { start, end } = getWindowDates()

  try {
    // 1. Check if a recap was already generated in the last 7 days (unless forced)
    // Actually, the client decides when to call this. We just generate it.

    // 2. Fetch all required user activity for the past 7 days concurrently
    const [searchesRes, notesRes, milestonesRes, profileRes] = await Promise.allSettled([
      // Searches
      supabase
        .from('searches')
        .select('query')
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end),

      // Notes
      supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end),

      // Milestones
      supabase
        .from('milestones')
        .select('title')
        .eq('completed', true)
        // Note: milestones table doesn't track *when* it was completed accurately right now
        // if we just added it, or we rely on the fact that if it's completed, they worked on it.
        // Wait, milestones table doesn't have an updated_at column?
        // Let's just fetch all completed milestones for now, or just the roadmap progress?
        // Actually, since we don't have updated_at on milestones, we'll just pull roadmaps
        // created in the last 7 days or rely on the general completed count.
        // Since we want recent activity, let's just grab the topics of roadmaps created recently.
        // Actually, we can join roadmaps to get the topic. Let's do that simply.
    ])

    // Wait, let's refine the milestones query. We don't have a reliable updated_at on milestones.
    // Let's fetch roadmaps updated recently instead.
    const { data: recentRoadmaps } = await supabase
      .from('roadmaps')
      .select('topic, milestones(title, completed)')
      .eq('user_id', userId)
      .gte('created_at', start) // approximate recent activity

    // Construct Stats
    const searches = searchesRes.status === 'fulfilled' && searchesRes.value.data ? searchesRes.value.data : []
    const notesCount = notesRes.status === 'fulfilled' ? (notesRes.value.count || 0) : 0
    
    // Calculate milestones completed recently (approximate based on recent roadmaps)
    let completedMilestonesCount = 0
    let milestoneTitles = []
    
    if (recentRoadmaps) {
      recentRoadmaps.forEach(rm => {
        rm.milestones.forEach(m => {
          if (m.completed) {
            completedMilestonesCount++
            milestoneTitles.push(`${rm.topic} - ${m.title}`)
          }
        })
      })
    }

    // Fetch Profile for Streak
    let currentStreak = 0
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak')
      .eq('id', userId)
      .single()
    if (profile) currentStreak = profile.current_streak

    const stats = {
      topics_explored: searches.length,
      notes_saved: notesCount,
      milestones_completed: completedMilestonesCount,
      streak: currentStreak
    }

    // Extract unique topics from searches
    const uniqueTopics = [...new Set(searches.map(s => s.query))].slice(0, 10) // cap at 10

    const activityData = {
      topics: uniqueTopics,
      milestones: milestoneTitles.slice(0, 10) // cap at 10
    }

    // 3. Call AI Service to generate Recap
    const recapResult = await generateAiRecap(stats, activityData)

    // 4. Save to DB
    const { data: savedRecap, error: saveError } = await supabase
      .from('recaps')
      .insert({
        user_id: userId,
        start_date: start,
        end_date: end,
        insight: recapResult.insight,
        suggested_steps: recapResult.suggested_next_steps,
        stats_snapshot: stats,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save recap:', saveError)
      return apiError(res, 'Failed to save generated recap', 500)
    }

    return apiSuccess(res, savedRecap, 'Recap generated successfully', 201)

  } catch (error) {
    console.error('generateRecap error:', error)
    return apiError(res, 'Failed to generate recap', 500)
  }
}

// ─── GET /api/recap ────────────────────────────────────────────────────────────

export async function getRecaps(req, res) {
  const userId = req.user.id

  try {
    const { data: recaps, error } = await supabase
      .from('recaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getRecaps error:', error)
      return apiError(res, 'Failed to fetch recaps', 500)
    }

    return apiSuccess(res, recaps, 'Recaps retrieved')
  } catch (error) {
    console.error('getRecaps exception:', error)
    return apiError(res, 'Failed to fetch recaps', 500)
  }
}
