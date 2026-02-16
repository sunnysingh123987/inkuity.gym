-- Add PIN-based authentication to members table
-- Replace Supabase Auth with simple PIN system

-- Add PIN column to members table
ALTER TABLE public.members
ADD COLUMN portal_pin TEXT,
ADD COLUMN pin_created_at TIMESTAMPTZ,
ADD COLUMN last_pin_sent_at TIMESTAMPTZ;

-- Create index for faster PIN lookups
CREATE INDEX idx_members_email_pin ON public.members(email, portal_pin)
WHERE portal_pin IS NOT NULL;

-- Update RLS policies to use PIN-based auth instead of auth.uid()
-- We'll manage sessions manually with cookies

-- Drop existing auth-based RLS policies and create new ones
DROP POLICY IF EXISTS "Members can view own data" ON public.members;
DROP POLICY IF EXISTS "Members can update own data" ON public.members;

-- For member portal access, we'll use service role with manual filtering
-- These policies allow service role access (our server actions will filter by member_id)
CREATE POLICY "Service role can manage members"
ON public.members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Gym owners can still view their members
CREATE POLICY "Gym owners can view members"
ON public.members
FOR SELECT
USING (
  gym_id IN (
    SELECT id FROM public.gyms
    WHERE owner_id = auth.uid()
  )
);

-- Similar updates for other member-related tables
-- workout_routines
DROP POLICY IF EXISTS "Members can view own routines" ON public.workout_routines;
CREATE POLICY "Service role can manage routines"
ON public.workout_routines
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- workout_sessions
DROP POLICY IF EXISTS "Members can view own sessions" ON public.workout_sessions;
CREATE POLICY "Service role can manage sessions"
ON public.workout_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- diet_plans
DROP POLICY IF EXISTS "Members can view own diet plans" ON public.diet_plans;
CREATE POLICY "Service role can manage diet plans"
ON public.diet_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- meal_plans
DROP POLICY IF EXISTS "Members can view own meals" ON public.meal_plans;
CREATE POLICY "Service role can manage meals"
ON public.meal_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment explaining the approach
COMMENT ON COLUMN public.members.portal_pin IS 'Encrypted 4-digit PIN for member portal access. Generated on first portal access attempt.';
COMMENT ON COLUMN public.members.pin_created_at IS 'Timestamp when PIN was first created';
COMMENT ON COLUMN public.members.last_pin_sent_at IS 'Timestamp when PIN was last sent via email (for rate limiting)';
