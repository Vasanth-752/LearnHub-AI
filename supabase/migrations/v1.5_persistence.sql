/**
 * LearnHub AI — Supabase Database Migration for v1.5 Persistence
 *
 * Run this in Supabase SQL Editor AFTER v1.0_core_mvp.sql.
 *
 * Tables created:
 * 1. notes     — User-saved AI study notes from Explore
 * 2. roadmaps  — User-saved learning roadmaps (one tier per roadmap)
 * 3. milestones — Individual steps within a roadmap (with completion state)
 *
 * RLS Policies:
 * - All tables: users can only read/write/delete their own data
 * - Service role bypasses RLS automatically (service_role key used by server)
 */

-- ─── Notes Table ──────────────────────────────────────────────────────────────
-- Stores AI-generated study notes saved from the Explore page.

CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  content     TEXT NOT NULL,
  pinned      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id    ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned     ON public.notes(user_id, pinned);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- ─── Roadmaps Table ───────────────────────────────────────────────────────────
-- Stores saved learning pathways. Each roadmap corresponds to one tier
-- (sprint, stride, or marathon) of a 3-tier roadmap from Explore.

CREATE TABLE IF NOT EXISTS public.roadmaps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  tier        TEXT NOT NULL CHECK (tier IN ('sprint', 'stride', 'marathon')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id    ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_created_at ON public.roadmaps(created_at DESC);

-- ─── Milestones Table ─────────────────────────────────────────────────────────
-- Stores individual milestone steps for a roadmap.
-- order_index preserves the original ordering from the AI response.

CREATE TABLE IF NOT EXISTS public.milestones (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id   UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  completed    BOOLEAN NOT NULL DEFAULT false,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_roadmap_id   ON public.milestones(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_milestones_order        ON public.milestones(roadmap_id, order_index);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- ─── Notes Policies ───────────────────────────────────────────────────────────

CREATE POLICY "Users can view own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Roadmaps Policies ────────────────────────────────────────────────────────

CREATE POLICY "Users can view own roadmaps"
  ON public.roadmaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps"
  ON public.roadmaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps"
  ON public.roadmaps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roadmaps"
  ON public.roadmaps FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Milestones Policies ──────────────────────────────────────────────────────
-- Milestones are accessed via their parent roadmap's user_id for security.

CREATE POLICY "Users can view milestones of own roadmaps"
  ON public.milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = milestones.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert milestones into own roadmaps"
  ON public.milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = milestones.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones of own roadmaps"
  ON public.milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = milestones.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones of own roadmaps"
  ON public.milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = milestones.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

-- ─── updated_at Triggers ──────────────────────────────────────────────────────
-- Reuses the handle_updated_at() function created in v1.0 migration.

DROP TRIGGER IF EXISTS handle_notes_updated_at ON public.notes;
CREATE TRIGGER handle_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_roadmaps_updated_at ON public.roadmaps;
CREATE TRIGGER handle_roadmaps_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_milestones_updated_at ON public.milestones;
CREATE TRIGGER handle_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Verification Queries ─────────────────────────────────────────────────────

-- Run these to verify setup:
-- SELECT * FROM public.notes LIMIT 5;
-- SELECT * FROM public.roadmaps LIMIT 5;
-- SELECT * FROM public.milestones LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename IN ('notes', 'roadmaps', 'milestones');
