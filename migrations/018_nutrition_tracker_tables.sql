-- ============================================================
-- Migration: Nutrition Tracker - Food Items, Food Log, Custom Trackers
-- Created: 2026-03-02
-- Description: Adds backend persistence for the nutrition tracker
--              page: personal food database, daily food log entries,
--              and custom trackers (water, vitamins, etc.)
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. FOOD ITEMS - Personal food database per gym
-- ============================================================

CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  calories_per_serving INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fat INTEGER NOT NULL DEFAULT 0,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_items_member
ON public.food_items(member_id);

CREATE INDEX IF NOT EXISTS idx_food_items_gym
ON public.food_items(gym_id);

CREATE INDEX IF NOT EXISTS idx_food_items_name
ON public.food_items(member_id, name);

-- ============================================================
-- 2. FOOD LOG ENTRIES - Daily logged food for a member
-- ============================================================

CREATE TABLE IF NOT EXISTS public.food_log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  calories INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fat INTEGER NOT NULL DEFAULT 0,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_log_entries_member_date
ON public.food_log_entries(member_id, logged_date DESC);

CREATE INDEX IF NOT EXISTS idx_food_log_entries_gym
ON public.food_log_entries(gym_id);

-- ============================================================
-- 3. CUSTOM TRACKERS - Water, vitamins, supplements etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.custom_trackers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  daily_target INTEGER NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT 'Droplets',
  color TEXT NOT NULL DEFAULT 'cyan',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_trackers_member
ON public.custom_trackers(member_id);

CREATE INDEX IF NOT EXISTS idx_custom_trackers_gym
ON public.custom_trackers(gym_id);

-- ============================================================
-- 4. TRACKER DAILY LOG - Daily values for custom trackers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tracker_daily_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracker_id UUID NOT NULL REFERENCES public.custom_trackers(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT tracker_daily_log_unique UNIQUE (tracker_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_tracker_daily_log_tracker_date
ON public.tracker_daily_log(tracker_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_tracker_daily_log_member_date
ON public.tracker_daily_log(member_id, log_date DESC);

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_daily_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES - SERVICE ROLE ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Service role can manage food items" ON public.food_items;
CREATE POLICY "Service role can manage food items"
ON public.food_items FOR ALL
USING (true);

DROP POLICY IF EXISTS "Service role can manage food log entries" ON public.food_log_entries;
CREATE POLICY "Service role can manage food log entries"
ON public.food_log_entries FOR ALL
USING (true);

DROP POLICY IF EXISTS "Service role can manage custom trackers" ON public.custom_trackers;
CREATE POLICY "Service role can manage custom trackers"
ON public.custom_trackers FOR ALL
USING (true);

DROP POLICY IF EXISTS "Service role can manage tracker daily log" ON public.tracker_daily_log;
CREATE POLICY "Service role can manage tracker daily log"
ON public.tracker_daily_log FOR ALL
USING (true);

-- ============================================================
-- 7. RLS POLICIES - GYM OWNER ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym food items" ON public.food_items;
CREATE POLICY "Owners can view gym food items"
ON public.food_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gyms
    WHERE gyms.id = food_items.gym_id
    AND gyms.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can view gym food log entries" ON public.food_log_entries;
CREATE POLICY "Owners can view gym food log entries"
ON public.food_log_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gyms
    WHERE gyms.id = food_log_entries.gym_id
    AND gyms.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can view gym custom trackers" ON public.custom_trackers;
CREATE POLICY "Owners can view gym custom trackers"
ON public.custom_trackers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gyms
    WHERE gyms.id = custom_trackers.gym_id
    AND gyms.owner_id = auth.uid()
  )
);

-- ============================================================
-- 8. TRIGGERS - UPDATED_AT TIMESTAMPS
-- ============================================================

DROP TRIGGER IF EXISTS update_food_items_updated_at ON public.food_items;
CREATE TRIGGER update_food_items_updated_at
    BEFORE UPDATE ON public.food_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_log_entries_updated_at ON public.food_log_entries;
CREATE TRIGGER update_food_log_entries_updated_at
    BEFORE UPDATE ON public.food_log_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_trackers_updated_at ON public.custom_trackers;
CREATE TRIGGER update_custom_trackers_updated_at
    BEFORE UPDATE ON public.custom_trackers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracker_daily_log_updated_at ON public.tracker_daily_log;
CREATE TRIGGER update_tracker_daily_log_updated_at
    BEFORE UPDATE ON public.tracker_daily_log
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SUMMARY
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Migration 018: Nutrition Tracker Tables ===';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - food_items (personal food database)';
    RAISE NOTICE '  - food_log_entries (daily food log)';
    RAISE NOTICE '  - custom_trackers (tracker definitions)';
    RAISE NOTICE '  - tracker_daily_log (daily tracker values)';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS enabled on all tables';
    RAISE NOTICE 'Indexes created for common query patterns';
    RAISE NOTICE 'Triggers created for updated_at timestamps';
END $$;
