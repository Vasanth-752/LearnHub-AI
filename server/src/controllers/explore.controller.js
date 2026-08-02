/**
 * Explore Controller — LearnHub AI
 *
 * Orchestrates parallel AI content generation + YouTube search.
 * Records search in database for authenticated users.
 */

import { generateExploreContent } from '../services/ai.service.js'
import { searchVideos } from '../services/youtube.js'
import { supabase } from '../services/supabase.js'
import { logActivity } from '../services/streak.service.js'
import { apiSuccess, apiError } from '../utils/response.js'

/**
 * Search endpoint — Main Explore feature
 * GET /api/explore?q=<topic>
 *
 * Runs in parallel:
 * 1. AI Notes generation (Gemini Pro)
 * 2. AI Roadmap generation (Gemini Pro)
 * 3. AI Certifications generation (Gemini Pro)
 * 4. YouTube video search (YouTube Data API v3)
 *
 * Records search in database if user is authenticated
 */
export async function exploreSearch(req, res) {
  const query = req.query.q?.trim()

  if (!query) {
    return apiError(res, 'Search query is required', 400)
  }

  if (query.length > 200) {
    return apiError(res, 'Search query too long (max 200 characters)', 400)
  }

  try {
    // Run AI content generation and YouTube search in parallel
    const [aiContent, videos] = await Promise.allSettled([
      generateExploreContent(query),
      searchVideos(query, 8),
    ])

    // Process AI results
    let notes = null
    let roadmap = null
    let certifications = null
    let aiErrors = []

    if (aiContent.status === 'fulfilled') {
      notes = aiContent.value.notes
      roadmap = aiContent.value.roadmap
      certifications = aiContent.value.certifications
      aiErrors = aiContent.value.errors
    } else {
      console.error('AI content generation failed:', aiContent.reason)
      aiErrors.push('AI content generation failed')
    }

    // Process YouTube results
    let videoResults = []
    if (videos.status === 'fulfilled') {
      videoResults = videos.value
    } else {
      console.error('YouTube search failed:', videos.reason)
    }

    // Record search in database if authenticated
    if (req.user?.id) {
      try {
        await supabase
          .from('searches')
          .insert({
            user_id: req.user.id,
            query,
            results_count: {
              notes: notes ? 1 : 0,
              videos: videoResults.length,
              certifications: certifications?.length || 0,
              roadmap: roadmap ? Object.values(roadmap).flat().length : 0,
            },
            created_at: new Date().toISOString(),
          })
        // Log activity for streak tracking (non-fatal)
        logActivity(req.user.id).catch(() => {})
      } catch (dbError) {
        // Don't fail the request if search logging fails
        console.error('Failed to record search:', dbError)
      }
    }

    // Build response
    const responseData = {
      query,
      notes,
      videos: videoResults,
      certifications,
      pathway: roadmap,
      meta: {
        aiErrors: aiErrors.length > 0 ? aiErrors : undefined,
        timestamp: new Date().toISOString(),
      },
    }

    // Check if all content failed
    const hasAnyContent = notes || videoResults.length > 0 || certifications?.length || roadmap

    if (!hasAnyContent) {
      return apiError(res, 'No results found. Please try a different search term.', 404)
    }

    return apiSuccess(res, responseData, 'Search completed')

  } catch (error) {
    console.error('Explore search error:', error)
    return apiError(res, 'Search failed. Please try again.', 500)
  }
}