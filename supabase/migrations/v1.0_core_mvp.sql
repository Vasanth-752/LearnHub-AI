/**
 * LearnHub AI — Supabase Database Migration for v1.0 Core MVP
 *
 * Run this in Supabase SQL Editor to create the required tables and RLS policies.
 *
 * Tables created:
 * 1. profiles — User profile data (synced from Supabase Auth)
 * 2. searches — Search history for authenticated users
 *
 * RLS Policies:
 * - profiles: Users can only read/update their own profile
 * - searches: Users can only read/insert their own searches
 */

-- ─── Enable UUID extension ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ─── Searches Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON public.searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON public.searches(created_at DESC);

-- ─── Row Level Security ────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;

-- ─── Profiles Policies ────────────────────────────────────────────────────────

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (used during registration/sync)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do everything (for server-side operations with service_role key)
-- Note: When using the service_role key, RLS is bypassed automatically.
-- These policies are for completeness and documentation.
CREATE POLICY "Service role full access to profiles"
  ON public.profiles
  FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- ─── Searches Policies ────────────────────────────────────────────────────────

-- Users can view their own searches
CREATE POLICY "Users can view own searches"
  ON public.searches
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own searches
CREATE POLICY "Users can insert own searches"
  ON public.searches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for server-side operations with service_role key)
CREATE POLICY "Service role full access to searches"
  ON public.searches
  FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- ─── Helper Functions ──────────────────────────────────────────────────────────

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── Auto-create Profile on Auth Signup ─────────────────────────────────────
-- Automatically inserts a profile row when a new user signs up via any method
-- (email, Google OAuth, GitHub OAuth). This removes the need to manually sync
-- the profile after OAuth callbacks.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires on every new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Verification Queries ──────────────────────────────────────────────────────

-- Run these to verify setup:
-- SELECT * FROM public.profiles LIMIT 5;
-- SELECT * FROM public.searches LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'searches');
-- SELECT * FROM information_schema.triggers WHERE event_object_schema = 'auth';