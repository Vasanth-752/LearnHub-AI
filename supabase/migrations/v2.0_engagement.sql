/**
 * LearnHub AI — Supabase Database Migration for v2.0 Engagement
 *
 * Run this in Supabase SQL Editor AFTER v1.5_persistence.sql.
 *
 * Changes:
 * 1. bookmarks  — save videos, certifications, and notes for quick access
 * 2. streak_log — daily activity tracking for streak calculation
 * 3. profiles   — add streak fields (current_streak, longest_streak, last_active_date)
 */

-- ─── Bookmarks Table ──────────────────────────────────────────────────────────
-- Stores bookmarked items from Explore (videos, certs) and Vault (notes).
-- "type" distinguishes the kind so the UI can filter and render appropriately.
-- "metadata" is a JSONB field for type-specific extras (e.g. thumbnail, provider).

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('videos', 'certifications', 'notes')),
  title       TEXT NOT NULL,
  url         TEXT,
  channel     TEXT,
  provider    TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id    ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_type       ON public.bookmarks(user_id, type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);

-- ─── Streak Log Table ─────────────────────────────────────────────────────────
-- Records one row per calendar day per user when they perform any activity.
-- activity_count tracks how many actions happened that day (for heatmap intensity).
-- The UNIQUE constraint on (user_id, date) prevents duplicate day entries.

CREATE TABLE IF NOT EXISTS public.streak_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  activity_count INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one row per user per day
ALTER TABLE public.streak_log
  ADD CONSTRAINT streak_log_user_date_unique UNIQUE (user_id, date);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_streak_log_user_id ON public.streak_log(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_log_date    ON public.streak_log(user_id, date DESC);

-- ─── Profiles — Streak Fields ─────────────────────────────────────────────────
-- Add streak-related columns to the existing profiles table.
-- last_active_date is used for streak continuity calculation.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.bookmarks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_log  ENABLE ROW LEVEL SECURITY;

-- ─── Bookmarks Policies ───────────────────────────────────────────────────────

CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Streak Log Policies ──────────────────────────────────────────────────────

CREATE POLICY "Users can view own streak log"
  ON public.streak_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak log"
  ON public.streak_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak log"
  ON public.streak_log FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── Streak Update Function ───────────────────────────────────────────────────
-- Called server-side to log activity and recalculate the user's streak.
-- Uses UPSERT to handle multiple activities on the same day gracefully.
-- Called from streak.service.js via RPC.

CREATE OR REPLACE FUNCTION public.log_user_activity(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_last_active DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Upsert today's streak log entry (increment count if exists)
  INSERT INTO public.streak_log (user_id, date, activity_count)
  VALUES (p_user_id, v_today, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET activity_count = streak_log.activity_count + 1;

  -- Get current profile streak data
  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_active, v_current_streak, v_longest_streak
  FROM public.profiles
  WHERE id = p_user_id;

  -- Calculate new streak
  IF v_last_active = v_today THEN
    -- Already active today — no change to streak count
    v_new_streak := v_current_streak;
  ELSIF v_last_active = v_yesterday THEN
    -- Consecutive day — extend streak
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken or first activity — reset to 1
    v_new_streak := 1;
  END IF;

  -- Update profile with new streak values
  UPDATE public.profiles
  SET
    last_active_date = v_today,
    current_streak   = v_new_streak,
    longest_streak   = GREATEST(v_longest_streak, v_new_streak),
    updated_at       = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'current_streak', v_new_streak,
    'longest_streak', GREATEST(v_longest_streak, v_new_streak),
    'date', v_today
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Verification Queries ─────────────────────────────────────────────────────

-- Run these to verify setup:
-- SELECT * FROM public.bookmarks LIMIT 5;
-- SELECT * FROM public.streak_log LIMIT 5;
-- SELECT id, current_streak, longest_streak, last_active_date FROM public.profiles LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename IN ('bookmarks', 'streak_log');
