-- ============================================================
-- 022: Add image_url to food_log_entries for AI snap photos
-- ============================================================

ALTER TABLE public.food_log_entries
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Summary
DO $$ BEGIN
    RAISE NOTICE 'Migration 022: Added image_url column to food_log_entries';
END $$;
