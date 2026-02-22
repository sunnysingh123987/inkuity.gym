-- ============================================================
-- Migration: Referrals
-- Created: 2026-02-22
-- Description: Adds referrals table to track member referrals
--              with bonus/reward tracking
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. REFERRALS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  referrer_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  referred_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired', 'rewarded')),
  bonus_type VARCHAR(50),
  bonus_value NUMERIC(10,2),
  bonus_applied_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT referrals_one_per_referred UNIQUE (gym_id, referred_member_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_gym
ON public.referrals(gym_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
ON public.referrals(referrer_member_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referred
ON public.referrals(referred_member_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status
ON public.referrals(gym_id, status);

-- ============================================================
-- 2. RLS POLICIES
-- ============================================================

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view referrals" ON public.referrals;
DROP POLICY IF EXISTS "Gym owners can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Gym owners can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Gym owners can delete referrals" ON public.referrals;
DROP POLICY IF EXISTS "Members can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service role full access to referrals" ON public.referrals;

CREATE POLICY "Gym owners can view referrals"
  ON public.referrals FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can update referrals"
  ON public.referrals FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can delete referrals"
  ON public.referrals FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Members can view own referrals"
  ON public.referrals FOR SELECT
  USING (
    referrer_member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
    OR referred_member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to referrals"
  ON public.referrals FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
