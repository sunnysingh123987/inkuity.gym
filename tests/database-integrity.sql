-- ============================================================
-- DATABASE INTEGRITY & SECURITY TESTS
-- Member Portal - Phase 8 Testing
-- ============================================================

-- Run this file to verify database schema, RLS policies, and data integrity

\echo '========================================'
\echo 'MEMBER PORTAL - DATABASE INTEGRITY TESTS'
\echo '========================================'
\echo ''

-- ============================================================
-- 1. VERIFY ALL TABLES EXIST
-- ============================================================

\echo '1. Verifying tables exist...'

SELECT
  CASE WHEN COUNT(*) = 9 THEN 'PASS ✓' ELSE 'FAIL ✗' END AS status,
  'All 9 member portal tables exist' AS test,
  COUNT(*) || ' tables found' AS result
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'workout_routines',
  'exercise_library',
  'routine_exercises',
  'workout_sessions',
  'session_exercises',
  'exercise_sets',
  'diet_plans',
  'meal_plans',
  'member_portal_tokens'
);

\echo ''

-- ============================================================
-- 2. VERIFY ROW LEVEL SECURITY ENABLED
-- ============================================================

\echo '2. Verifying RLS enabled on all tables...'

SELECT
  CASE WHEN COUNT(*) = 9 THEN 'PASS ✓' ELSE 'FAIL ✗' END AS status,
  'RLS enabled on all portal tables' AS test,
  COUNT(*) || ' tables with RLS' AS result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'workout_routines',
  'exercise_library',
  'routine_exercises',
  'workout_sessions',
  'session_exercises',
  'exercise_sets',
  'diet_plans',
  'meal_plans',
  'member_portal_tokens'
)
AND rowsecurity = true;

\echo ''

-- ============================================================
-- 3. VERIFY RLS POLICIES EXIST
-- ============================================================

\echo '3. Verifying RLS policies exist...'

SELECT
  tablename,
  COUNT(*) AS policy_count,
  CASE WHEN COUNT(*) >= 1 THEN 'PASS ✓' ELSE 'FAIL ✗' END AS status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'workout_routines',
  'exercise_library',
  'routine_exercises',
  'workout_sessions',
  'session_exercises',
  'exercise_sets',
  'diet_plans',
  'meal_plans',
  'member_portal_tokens'
)
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- ============================================================
-- 4. VERIFY INDEXES EXIST
-- ============================================================

\echo '4. Verifying performance indexes exist...'

SELECT
  CASE WHEN COUNT(*) >= 10 THEN 'PASS ✓' ELSE 'FAIL ✗' END AS status,
  'Performance indexes created' AS test,
  COUNT(*) || ' indexes found' AS result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND tablename IN (
  'workout_routines',
  'exercise_library',
  'routine_exercises',
  'workout_sessions',
  'session_exercises',
  'exercise_sets',
  'diet_plans',
  'meal_plans',
  'member_portal_tokens'
);

\echo ''

-- List all indexes
SELECT
  tablename,
  indexname,
  'OK' AS status
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND tablename IN (
  'workout_routines',
  'exercise_library',
  'routine_exercises',
  'workout_sessions',
  'session_exercises',
  'exercise_sets',
  'diet_plans',
  'meal_plans',
  'member_portal_tokens'
)
ORDER BY tablename, indexname;

\echo ''

-- ============================================================
-- 5. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================

\echo '5. Verifying foreign key constraints...'

SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  'OK' AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'workout_routines',
  'exercise_library',
  'routine_exercises',
  'workout_sessions',
  'session_exercises',
  'exercise_sets',
  'diet_plans',
  'meal_plans',
  'member_portal_tokens'
)
ORDER BY tc.table_name, tc.constraint_name;

\echo ''

-- ============================================================
-- 6. VERIFY CHECK CONSTRAINTS
-- ============================================================

\echo '6. Verifying check constraints...'

SELECT
  tablename,
  constraintname,
  'OK' AS status
FROM pg_constraint
JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE nspname = 'public'
AND contype = 'c'
AND relname IN (
  'workout_sessions',
  'meal_plans'
)
ORDER BY tablename;

\echo ''

-- ============================================================
-- 7. VERIFY UPDATED_AT TRIGGERS
-- ============================================================

\echo '7. Verifying updated_at triggers...'

SELECT
  event_object_table AS table_name,
  trigger_name,
  CASE WHEN trigger_name LIKE '%updated_at%' THEN 'PASS ✓' ELSE 'FAIL ✗' END AS status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
  'workout_routines',
  'exercise_library',
  'workout_sessions',
  'diet_plans',
  'meal_plans'
)
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

\echo ''

-- ============================================================
-- 8. VERIFY UNIQUE CONSTRAINTS
-- ============================================================

\echo '8. Verifying unique constraints...'

SELECT
  tc.table_name,
  tc.constraint_name,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns,
  'OK' AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'workout_routines',
  'exercise_library',
  'routine_exercises',
  'meal_plans',
  'member_portal_tokens'
)
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

\echo ''

-- ============================================================
-- 9. VERIFY SEED FUNCTION EXISTS
-- ============================================================

\echo '9. Verifying exercise seed function exists...'

SELECT
  CASE WHEN COUNT(*) = 1 THEN 'PASS ✓' ELSE 'FAIL ✗' END AS status,
  'seed_exercise_library_for_gym function exists' AS test
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE proname = 'seed_exercise_library_for_gym'
AND nspname = 'public';

\echo ''

-- ============================================================
-- 10. DATA INTEGRITY CHECKS
-- ============================================================

\echo '10. Running data integrity checks...'

-- Check for orphaned routine_exercises
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - ' || COUNT(*) || ' orphaned records' END AS status,
  'No orphaned routine_exercises' AS test
FROM routine_exercises re
LEFT JOIN workout_routines wr ON re.routine_id = wr.id
LEFT JOIN exercise_library el ON re.exercise_id = el.id
WHERE wr.id IS NULL OR el.id IS NULL;

-- Check for session_exercises without sessions
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - ' || COUNT(*) || ' orphaned records' END AS status,
  'No orphaned session_exercises' AS test
FROM session_exercises se
LEFT JOIN workout_sessions ws ON se.session_id = ws.id
WHERE ws.id IS NULL;

-- Check for exercise_sets without session_exercises
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - ' || COUNT(*) || ' orphaned records' END AS status,
  'No orphaned exercise_sets' AS test
FROM exercise_sets es
LEFT JOIN session_exercises se ON es.session_exercise_id = se.id
WHERE se.id IS NULL;

-- Check for meal_plans without diet_plans
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - ' || COUNT(*) || ' orphaned records' END AS status,
  'No orphaned meal_plans' AS test
FROM meal_plans mp
LEFT JOIN diet_plans dp ON mp.diet_plan_id = dp.id
WHERE dp.id IS NULL;

\echo ''

-- ============================================================
-- 11. VERIFY CONSTRAINT CHECKS
-- ============================================================

\echo '11. Verifying constraint logic...'

-- Check workout_sessions status constraint
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - Invalid status found' END AS status,
  'workout_sessions.status must be valid' AS test
FROM workout_sessions
WHERE status NOT IN ('in_progress', 'completed', 'abandoned');

-- Check meal_plans meal_type constraint
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - Invalid meal_type found' END AS status,
  'meal_plans.meal_type must be valid' AS test
FROM meal_plans
WHERE meal_type NOT IN ('breakfast', 'lunch', 'dinner', 'snack');

\echo ''

-- ============================================================
-- 12. VERIFY TOKEN SECURITY
-- ============================================================

\echo '12. Verifying token security...'

-- Check for expired unused tokens (cleanup needed)
SELECT
  CASE WHEN COUNT(*) < 100 THEN 'PASS ✓' ELSE 'WARNING - ' || COUNT(*) || ' expired tokens need cleanup' END AS status,
  'Expired tokens cleanup' AS test
FROM member_portal_tokens
WHERE expires_at < NOW()
AND used_at IS NULL;

-- Check token length (should be 64+ chars for security)
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - Weak tokens found' END AS status,
  'All tokens are secure (64+ chars)' AS test
FROM member_portal_tokens
WHERE LENGTH(token) < 64;

\echo ''

-- ============================================================
-- 13. MULTI-TENANCY VERIFICATION
-- ============================================================

\echo '13. Verifying multi-tenancy isolation...'

-- All workout_routines must reference valid gym_id
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - ' || COUNT(*) || ' invalid gym references' END AS status,
  'All routines reference valid gyms' AS test
FROM workout_routines wr
LEFT JOIN gyms g ON wr.gym_id = g.id
WHERE g.id IS NULL;

-- All workout_sessions must reference valid gym_id
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - ' || COUNT(*) || ' invalid gym references' END AS status,
  'All sessions reference valid gyms' AS test
FROM workout_sessions ws
LEFT JOIN gyms g ON ws.gym_id = g.id
WHERE g.id IS NULL;

-- All diet_plans must reference valid gym_id
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL ✗ - ' || COUNT(*) || ' invalid gym references' END AS status,
  'All diet plans reference valid gyms' AS test
FROM diet_plans dp
LEFT JOIN gyms g ON dp.gym_id = g.id
WHERE g.id IS NULL;

\echo ''

-- ============================================================
-- 14. PERFORMANCE INDEX USAGE TEST
-- ============================================================

\echo '14. Testing index usage (EXPLAIN ANALYZE)...'
\echo 'Note: Run these queries manually to verify index usage'
\echo ''
\echo 'Test Query 1: Member workout sessions'
\echo 'EXPLAIN ANALYZE'
\echo 'SELECT * FROM workout_sessions'
\echo 'WHERE member_id = <test-member-id>'
\echo 'ORDER BY started_at DESC LIMIT 20;'
\echo '-- Should use: idx_workout_sessions_member'
\echo ''
\echo 'Test Query 2: Member diet plans'
\echo 'EXPLAIN ANALYZE'
\echo 'SELECT * FROM diet_plans'
\echo 'WHERE member_id = <test-member-id> AND is_active = true;'
\echo '-- Should use: idx_diet_plans_member'
\echo ''
\echo 'Test Query 3: Meal plans by date'
\echo 'EXPLAIN ANALYZE'
\echo 'SELECT * FROM meal_plans'
\echo 'WHERE diet_plan_id = <test-plan-id>'
\echo 'AND scheduled_for >= NOW() - INTERVAL \'7 days\';'
\echo '-- Should use: idx_meal_plans_diet_plan_date'
\echo ''

-- ============================================================
-- 15. SUMMARY STATISTICS
-- ============================================================

\echo '========================================'
\echo 'DATABASE STATISTICS'
\echo '========================================'
\echo ''

SELECT
  'workout_routines' AS table_name,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('workout_routines')) AS total_size
FROM workout_routines
UNION ALL
SELECT
  'exercise_library',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('exercise_library'))
FROM exercise_library
UNION ALL
SELECT
  'workout_sessions',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('workout_sessions'))
FROM workout_sessions
UNION ALL
SELECT
  'session_exercises',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('session_exercises'))
FROM session_exercises
UNION ALL
SELECT
  'exercise_sets',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('exercise_sets'))
FROM exercise_sets
UNION ALL
SELECT
  'diet_plans',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('diet_plans'))
FROM diet_plans
UNION ALL
SELECT
  'meal_plans',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('meal_plans'))
FROM meal_plans
UNION ALL
SELECT
  'member_portal_tokens',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('member_portal_tokens'))
FROM member_portal_tokens;

\echo ''
\echo '========================================'
\echo 'TEST COMPLETE'
\echo '========================================'
