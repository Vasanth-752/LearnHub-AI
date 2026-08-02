/**
 * LearnHub AI — Supabase Database Migration for v2.5 Intelligence
 *
 * Run this in Supabase SQL Editor AFTER v2.0_engagement.sql.
 *
 * Tables created:
 * 1. recaps — Stores AI-generated weekly summaries for users.
 *
 * RLS Policies:
 * - recaps: users can only read/write/delete their own recaps
 */

-- ─── Recaps Table ─────────────────────────────────────────────────────────────
-- Stores weekly AI-generated learning summaries.

CREATE TABLE IF NOT EXISTS public.recaps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  insight         TEXT NOT NULL,
  suggested_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats_snapshot  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recaps_user_id ON public.recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_recaps_created_at ON public.recaps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.recaps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own recaps
CREATE POLICY "Users can view own recaps"
  ON public.recaps FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own recaps
CREATE POLICY "Users can insert own recaps"
  ON public.recaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own recaps
CREATE POLICY "Users can delete own recaps"
  ON public.recaps FOR DELETE
  USING (auth.uid() = user_id);
