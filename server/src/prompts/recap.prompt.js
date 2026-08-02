import { z } from 'zod'

/**
 * Recap Prompt — Generates a personalized weekly learning summary
 * Uses Gemini 3.6 Flash structured output
 */
export const RECAP_SCHEMA = z.object({
  insight: z.string().min(20).describe('1-3 sentences of personalized feedback based on the week\'s activity.'),
  suggested_next_steps: z.array(z.string()).min(1).max(3).describe('Specific, actionable next steps based on the user\'s progress.'),
})

export const recapPrompt = (stats, activityData) => `
You are an expert learning coach analyzing a student's activity over the past 7 days.

Weekly Statistics:
- Topics Explored: ${stats.topics_explored}
- Notes Saved: ${stats.notes_saved}
- Milestones Completed: ${stats.milestones_completed}
- Current Streak: ${stats.streak} days

Recent Activity Details:
- Topics: ${activityData.topics.join(', ') || 'None'}
- Milestones: ${activityData.milestones.join(', ') || 'None'}

Based on this data, provide a personalized weekly recap.
1. "insight": Write an encouraging 1-3 sentence summary. Acknowledge their streak, praise specific topics or milestones they completed, and offer a motivational thought. If they had zero activity, gently encourage them to start exploring.
2. "suggested_next_steps": Provide 2-3 specific, actionable next steps. Base these on what they just learned. Use imperative language (e.g., "Build a small project using React").

Return ONLY valid JSON matching the schema.
`
