-- Add PIN-based authentication to members table
-- Version 2: Handles existing policies gracefully

-- Add PIN columns to members table (IF NOT EXISTS is supported)
DO $$
BEGIN
    -- Add portal_pin column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'portal_pin'
    ) THEN
        ALTER TABLE public.members ADD COLUMN portal_pin TEXT;
    END IF;

    -- Add pin_created_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'pin_created_at'
    ) THEN
        ALTER TABLE public.members ADD COLUMN pin_created_at TIMESTAMPTZ;
    END IF;

    -- Add last_pin_sent_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'last_pin_sent_at'
    ) THEN
        ALTER TABLE public.members ADD COLUMN last_pin_sent_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create index for faster PIN lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_members_email_pin ON public.members(email, portal_pin)
WHERE portal_pin IS NOT NULL;

-- Update RLS policies to use PIN-based auth instead of auth.uid()
-- Drop and recreate policies for members table
DROP POLICY IF EXISTS "Members can view own data" ON public.members;
DROP POLICY IF EXISTS "Members can update own data" ON public.members;
DROP POLICY IF EXISTS "Service role can manage members" ON public.members;
DROP POLICY IF EXISTS "Gym owners can view members" ON public.members;

CREATE POLICY "Service role can manage members"
ON public.members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Gym owners can view members"
ON public.members
FOR SELECT
USING (
  gym_id IN (
    SELECT id FROM public.gyms
    WHERE owner_id = auth.uid()
  )
);

-- Update policies for workout_routines
DROP POLICY IF EXISTS "Members can view own routines" ON public.workout_routines;
DROP POLICY IF EXISTS "Service role can manage routines" ON public.workout_routines;

CREATE POLICY "Service role can manage routines"
ON public.workout_routines
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update policies for workout_sessions
DROP POLICY IF EXISTS "Members can view own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.workout_sessions;

CREATE POLICY "Service role can manage sessions"
ON public.workout_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update policies for diet_plans
DROP POLICY IF EXISTS "Members can view own diet plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Service role can manage diet plans" ON public.diet_plans;

CREATE POLICY "Service role can manage diet plans"
ON public.diet_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update policies for meal_plans
DROP POLICY IF EXISTS "Members can view own meals" ON public.meal_plans;
DROP POLICY IF EXISTS "Service role can manage meals" ON public.meal_plans;

CREATE POLICY "Service role can manage meals"
ON public.meal_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comments
COMMENT ON COLUMN public.members.portal_pin IS 'Encrypted 4-digit PIN for member portal access. Generated on first portal access attempt.';
COMMENT ON COLUMN public.members.pin_created_at IS 'Timestamp when PIN was first created';
COMMENT ON COLUMN public.members.last_pin_sent_at IS 'Timestamp when PIN was last sent via email (for rate limiting)';
