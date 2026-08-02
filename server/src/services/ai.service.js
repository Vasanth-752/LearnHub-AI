/**
 * AI Service — LearnHub AI
 *
 * Handles all Gemini AI interactions with structured output validation.
 * Uses Zod schemas to validate AI responses before returning.
 */

import { geminiPro, geminiFlash, generateStructured } from './gemini.js'
import {
  NOTES_SCHEMA,
  ROADMAP_SCHEMA,
  CERT_SCHEMA,
  notesPrompt,
  roadmapPrompt,
  certificationsPrompt,
} from './prompts.js'
import { RECAP_SCHEMA, recapPrompt } from '../prompts/recap.prompt.js'

/**
 * Generate study notes for a topic
 * @param {string} topic - The topic to generate notes for
 * @returns {Promise<string>} Markdown content
 */
export async function generateNotes(topic) {
  const prompt = notesPrompt(topic)
  const result = await generateStructured(geminiPro, prompt, NOTES_SCHEMA)
  return result.content
}

/**
 * Generate 3-tier learning roadmap for a topic
 * @param {string} topic - The topic to generate roadmap for
 * @returns {Promise<{sprint: string[], stride: string[], marathon: string[]}>}
 */
export async function generateRoadmap(topic) {
  const prompt = roadmapPrompt(topic)
  const result = await generateStructured(geminiPro, prompt, ROADMAP_SCHEMA)
  return result
}

/**
 * Generate certification recommendations for a topic
 * @param {string} topic - The topic to find certifications for
 * @returns {Promise<Array<{name, provider, cost, difficulty, duration, description, url}>>}
 */
export async function generateCertifications(topic) {
  const prompt = certificationsPrompt(topic)
  const result = await generateStructured(geminiPro, prompt, CERT_SCHEMA)
  return result.certifications
}

/**
 * Generate all AI content for Explore search (parallel execution)
 * @param {string} topic - The search topic
 * @returns {Promise<{notes, roadmap, certifications}>}
 */
export async function generateExploreContent(topic) {
  // Run all three AI generations in parallel
  const [notes, roadmap, certifications] = await Promise.allSettled([
    generateNotes(topic),
    generateRoadmap(topic),
    generateCertifications(topic),
  ])

  return {
    notes: notes.status === 'fulfilled' ? notes.value : null,
    roadmap: roadmap.status === 'fulfilled' ? roadmap.value : null,
    certifications: certifications.status === 'fulfilled' ? certifications.value : null,
    // Track which generations failed
    errors: [
      notes.status === 'rejected' ? notes.reason : null,
      roadmap.status === 'rejected' ? roadmap.reason : null,
      certifications.status === 'rejected' ? certifications.reason : null,
    ].filter(Boolean),
  }
}

/**
 * Generate weekly recap (insight and suggested next steps) using Gemini Flash
 * @param {object} stats - { topics_explored, notes_saved, milestones_completed, streak }
 * @param {object} activityData - { topics: string[], milestones: string[] }
 * @returns {Promise<{insight: string, suggested_next_steps: string[]}>}
 */
export async function generateRecap(stats, activityData) {
  const prompt = recapPrompt(stats, activityData)
  const result = await generateStructured(geminiFlash, prompt, RECAP_SCHEMA)
  return result
}