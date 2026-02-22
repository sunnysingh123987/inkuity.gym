-- ============================================================
-- Migration: Reviews & Feedback
-- Created: 2026-02-22
-- Description: Adds gym_reviews and feedback_requests tables
--              for member reviews and targeted feedback collection
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. GYM REVIEWS - Member reviews of gym
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gym_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT gym_reviews_one_per_member UNIQUE (gym_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_reviews_gym
ON public.gym_reviews(gym_id);

CREATE INDEX IF NOT EXISTS idx_gym_reviews_member
ON public.gym_reviews(member_id);

CREATE INDEX IF NOT EXISTS idx_gym_reviews_rating
ON public.gym_reviews(gym_id, rating);

-- ============================================================
-- 2. FEEDBACK REQUESTS - Targeted feedback from inactive members
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  response_text TEXT,
  response_rating INTEGER CHECK (response_rating >= 1 AND response_rating <= 5),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'responded', 'expired')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_gym
ON public.feedback_requests(gym_id);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_member
ON public.feedback_requests(member_id);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_status
ON public.feedback_requests(gym_id, status);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

-- gym_reviews
ALTER TABLE public.gym_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view reviews" ON public.gym_reviews;
DROP POLICY IF EXISTS "Gym owners can manage reviews" ON public.gym_reviews;
DROP POLICY IF EXISTS "Members can create own review" ON public.gym_reviews;
DROP POLICY IF EXISTS "Members can update own review" ON public.gym_reviews;
DROP POLICY IF EXISTS "Members can view public reviews" ON public.gym_reviews;
DROP POLICY IF EXISTS "Service role full access to gym_reviews" ON public.gym_reviews;

CREATE POLICY "Gym owners can view reviews"
  ON public.gym_reviews FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can manage reviews"
  ON public.gym_reviews FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Members can create own review"
  ON public.gym_reviews FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members
      WHERE id = gym_reviews.member_id
        AND gym_id = gym_reviews.gym_id
        AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own review"
  ON public.gym_reviews FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view public reviews"
  ON public.gym_reviews FOR SELECT
  USING (
    is_public = true
    AND member_id IN (
      SELECT id FROM public.members
      WHERE gym_id = gym_reviews.gym_id
        AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to gym_reviews"
  ON public.gym_reviews FOR ALL
  USING (auth.role() = 'service_role');

-- feedback_requests
ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view feedback" ON public.feedback_requests;
DROP POLICY IF EXISTS "Gym owners can insert feedback" ON public.feedback_requests;
DROP POLICY IF EXISTS "Gym owners can update feedback" ON public.feedback_requests;
DROP POLICY IF EXISTS "Gym owners can delete feedback" ON public.feedback_requests;
DROP POLICY IF EXISTS "Members can view own feedback" ON public.feedback_requests;
DROP POLICY IF EXISTS "Members can respond to feedback" ON public.feedback_requests;
DROP POLICY IF EXISTS "Service role full access to feedback_requests" ON public.feedback_requests;

CREATE POLICY "Gym owners can view feedback"
  ON public.feedback_requests FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can insert feedback"
  ON public.feedback_requests FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can update feedback"
  ON public.feedback_requests FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can delete feedback"
  ON public.feedback_requests FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Members can view own feedback"
  ON public.feedback_requests FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can respond to feedback"
  ON public.feedback_requests FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to feedback_requests"
  ON public.feedback_requests FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_gym_reviews_updated_at ON public.gym_reviews;
CREATE TRIGGER update_gym_reviews_updated_at
  BEFORE UPDATE ON public.gym_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
