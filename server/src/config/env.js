import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  // Gemini AI
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL_PRO: z.string().default('gemini-1.5-pro'),
  GEMINI_MODEL_FLASH: z.string().default('gemini-1.5-flash'),

  // YouTube API
  YOUTUBE_API_KEY: z.string().min(1),

  // Frontend URL (for CORS)
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
})

const parseResult = envSchema.safeParse(process.env)

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parseResult.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parseResult.data