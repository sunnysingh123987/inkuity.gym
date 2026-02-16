-- ============================================================
-- Migration: Add Supabase Auth to Members
-- Created: 2026-02-15
-- Description: Links members to Supabase Auth users
--              Removes magic link tokens (no longer needed)
-- ============================================================

-- ============================================================
-- 1. ADD auth_user_id COLUMN TO MEMBERS
-- ============================================================

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_members_auth_user_id
ON public.members(auth_user_id);

-- Create unique index to prevent duplicate auth links
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_auth_user_id_unique
ON public.members(auth_user_id)
WHERE auth_user_id IS NOT NULL;

-- ============================================================
-- 2. DROP MAGIC LINK TOKENS TABLE (No longer needed)
-- ============================================================

DROP TABLE IF EXISTS public.member_portal_tokens CASCADE;

-- ============================================================
-- 3. UPDATE RLS POLICIES FOR MEMBERS
-- ============================================================

-- Allow authenticated users to view their own member profile
DROP POLICY IF EXISTS "Members can view own profile" ON public.members;
CREATE POLICY "Members can view own profile"
ON public.members FOR SELECT
USING (auth_user_id = auth.uid());

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Members can update own profile" ON public.members;
CREATE POLICY "Members can update own profile"
ON public.members FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- ============================================================
-- 4. UPDATE RLS POLICIES FOR WORKOUT/DIET DATA
-- ============================================================

-- Workout Routines - Members can manage their own
DROP POLICY IF EXISTS "Members can view own routines" ON public.workout_routines;
CREATE POLICY "Members can view own routines"
ON public.workout_routines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = workout_routines.member_id
    AND members.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can manage own routines" ON public.workout_routines;
CREATE POLICY "Members can manage own routines"
ON public.workout_routines FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = workout_routines.member_id
    AND members.auth_user_id = auth.uid()
  )
);

-- Workout Sessions - Members can manage their own
DROP POLICY IF EXISTS "Members can view own sessions" ON public.workout_sessions;
CREATE POLICY "Members can view own sessions"
ON public.workout_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = workout_sessions.member_id
    AND members.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can manage own sessions" ON public.workout_sessions;
CREATE POLICY "Members can manage own sessions"
ON public.workout_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = workout_sessions.member_id
    AND members.auth_user_id = auth.uid()
  )
);

-- Diet Plans - Members can manage their own
DROP POLICY IF EXISTS "Members can view own diet plans" ON public.diet_plans;
CREATE POLICY "Members can view own diet plans"
ON public.diet_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = diet_plans.member_id
    AND members.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can manage own diet plans" ON public.diet_plans;
CREATE POLICY "Members can manage own diet plans"
ON public.diet_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = diet_plans.member_id
    AND members.auth_user_id = auth.uid()
  )
);

-- Exercise Library - Members can view their gym's exercises
DROP POLICY IF EXISTS "Members can view gym exercises" ON public.exercise_library;
CREATE POLICY "Members can view gym exercises"
ON public.exercise_library FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.gym_id = exercise_library.gym_id
    AND members.auth_user_id = auth.uid()
  )
);

-- ============================================================
-- 5. VERIFICATION
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth Migration Completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Changes:';
    RAISE NOTICE '  - Added auth_user_id to members table';
    RAISE NOTICE '  - Dropped member_portal_tokens table';
    RAISE NOTICE '  - Updated RLS policies for auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE 'Members can now sign in with:';
    RAISE NOTICE '  - Google OAuth';
    RAISE NOTICE '  - Email/Password';
    RAISE NOTICE '========================================';
END $$;
