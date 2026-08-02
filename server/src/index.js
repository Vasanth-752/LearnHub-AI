/**
 * LearnHub AI — Express Server Entry Point
 * v0.1 Foundation
 *
 * Middleware order (CRITICAL — do not reorder):
 *  1. Helmet (security headers)
 *  2. CORS (must be before any route handling)
 *  3. Morgan (request logging)
 *  4. JSON body parser
 *  5. General rate limiter
 *  6. API routes
 *  7. 404 not-found handler
 *  8. Global error handler (MUST be last)
 */

import './config/env.js' // Crash-fast on missing env vars — import FIRST
import { env } from './config/env.js'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { generalLimiter } from './middleware/rateLimiter.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import apiRoutes from './routes/index.js'

const app = express()

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet())

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.NODE_ENV === 'production'
      ? env.FRONTEND_URL
      : [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── General Rate Limiter (all /api routes) ───────────────────────────────────
app.use('/api', generalLimiter)

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes)

// ─── 404 Catch-all (unmatched routes) ────────────────────────────────────────
app.use(notFoundHandler)

// ─── Global Error Handler (MUST be last) ─────────────────────────────────────
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`\n🚀 LearnHub AI server running`)
  console.log(`   Environment : ${env.NODE_ENV}`)
  console.log(`   Port        : ${env.PORT}`)
  console.log(`   Health      : http://localhost:${env.PORT}/api/health\n`)
})

export default app
