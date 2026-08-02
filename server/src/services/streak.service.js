/**
 * Streak Service — LearnHub AI v2.0 Engagement
 *
 * Handles daily activity logging and streak calculation.
 * Uses Supabase RPC to call the log_user_activity() PostgreSQL function,
 * which atomically updates the streak_log and profiles tables in one call.
 *
 * Design notes:
 * - Calling logActivity() multiple times on the same day is safe (idempotent).
 *   The DB function increments activity_count but only changes streak once/day.
 * - Failures are non-fatal — streak errors must never break the main request.
 */

import { supabase } from './supabase.js'

/**
 * Log a user activity event and recalculate their streak.
 * This should be called whenever a user performs a meaningful action:
 *   - Searches a topic
 *   - Saves a note
 *   - Toggles a milestone
 *
 * @param {string} userId - The Supabase user UUID
 * @returns {Promise<{current_streak: number, longest_streak: number, date: string} | null>}
 */
export async function logActivity(userId) {
  if (!userId) return null

  try {
    const { data, error } = await supabase.rpc('log_user_activity', {
      p_user_id: userId,
    })

    if (error) {
      console.error('[streak] Failed to log activity:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('[streak] Unexpected error logging activity:', err)
    return null
  }
}

/**
 * Fetch streak data and last 90 days heatmap for a user.
 * Returns calendar data suitable for the GitHub-style heatmap component.
 *
 * @param {string} userId - The Supabase user UUID
 * @returns {Promise<{current_streak, longest_streak, calendar: Array, heatmap: Array}>}
 */
export async function getStreakData(userId) {
  if (!userId) return null

  try {
    // Fetch profile streak stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_active_date')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[streak] Failed to fetch profile:', profileError.message)
      return null
    }

    // Fetch last 90 days of activity
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
    const startDate = ninetyDaysAgo.toISOString().split('T')[0]

    const { data: logs, error: logsError } = await supabase
      .from('streak_log')
      .select('date, activity_count')
      .eq('user_id', userId)
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (logsError) {
      console.error('[streak] Failed to fetch streak log:', logsError.message)
      return null
    }

    // Build a date-indexed map for O(1) lookups
    const activityMap = {}
    logs.forEach(log => {
      activityMap[log.date] = log.activity_count
    })

    // Generate 90 consecutive days of calendar data
    const heatmap = []
    for (let i = 89; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      heatmap.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
        active: !!activityMap[dateStr],
      })
    }

    // Build a 7-day rolling calendar for the StreakCalendar component
    // (last 35 days = 5 weeks, grouped by day-of-week for the grid layout)
    const calendar = heatmap.slice(-35)

    return {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      last_active_date: profile.last_active_date,
      calendar,
      heatmap,
    }
  } catch (err) {
    console.error('[streak] Unexpected error fetching streak data:', err)
    return null
  }
}
