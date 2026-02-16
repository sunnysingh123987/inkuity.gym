-- ============================================================
-- Migration: Member Portal Schema V2 (Fixed)
-- Created: 2026-02-15
-- Description: Member portal with corrected meal_plans table
--              Uses scheduled_date column to avoid immutability issues
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. WORKOUT ROUTINES - Member's workout templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workout_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT workout_routines_gym_member_name UNIQUE (gym_id, member_id, name)
);

CREATE INDEX IF NOT EXISTS idx_workout_routines_member
ON public.workout_routines(member_id);

CREATE INDEX IF NOT EXISTS idx_workout_routines_gym
ON public.workout_routines(gym_id);

-- ============================================================
-- 2. EXERCISE LIBRARY - Gym-wide exercise catalog
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  equipment TEXT[],
  instructions TEXT,
  video_url TEXT,
  image_url TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT exercise_library_gym_name UNIQUE (gym_id, name)
);

CREATE INDEX IF NOT EXISTS idx_exercise_library_gym
ON public.exercise_library(gym_id);

CREATE INDEX IF NOT EXISTS idx_exercise_library_category
ON public.exercise_library(gym_id, category);

-- ============================================================
-- 3. ROUTINE EXERCISES - Join table linking routines to exercises
-- ============================================================

CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES public.workout_routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  sets INTEGER DEFAULT 3,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT routine_exercises_unique UNIQUE (routine_id, exercise_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine
ON public.routine_exercises(routine_id);

-- ============================================================
-- 4. WORKOUT SESSIONS - Actual workout tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT workout_sessions_status_check CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_member
ON public.workout_sessions(member_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_gym
ON public.workout_sessions(gym_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_checkin
ON public.workout_sessions(check_in_id)
WHERE check_in_id IS NOT NULL;

-- ============================================================
-- 5. SESSION EXERCISES - Individual exercises within a session
-- ============================================================

CREATE TABLE IF NOT EXISTS public.session_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_exercises_session
ON public.session_exercises(session_id);

-- ============================================================
-- 6. EXERCISE SETS - Track individual sets within session
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_exercise_id UUID NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight NUMERIC(6, 2),
  reps INTEGER,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_sets_session_exercise
ON public.exercise_sets(session_exercise_id);

-- ============================================================
-- 7. DIET PLANS - Member's diet/nutrition plans
-- ============================================================

CREATE TABLE IF NOT EXISTS public.diet_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fat INTEGER,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_member
ON public.diet_plans(member_id);

CREATE INDEX IF NOT EXISTS idx_diet_plans_gym
ON public.diet_plans(gym_id);

-- ============================================================
-- 8. MEAL PLANS - Daily meal entries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diet_plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  scheduled_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT meal_plans_meal_type_check CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  CONSTRAINT meal_plans_unique UNIQUE (diet_plan_id, scheduled_date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_diet_plan_date
ON public.meal_plans(diet_plan_id, scheduled_date DESC);

-- ============================================================
-- 9. MEMBER PORTAL TOKENS - Magic link authentication tokens
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_portal_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_portal_tokens_token
ON public.member_portal_tokens(token, expires_at)
WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_member_portal_tokens_member
ON public.member_portal_tokens(member_id);

-- ============================================================
-- 10. ENABLE ROW LEVEL SECURITY ON ALL NEW TABLES
-- ============================================================

ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_portal_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. RLS POLICIES - WORKOUT ROUTINES
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym workout routines" ON public.workout_routines;
CREATE POLICY "Owners can view gym workout routines"
ON public.workout_routines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gyms
    WHERE gyms.id = workout_routines.gym_id
    AND gyms.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage workout routines" ON public.workout_routines;
CREATE POLICY "Service role can manage workout routines"
ON public.workout_routines FOR ALL
USING (true);

-- ============================================================
-- 12. RLS POLICIES - EXERCISE LIBRARY
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym exercises" ON public.exercise_library;
CREATE POLICY "Owners can view gym exercises"
ON public.exercise_library FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gyms
    WHERE gyms.id = exercise_library.gym_id
    AND gyms.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage exercises" ON public.exercise_library;
CREATE POLICY "Service role can manage exercises"
ON public.exercise_library FOR ALL
USING (true);

-- ============================================================
-- 13. RLS POLICIES - ROUTINE EXERCISES
-- ============================================================

DROP POLICY IF EXISTS "Service role can manage routine exercises" ON public.routine_exercises;
CREATE POLICY "Service role can manage routine exercises"
ON public.routine_exercises FOR ALL
USING (true);

-- ============================================================
-- 14. RLS POLICIES - WORKOUT SESSIONS
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym workout sessions" ON public.workout_sessions;
CREATE POLICY "Owners can view gym workout sessions"
ON public.workout_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gyms
    WHERE gyms.id = workout_sessions.gym_id
    AND gyms.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage workout sessions" ON public.workout_sessions;
CREATE POLICY "Service role can manage workout sessions"
ON public.workout_sessions FOR ALL
USING (true);

-- ============================================================
-- 15. RLS POLICIES - SESSION EXERCISES
-- ============================================================

DROP POLICY IF EXISTS "Service role can manage session exercises" ON public.session_exercises;
CREATE POLICY "Service role can manage session exercises"
ON public.session_exercises FOR ALL
USING (true);

-- ============================================================
-- 16. RLS POLICIES - EXERCISE SETS
-- ============================================================

DROP POLICY IF EXISTS "Service role can manage exercise sets" ON public.exercise_sets;
CREATE POLICY "Service role can manage exercise sets"
ON public.exercise_sets FOR ALL
USING (true);

-- ============================================================
-- 17. RLS POLICIES - DIET PLANS
-- ============================================================

DROP POLICY IF EXISTS "Owners can view gym diet plans" ON public.diet_plans;
CREATE POLICY "Owners can view gym diet plans"
ON public.diet_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gyms
    WHERE gyms.id = diet_plans.gym_id
    AND gyms.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage diet plans" ON public.diet_plans;
CREATE POLICY "Service role can manage diet plans"
ON public.diet_plans FOR ALL
USING (true);

-- ============================================================
-- 18. RLS POLICIES - MEAL PLANS
-- ============================================================

DROP POLICY IF EXISTS "Service role can manage meal plans" ON public.meal_plans;
CREATE POLICY "Service role can manage meal plans"
ON public.meal_plans FOR ALL
USING (true);

-- ============================================================
-- 19. RLS POLICIES - MEMBER PORTAL TOKENS
-- ============================================================

DROP POLICY IF EXISTS "Service role can manage portal tokens" ON public.member_portal_tokens;
CREATE POLICY "Service role can manage portal tokens"
ON public.member_portal_tokens FOR ALL
USING (true);

-- ============================================================
-- 20. UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_workout_routines_updated_at ON public.workout_routines;
CREATE TRIGGER update_workout_routines_updated_at
    BEFORE UPDATE ON public.workout_routines
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exercise_library_updated_at ON public.exercise_library;
CREATE TRIGGER update_exercise_library_updated_at
    BEFORE UPDATE ON public.exercise_library
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at
    BEFORE UPDATE ON public.workout_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_diet_plans_updated_at ON public.diet_plans;
CREATE TRIGGER update_diet_plans_updated_at
    BEFORE UPDATE ON public.diet_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON public.meal_plans;
CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 21. SEED EXERCISE LIBRARY WITH COMMON EXERCISES
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_exercise_library_for_gym(p_gym_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.exercise_library (gym_id, name, description, category, equipment, is_custom)
  VALUES
    -- CHEST
    (p_gym_id, 'Barbell Bench Press', 'Classic chest builder', 'chest', ARRAY['barbell', 'bench'], false),
    (p_gym_id, 'Dumbbell Bench Press', 'DB chest press', 'chest', ARRAY['dumbbells', 'bench'], false),
    (p_gym_id, 'Incline Bench Press', 'Upper chest focus', 'chest', ARRAY['barbell', 'bench'], false),
    (p_gym_id, 'Cable Flyes', 'Chest isolation', 'chest', ARRAY['cables'], false),
    (p_gym_id, 'Push-ups', 'Bodyweight chest exercise', 'chest', ARRAY['bodyweight'], false),
    (p_gym_id, 'Dips (Chest)', 'Chest-focused dips', 'chest', ARRAY['dip bars'], false),

    -- BACK
    (p_gym_id, 'Deadlift', 'Full body posterior chain', 'back', ARRAY['barbell'], false),
    (p_gym_id, 'Pull-ups', 'Bodyweight back exercise', 'back', ARRAY['pull-up bar'], false),
    (p_gym_id, 'Bent Over Rows', 'Mid-back thickness', 'back', ARRAY['barbell'], false),
    (p_gym_id, 'Lat Pulldown', 'Lat development', 'back', ARRAY['cable machine'], false),
    (p_gym_id, 'Seated Cable Rows', 'Mid-back rows', 'back', ARRAY['cables'], false),
    (p_gym_id, 'T-Bar Rows', 'Thick back builder', 'back', ARRAY['barbell', 't-bar'], false),

    -- LEGS
    (p_gym_id, 'Barbell Squat', 'King of leg exercises', 'legs', ARRAY['barbell', 'rack'], false),
    (p_gym_id, 'Leg Press', 'Quad focus', 'legs', ARRAY['leg press machine'], false),
    (p_gym_id, 'Romanian Deadlift', 'Hamstring focus', 'legs', ARRAY['barbell'], false),
    (p_gym_id, 'Leg Curls', 'Hamstring isolation', 'legs', ARRAY['leg curl machine'], false),
    (p_gym_id, 'Leg Extensions', 'Quad isolation', 'legs', ARRAY['leg extension machine'], false),
    (p_gym_id, 'Walking Lunges', 'Unilateral leg work', 'legs', ARRAY['dumbbells'], false),
    (p_gym_id, 'Calf Raises', 'Calf development', 'legs', ARRAY['calf machine'], false),

    -- SHOULDERS
    (p_gym_id, 'Overhead Press', 'Shoulder mass builder', 'shoulders', ARRAY['barbell'], false),
    (p_gym_id, 'Dumbbell Shoulder Press', 'DB shoulder press', 'shoulders', ARRAY['dumbbells'], false),
    (p_gym_id, 'Lateral Raises', 'Side delt isolation', 'shoulders', ARRAY['dumbbells'], false),
    (p_gym_id, 'Front Raises', 'Front delt isolation', 'shoulders', ARRAY['dumbbells'], false),
    (p_gym_id, 'Rear Delt Flyes', 'Rear delt isolation', 'shoulders', ARRAY['dumbbells'], false),
    (p_gym_id, 'Face Pulls', 'Rear delts and upper back', 'shoulders', ARRAY['cables'], false),

    -- ARMS - BICEPS
    (p_gym_id, 'Barbell Curl', 'Classic bicep builder', 'biceps', ARRAY['barbell'], false),
    (p_gym_id, 'Dumbbell Curl', 'DB bicep curl', 'biceps', ARRAY['dumbbells'], false),
    (p_gym_id, 'Hammer Curls', 'Brachialis focus', 'biceps', ARRAY['dumbbells'], false),
    (p_gym_id, 'Preacher Curls', 'Isolated bicep curl', 'biceps', ARRAY['preacher bench', 'barbell'], false),
    (p_gym_id, 'Cable Curls', 'Constant tension curls', 'biceps', ARRAY['cables'], false),

    -- ARMS - TRICEPS
    (p_gym_id, 'Tricep Dips', 'Tricep mass builder', 'triceps', ARRAY['dip bars'], false),
    (p_gym_id, 'Close-Grip Bench Press', 'Compound tricep exercise', 'triceps', ARRAY['barbell', 'bench'], false),
    (p_gym_id, 'Tricep Pushdowns', 'Tricep isolation', 'triceps', ARRAY['cables'], false),
    (p_gym_id, 'Overhead Tricep Extension', 'Long head focus', 'triceps', ARRAY['dumbbells'], false),
    (p_gym_id, 'Skull Crushers', 'Lying tricep extension', 'triceps', ARRAY['barbell', 'bench'], false),

    -- CORE
    (p_gym_id, 'Plank', 'Core stability', 'core', ARRAY['bodyweight'], false),
    (p_gym_id, 'Crunches', 'Ab isolation', 'core', ARRAY['bodyweight'], false),
    (p_gym_id, 'Russian Twists', 'Oblique work', 'core', ARRAY['medicine ball'], false),
    (p_gym_id, 'Leg Raises', 'Lower ab focus', 'core', ARRAY['bodyweight'], false),
    (p_gym_id, 'Cable Crunches', 'Weighted ab work', 'core', ARRAY['cables'], false),

    -- CARDIO
    (p_gym_id, 'Treadmill Running', 'Cardio endurance', 'cardio', ARRAY['treadmill'], false),
    (p_gym_id, 'Elliptical', 'Low-impact cardio', 'cardio', ARRAY['elliptical'], false),
    (p_gym_id, 'Rowing Machine', 'Full body cardio', 'cardio', ARRAY['rowing machine'], false),
    (p_gym_id, 'Stationary Bike', 'Cycling cardio', 'cardio', ARRAY['bike'], false),
    (p_gym_id, 'Jump Rope', 'High-intensity cardio', 'cardio', ARRAY['jump rope'], false),
    (p_gym_id, 'Burpees', 'Full body cardio', 'cardio', ARRAY['bodyweight'], false)
  ON CONFLICT (gym_id, name) DO NOTHING;
END;
$$;

-- ============================================================
-- 22. VERIFY INSTALLATION
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Member Portal Migration V2 Completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: 9 new tables';
    RAISE NOTICE '  - workout_routines';
    RAISE NOTICE '  - exercise_library';
    RAISE NOTICE '  - routine_exercises';
    RAISE NOTICE '  - workout_sessions';
    RAISE NOTICE '  - session_exercises';
    RAISE NOTICE '  - exercise_sets';
    RAISE NOTICE '  - diet_plans';
    RAISE NOTICE '  - meal_plans (with scheduled_date column)';
    RAISE NOTICE '  - member_portal_tokens';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS enabled on all tables';
    RAISE NOTICE 'Indexes created for performance';
    RAISE NOTICE 'Triggers created for updated_at';
    RAISE NOTICE '';
    RAISE NOTICE 'To seed exercises for a gym, run:';
    RAISE NOTICE '  SELECT seed_exercise_library_for_gym(''<gym-id>'');';
    RAISE NOTICE '========================================';
END $$;
