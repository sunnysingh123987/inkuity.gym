-- ============================================================
-- Migration: Member Extras
-- Created: 2026-02-22
-- Description: Adds blacklist columns to members, personal
--              records table for PR tracking, and announcements
--              table for gym closures/alerts
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. ADD BLACKLIST COLUMNS TO MEMBERS
-- ============================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMPTZ;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

-- ============================================================
-- 2. PERSONAL RECORDS TABLE - PR Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  exercise_id UUID REFERENCES public.exercise_library(id) ON DELETE SET NULL,
  weight NUMERIC(6,2) NOT NULL,
  reps INTEGER DEFAULT 1,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_records_gym
ON public.personal_records(gym_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_member
ON public.personal_records(member_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_exercise
ON public.personal_records(member_id, exercise_name);

CREATE INDEX IF NOT EXISTS idx_personal_records_recorded
ON public.personal_records(member_id, recorded_at);

-- ============================================================
-- 3. ANNOUNCEMENTS TABLE - Gym alerts / closures
-- ============================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'emergency', 'holiday', 'closure')),
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  notify_members BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_gym
ON public.announcements(gym_id);

CREATE INDEX IF NOT EXISTS idx_announcements_active
ON public.announcements(gym_id, is_active);

CREATE INDEX IF NOT EXISTS idx_announcements_type
ON public.announcements(gym_id, type);

CREATE INDEX IF NOT EXISTS idx_announcements_dates
ON public.announcements(gym_id, starts_at, ends_at);

-- ============================================================
-- 4. RLS POLICIES - PERSONAL RECORDS
-- ============================================================

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Gym owners can insert personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Gym owners can update personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Gym owners can delete personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Members can view own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Members can insert own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Members can update own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Service role full access to personal_records" ON public.personal_records;

CREATE POLICY "Gym owners can view personal records"
  ON public.personal_records FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can insert personal records"
  ON public.personal_records FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can update personal records"
  ON public.personal_records FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can delete personal records"
  ON public.personal_records FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Members can view own personal records"
  ON public.personal_records FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own personal records"
  ON public.personal_records FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own personal records"
  ON public.personal_records FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to personal_records"
  ON public.personal_records FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5. RLS POLICIES - ANNOUNCEMENTS
-- ============================================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Gym owners can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Gym owners can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Gym owners can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Members can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Service role full access to announcements" ON public.announcements;

CREATE POLICY "Gym owners can view announcements"
  ON public.announcements FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can update announcements"
  ON public.announcements FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can delete announcements"
  ON public.announcements FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Members can view active announcements"
  ON public.announcements FOR SELECT
  USING (
    is_active = true
    AND gym_id IN (
      SELECT gym_id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to announcements"
  ON public.announcements FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
