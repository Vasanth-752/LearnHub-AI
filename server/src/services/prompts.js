/**
 * AI Prompt Templates for LearnHub AI Explore Feature
 *
 * These templates are designed for Gemini 3.6 Pro with structured JSON output.
 * Each template returns a Zod schema for validation.
 */

import { z } from 'zod'

/**
 * Notes Prompt — Generates comprehensive study notes in Markdown
 */
export const NOTES_SCHEMA = z.object({
  content: z.string().min(100, 'Notes must be substantial'),
})

export const notesPrompt = (topic) => `
You are an expert educator creating comprehensive study notes for "${topic}".

Generate detailed, well-structured study notes in Markdown format covering:
1. **Introduction** — What is ${topic}? Why is it important?
2. **Core Concepts** — Key definitions, principles, and terminology
3. **Fundamental Principles** — How it works, underlying theory
4. **Practical Applications** — Real-world use cases and examples
5. **Best Practices** — Tips, common pitfalls, and pro tips
6. **Further Learning** — What to explore next

Requirements:
- Use proper Markdown: headings (##, ###), bullet points, code blocks, bold/italic
- Include practical code snippets or examples where relevant
- Make it comprehensive but digestible (aim for 800-1500 words)
- Use clear, engaging educational tone
- Structure with logical flow from basics to advanced

Return ONLY the Markdown content as a JSON string in the "content" field.
`

/**
 * Roadmap Prompt — Generates 3-tier learning roadmap (Sprint, Stride, Marathon)
 */
export const ROADMAP_SCHEMA = z.object({
  sprint: z.array(z.string().min(5)).min(3).max(8),
  stride: z.array(z.string().min(5)).min(5).max(12),
  marathon: z.array(z.string().min(5)).min(8).max(20),
})

export const roadmapPrompt = (topic) => `
You are a learning architect designing a 3-tier roadmap for "${topic}".

Create a progressive learning path with THREE distinct tiers:

**SPRINT (1-2 weeks)** — Quick wins, fundamentals, "get started fast"
- 3-8 concrete, actionable milestones
- Focus: Core basics, environment setup, first project

**STRIDE (1-2 months)** — Intermediate depth, practical skills
- 5-12 milestones building on Sprint
- Focus: Real projects, core patterns, common tools

**MARATHON (3-6 months)** — Mastery, advanced topics, specialization
- 8-20 milestones building on Stride
- Focus: Deep expertise, architecture, advanced patterns, portfolio projects

Requirements:
- Each milestone must be a clear, actionable learning objective (not vague topics)
- Use imperative language: "Build a...", "Implement...", "Understand..."
- Progressive difficulty: each tier assumes completion of previous
- Specific to "${topic}" — not generic advice
- Total milestones across all tiers: 16-40

Return JSON with three arrays: "sprint", "stride", "marathon"
`

/**
 * Certifications Prompt — Generates relevant certification suggestions
 */
export const CERT_SCHEMA = z.object({
  certifications: z.array(z.object({
    name: z.string().min(3),
    provider: z.string().min(2),
    cost: z.enum(['Free', 'Paid', 'Freemium']),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    duration: z.string().optional(), // e.g., "20 hours", "3 months"
    description: z.string().min(20),
    url: z.string().url().optional(),
  })).min(3).max(10),
})

export const certificationsPrompt = (topic) => `
You are a career advisor recommending certifications for "${topic}".

Find 5-8 REAL, CURRENTLY AVAILABLE certifications relevant to "${topic}".

For each certification, provide:
- **name**: Exact certification name (e.g., "AWS Certified Solutions Architect - Associate")
- **provider**: Organization offering it (e.g., "Amazon Web Services", "Google Cloud", "Microsoft", "CompTIA", "(ISC)²")
- **cost**: "Free" | "Paid" | "Freemium" (free tier + paid cert)
- **difficulty**: "Beginner" | "Intermediate" | "Advanced"
- **duration**: Estimated prep time (e.g., "40 hours", "2-3 months")
- **description**: 2-3 sentences on what it covers and career value
- **url**: Official certification page URL (must be valid, real URL)

Requirements:
- ONLY real certifications that exist as of 2024
- Mix of free and paid options
- Range of difficulty levels
- Relevant to "${topic}" specifically
- Prioritize well-known, industry-recognized certifications
- If topic has few certs, include adjacent/related ones

Return JSON with "certifications" array.
`

/**
 * YouTube Search Prompt — Not needed (uses YouTube Data API directly)
 * But we can enhance video results with AI categorization if needed
 */
export const videoEnhancementPrompt = (topic, videos) => `
You are a learning curator. Given the topic "${topic}" and these YouTube videos:
${JSON.stringify(videos, null, 2)}

Select the BEST 8 videos for learning and enhance each with:
- **difficulty**: "Beginner" | "Intermediate" | "Advanced"
- **category**: "Tutorial" | "Deep Dive" | "Project" | "Concept" | "Review"
- **whyRecommended**: 1 sentence on why this video is good for learning ${topic}

Return JSON array of enhanced videos.
`