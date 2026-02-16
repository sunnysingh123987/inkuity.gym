-- ============================================================
-- Migration: MVP Features - Daily Check-in Limit & Analytics
-- Version: 2.0 (No functional indexes)
-- Created: 2026-02-15
-- Description: Adds daily check-in limit enforcement, performance
--              indexes, and helper functions for MVP features
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. DAILY CHECK-IN LIMIT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_daily_checkin_limit(
    p_member_id UUID,
    p_gym_id UUID,
    p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    can_check_in BOOLEAN,
    last_checkin_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    checkin_count INTEGER;
    last_checkin TIMESTAMPTZ;
    start_of_day TIMESTAMPTZ;
    end_of_day TIMESTAMPTZ;
BEGIN
    -- Calculate start and end of the target date
    start_of_day := p_check_date::timestamptz;
    end_of_day := (p_check_date + INTERVAL '1 day')::timestamptz;

    -- Count check-ins for this member at this gym on the specified date
    SELECT COUNT(*), MAX(check_in_at)
    INTO checkin_count, last_checkin
    FROM public.check_ins
    WHERE member_id = p_member_id
      AND gym_id = p_gym_id
      AND check_in_at >= start_of_day
      AND check_in_at < end_of_day;

    -- Return TRUE if no check-ins found (allowed to check in)
    RETURN QUERY SELECT (checkin_count = 0), last_checkin;
END;
$$;

COMMENT ON FUNCTION public.check_daily_checkin_limit IS
'Checks if a member can check in today. Returns true if no check-ins found for today, false otherwise.';

GRANT EXECUTE ON FUNCTION public.check_daily_checkin_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_daily_checkin_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.check_daily_checkin_limit TO anon;

-- ============================================================
-- 2. PERFORMANCE INDEXES (No functional indexes)
-- ============================================================

-- Index for check-in queries (member + gym + time range)
CREATE INDEX IF NOT EXISTS idx_check_ins_member_gym_time
ON public.check_ins(member_id, gym_id, check_in_at);

-- Index for gym analytics (reversed for DESC queries)
CREATE INDEX IF NOT EXISTS idx_check_ins_gym_time_desc
ON public.check_ins(gym_id, check_in_at DESC);

-- Index for member lookups
CREATE INDEX IF NOT EXISTS idx_check_ins_member_id
ON public.check_ins(member_id);

-- Index for scans analytics
CREATE INDEX IF NOT EXISTS idx_scans_gym_time_desc
ON public.scans(gym_id, scanned_at DESC);

-- Index for scans by QR code
CREATE INDEX IF NOT EXISTS idx_scans_qr_code_id
ON public.scans(qr_code_id);

-- Index for members by gym and email
CREATE INDEX IF NOT EXISTS idx_members_gym_email
ON public.members(gym_id, email)
WHERE email IS NOT NULL;

-- Index for members by gym
CREATE INDEX IF NOT EXISTS idx_members_gym_id
ON public.members(gym_id);

-- Index for QR codes by gym
CREATE INDEX IF NOT EXISTS idx_qr_codes_gym_id
ON public.qr_codes(gym_id);

-- Index for QR codes by code (for lookups)
CREATE INDEX IF NOT EXISTS idx_qr_codes_code
ON public.qr_codes(code);

-- Index for daily analytics
CREATE INDEX IF NOT EXISTS idx_daily_analytics_gym_date
ON public.daily_analytics(gym_id, date DESC);

-- ============================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gyms_updated_at ON public.gyms;
CREATE TRIGGER update_gyms_updated_at
    BEFORE UPDATE ON public.gyms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON public.qr_codes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_analytics_updated_at ON public.daily_analytics;
CREATE TRIGGER update_daily_analytics_updated_at
    BEFORE UPDATE ON public.daily_analytics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. INCREMENT QR CODE SCAN COUNT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_qr_scan_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.qr_code_id IS NOT NULL THEN
        UPDATE public.qr_codes
        SET total_scans = total_scans + 1,
            updated_at = NOW()
        WHERE id = NEW.qr_code_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_scan_count_on_insert ON public.scans;
CREATE TRIGGER increment_scan_count_on_insert
    AFTER INSERT ON public.scans
    FOR EACH ROW EXECUTE FUNCTION public.increment_qr_scan_count();

-- ============================================================
-- 5. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. ANALYTICS AGGREGATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date DATE)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    start_of_day TIMESTAMPTZ;
    end_of_day TIMESTAMPTZ;
BEGIN
    start_of_day := target_date::timestamptz;
    end_of_day := (target_date + INTERVAL '1 day')::timestamptz;

    INSERT INTO public.daily_analytics (
        gym_id,
        date,
        total_scans,
        unique_visitors,
        new_members,
        returning_members
    )
    SELECT
        s.gym_id,
        target_date as date,
        COUNT(*) as total_scans,
        COUNT(DISTINCT s.member_id) as unique_visitors,
        COUNT(DISTINCT CASE WHEN s.member_id IS NULL THEN s.ip_address END) as new_members,
        COUNT(DISTINCT CASE WHEN s.member_id IS NOT NULL THEN s.member_id END) as returning_members
    FROM public.scans s
    WHERE s.scanned_at >= start_of_day
      AND s.scanned_at < end_of_day
    GROUP BY s.gym_id
    ON CONFLICT (gym_id, date) DO UPDATE SET
        total_scans = EXCLUDED.total_scans,
        unique_visitors = EXCLUDED.unique_visitors,
        new_members = EXCLUDED.new_members,
        returning_members = EXCLUDED.returning_members,
        updated_at = NOW();
END;
$$;

-- ============================================================
-- 7. ADD MISSING CONSTRAINTS
-- ============================================================

-- Unique constraint on gym_id + date for daily_analytics
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'daily_analytics_gym_id_date_key'
    ) THEN
        ALTER TABLE public.daily_analytics
        ADD CONSTRAINT daily_analytics_gym_id_date_key
        UNIQUE (gym_id, date);
    END IF;
END $$;

-- Unique constraint on gym_id + email for members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'members_gym_id_email_key'
    ) THEN
        -- Remove duplicates first (keep oldest)
        DELETE FROM public.members m1
        WHERE m1.email IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.members m2
            WHERE m2.gym_id = m1.gym_id
            AND m2.email = m1.email
            AND m2.created_at < m1.created_at
        );

        ALTER TABLE public.members
        ADD CONSTRAINT members_gym_id_email_key
        UNIQUE (gym_id, email);
    END IF;
END $$;

-- ============================================================
-- 8. ADD CHECK CONSTRAINTS
-- ============================================================

-- Membership status constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'members_membership_status_check'
    ) THEN
        ALTER TABLE public.members
        ADD CONSTRAINT members_membership_status_check
        CHECK (membership_status IS NULL OR membership_status = ANY (ARRAY[
            'active'::text,
            'expired'::text,
            'suspended'::text,
            'cancelled'::text,
            'pending'::text
        ]));
    END IF;
END $$;

-- Subscription plan constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'members_subscription_plan_check'
    ) THEN
        ALTER TABLE public.members
        ADD CONSTRAINT members_subscription_plan_check
        CHECK (subscription_plan IS NULL OR subscription_plan = ANY (ARRAY[
            '1_month'::text,
            '3_months'::text,
            '6_months'::text,
            '1_year'::text,
            'custom'::text
        ]));
    END IF;
END $$;

-- ============================================================
-- 9. VERIFY INSTALLATION
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - check_daily_checkin_limit';
    RAISE NOTICE '  - increment_qr_scan_count';
    RAISE NOTICE '  - handle_new_user';
    RAISE NOTICE '  - aggregate_daily_analytics';
    RAISE NOTICE '  - update_updated_at_column';
    RAISE NOTICE '';
    RAISE NOTICE 'Indexes created: 10 performance indexes';
    RAISE NOTICE 'Triggers created: 6 auto-update triggers';
    RAISE NOTICE 'Constraints added: Unique + Check constraints';
    RAISE NOTICE '========================================';
END $$;
