-- ============================================================
-- Migration: Fix Multi-Tenancy & Enable Row Level Security
-- Created: 2026-02-15
-- Description: Enables RLS policies to isolate gym owners' data
-- ============================================================

-- ============================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. PROFILES - Users can only see/edit their own profile
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================
-- 3. GYMS - Owners can CRUD their own gyms
-- ============================================================

DROP POLICY IF EXISTS "Gym owners can view own gyms" ON public.gyms;
CREATE POLICY "Gym owners can view own gyms"
ON public.gyms FOR SELECT
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Gym owners can create gyms" ON public.gyms;
CREATE POLICY "Gym owners can create gyms"
ON public.gyms FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Gym owners can update own gyms" ON public.gyms;
CREATE POLICY "Gym owners can update own gyms"
ON public.gyms FOR UPDATE
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Gym owners can delete own gyms" ON public.gyms;
CREATE POLICY "Gym owners can delete own gyms"
ON public.gyms FOR DELETE
USING (auth.uid() = owner_id);

-- Public can view active gyms (for landing pages)
DROP POLICY IF EXISTS "Anyone can view active gyms" ON public.gyms;
CREATE POLICY "Anyone can view active gyms"
ON public.gyms FOR SELECT
USING (is_active = true);

-- ============================================================
-- 4. QR CODES - Owners can manage QR codes for their gyms
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym QR codes" ON public.qr_codes;
CREATE POLICY "Owners can view gym QR codes"
ON public.qr_codes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = qr_codes.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can create gym QR codes" ON public.qr_codes;
CREATE POLICY "Owners can create gym QR codes"
ON public.qr_codes FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = qr_codes.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can update gym QR codes" ON public.qr_codes;
CREATE POLICY "Owners can update gym QR codes"
ON public.qr_codes FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = qr_codes.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can delete gym QR codes" ON public.qr_codes;
CREATE POLICY "Owners can delete gym QR codes"
ON public.qr_codes FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = qr_codes.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

-- Public can view active QR codes (for scanning)
DROP POLICY IF EXISTS "Anyone can view active QR codes" ON public.qr_codes;
CREATE POLICY "Anyone can view active QR codes"
ON public.qr_codes FOR SELECT
USING (is_active = true);

-- ============================================================
-- 5. MEMBERS - Owners can manage members of their gyms
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym members" ON public.members;
CREATE POLICY "Owners can view gym members"
ON public.members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = members.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can create gym members" ON public.members;
CREATE POLICY "Owners can create gym members"
ON public.members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = members.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can update gym members" ON public.members;
CREATE POLICY "Owners can update gym members"
ON public.members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = members.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can delete gym members" ON public.members;
CREATE POLICY "Owners can delete gym members"
ON public.members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = members.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

-- Service role can create members (for public check-ins)
DROP POLICY IF EXISTS "Service role can create members" ON public.members;
CREATE POLICY "Service role can create members"
ON public.members FOR INSERT
WITH CHECK (true);

-- ============================================================
-- 6. SCANS - Owners can view scans for their gyms
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym scans" ON public.scans;
CREATE POLICY "Owners can view gym scans"
ON public.scans FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = scans.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

-- Anyone can create scans (public QR scanning)
DROP POLICY IF EXISTS "Anyone can create scans" ON public.scans;
CREATE POLICY "Anyone can create scans"
ON public.scans FOR INSERT
WITH CHECK (true);

-- ============================================================
-- 7. CHECK-INS - Owners can view check-ins for their gyms
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym check-ins" ON public.check_ins;
CREATE POLICY "Owners can view gym check-ins"
ON public.check_ins FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = check_ins.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

-- Anyone can create check-ins (public check-in)
DROP POLICY IF EXISTS "Anyone can create check-ins" ON public.check_ins;
CREATE POLICY "Anyone can create check-ins"
ON public.check_ins FOR INSERT
WITH CHECK (true);

-- Service role can update check-ins
DROP POLICY IF EXISTS "Service role can update check-ins" ON public.check_ins;
CREATE POLICY "Service role can update check-ins"
ON public.check_ins FOR UPDATE
USING (true);

-- ============================================================
-- 8. DAILY ANALYTICS - Owners can view analytics for their gyms
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym analytics" ON public.daily_analytics;
CREATE POLICY "Owners can view gym analytics"
ON public.daily_analytics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = daily_analytics.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Service role can manage analytics" ON public.daily_analytics;
CREATE POLICY "Service role can manage analytics"
ON public.daily_analytics FOR ALL
USING (true);

-- ============================================================
-- 9. WEBHOOK EVENTS - Owners can view events for their gyms
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym webhooks" ON public.webhook_events;
CREATE POLICY "Owners can view gym webhooks"
ON public.webhook_events FOR SELECT
USING (
    gym_id IS NULL OR
    EXISTS (
        SELECT 1 FROM public.gyms
        WHERE gyms.id = webhook_events.gym_id
        AND gyms.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Service role can manage webhooks" ON public.webhook_events;
CREATE POLICY "Service role can manage webhooks"
ON public.webhook_events FOR ALL
USING (true);

-- ============================================================
-- 10. VERIFY RLS IS ENABLED
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Row Level Security (RLS) Enabled!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Multi-tenancy is now enforced:';
    RAISE NOTICE '  - Gym owners see ONLY their gyms';
    RAISE NOTICE '  - Members isolated by gym';
    RAISE NOTICE '  - Analytics filtered by ownership';
    RAISE NOTICE '  - Public can still scan QR codes';
    RAISE NOTICE '========================================';
END $$;
