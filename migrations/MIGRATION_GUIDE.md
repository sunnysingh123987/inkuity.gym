# Member Portal Migration Guide

## Overview

This guide explains how to apply the member portal database migration.

---

## What Changed (V2)

### Issue with V1 (004_member_portal_schema.sql)
The original migration had an **immutability error** with the meal_plans unique constraint. PostgreSQL functions used in indexes must be marked IMMUTABLE, but timezone-dependent date conversions are not immutable.

### Solution in V2 (005_member_portal_schema_v2.sql)
Added a separate `scheduled_date DATE` column alongside `scheduled_for TIMESTAMPTZ` to avoid timezone conversion in constraints.

**Key Changes:**
1. ✅ `meal_plans` table now has both:
   - `scheduled_for TIMESTAMPTZ` - Full timestamp for scheduling
   - `scheduled_date DATE` - Date-only for uniqueness constraint
2. ✅ `diet_plans` columns renamed for consistency:
   - `daily_calories_target` → `target_calories`
   - `protein_grams_target` → `target_protein`
   - `carbs_grams_target` → `target_carbs`
   - `fat_grams_target` → `target_fat`
3. ✅ `meal_plans` columns renamed:
   - `protein_grams` → `protein`
   - `carbs_grams` → `carbs`
   - `fat_grams` → `fat`
4. ✅ `exercise_sets.weight_lbs` → `exercise_sets.weight`

---

## How to Run Migration

### Option 1: Fresh Installation (Recommended)

If you haven't run any member portal migrations yet:

```bash
# Run the V2 migration directly
psql postgresql://[YOUR_CONNECTION_STRING] -f migrations/005_member_portal_schema_v2.sql
```

### Option 2: Already Ran V1 Migration

If you already ran `004_member_portal_schema.sql` and have data:

**Step 1: Drop existing tables (WARNING: This deletes data)**
```sql
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.diet_plans CASCADE;
DROP TABLE IF EXISTS public.exercise_sets CASCADE;
DROP TABLE IF EXISTS public.session_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.routine_exercises CASCADE;
DROP TABLE IF EXISTS public.exercise_library CASCADE;
DROP TABLE IF EXISTS public.workout_routines CASCADE;
DROP TABLE IF EXISTS public.member_portal_tokens CASCADE;
```

**Step 2: Run V2 migration**
```bash
psql postgresql://[YOUR_CONNECTION_STRING] -f migrations/005_member_portal_schema_v2.sql
```

**Step 3: Seed exercises**
```sql
-- For each gym, seed the exercise library
SELECT seed_exercise_library_for_gym('<your-gym-id>');
```

---

## Verify Migration

Run these queries to verify everything is correct:

```sql
-- Check all tables exist
SELECT tablename
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
ORDER BY tablename;
-- Should return 9 rows

-- Check meal_plans has both columns
\d meal_plans
-- Should show: scheduled_for (TIMESTAMPTZ) and scheduled_date (DATE)

-- Check diet_plans columns
\d diet_plans
-- Should show: target_calories, target_protein, target_carbs, target_fat

-- Check unique constraint works
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'meal_plans'
AND indexname = 'meal_plans_unique';
-- Should show: UNIQUE (diet_plan_id, scheduled_date, meal_type)

-- Check RLS enabled
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename LIKE '%workout%' OR tablename LIKE '%diet%' OR tablename LIKE '%meal%';
-- Should return 9 rows

-- Check exercise count
SELECT gym_id, COUNT(*) as exercise_count
FROM exercise_library
GROUP BY gym_id;
-- Should show 46 exercises per gym (after seeding)
```

---

## Schema Reference

### meal_plans Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| diet_plan_id | UUID | References diet_plans |
| scheduled_for | TIMESTAMPTZ | Full timestamp (e.g., "2024-01-15 08:00:00+00") |
| scheduled_date | DATE | Date only (e.g., "2024-01-15") |
| meal_type | TEXT | breakfast, lunch, dinner, snack |
| name | TEXT | Meal name |
| calories | INTEGER | Calorie count |
| protein | INTEGER | Protein in grams |
| carbs | INTEGER | Carbs in grams |
| fat | INTEGER | Fat in grams |
| completed | BOOLEAN | Meal completion status |

**Unique Constraint:** One meal of each type per day per diet plan
```sql
UNIQUE (diet_plan_id, scheduled_date, meal_type)
```

### diet_plans Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gym_id | UUID | References gyms |
| member_id | UUID | References members |
| name | TEXT | Plan name |
| target_calories | INTEGER | Daily calorie target |
| target_protein | INTEGER | Daily protein target (grams) |
| target_carbs | INTEGER | Daily carbs target (grams) |
| target_fat | INTEGER | Daily fat target (grams) |
| is_active | BOOLEAN | Active plan flag |
| start_date | DATE | Plan start date |
| end_date | DATE | Plan end date (optional) |

---

## Code Changes Required

### Server Actions Updated

The following files have been updated to work with the new schema:

1. **lib/actions/members-portal.ts**
   - ✅ `saveMeal()` - Sets both scheduled_for and scheduled_date
   - ✅ `createDietPlan()` - Uses target_* column names
   - ✅ `getMealsForDate()` - Queries by scheduled_for range

### Example Usage

**Creating a Meal:**
```typescript
await saveMeal({
  dietPlanId: 'xxx',
  scheduledFor: '2024-01-15T08:00:00Z',  // Full timestamp
  mealType: 'breakfast',
  name: 'Oatmeal',
  calories: 300,
  protein: 20,
  carbs: 40,
  fat: 8,
});

// This will automatically set:
// - scheduled_for = '2024-01-15T08:00:00Z'
// - scheduled_date = '2024-01-15'
```

**Creating a Diet Plan:**
```typescript
await createDietPlan({
  memberId: 'xxx',
  gymId: 'xxx',
  name: 'Cutting Phase',
  targetCalories: 2000,  // ← Note: camelCase in input
  targetProtein: 180,
  targetCarbs: 150,
  targetFat: 67,
  isActive: true,
});

// Maps to database columns:
// - target_calories
// - target_protein
// - target_carbs
// - target_fat
```

---

## Troubleshooting

### Error: "relation meal_plans already exists"

**Solution:** The migration uses `CREATE TABLE IF NOT EXISTS`, so this is safe to ignore. If you need to recreate tables, drop them first.

### Error: "duplicate key value violates unique constraint"

**Cause:** Trying to insert multiple meals of the same type for the same day.

**Example:**
```sql
-- This works
INSERT INTO meal_plans (...) VALUES (..., '2024-01-15', 'breakfast', ...);

-- This fails (duplicate breakfast on same day)
INSERT INTO meal_plans (...) VALUES (..., '2024-01-15', 'breakfast', ...);
```

**Solution:** This is expected behavior. Update the existing meal instead of creating a new one.

### Error: "column protein_grams does not exist"

**Cause:** Using old column names.

**Solution:** Use new column names:
- `protein` (not `protein_grams`)
- `carbs` (not `carbs_grams`)
- `fat` (not `fat_grams`)

---

## Rollback (If Needed)

If you need to rollback:

```sql
-- Drop all member portal tables
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.diet_plans CASCADE;
DROP TABLE IF EXISTS public.exercise_sets CASCADE;
DROP TABLE IF EXISTS public.session_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.routine_exercises CASCADE;
DROP TABLE IF EXISTS public.exercise_library CASCADE;
DROP TABLE IF EXISTS public.workout_routines CASCADE;
DROP TABLE IF EXISTS public.member_portal_tokens CASCADE;

-- Drop the seed function
DROP FUNCTION IF EXISTS public.seed_exercise_library_for_gym(UUID);
```

Then you can start fresh or restore from backup.

---

## Post-Migration Checklist

- [ ] Run migration script successfully
- [ ] Verify 9 tables created
- [ ] Check RLS enabled on all tables
- [ ] Seed exercise library for each gym
- [ ] Verify exercises created (46 per gym)
- [ ] Test creating a diet plan
- [ ] Test adding a meal
- [ ] Test meal uniqueness constraint
- [ ] Run database integrity tests (`tests/database-integrity.sql`)
- [ ] Update application code if needed
- [ ] Deploy to staging
- [ ] Test full member portal flow
- [ ] Deploy to production

---

## Support

If you encounter issues:

1. Check the error message carefully
2. Review the schema reference above
3. Run verification queries
4. Check `tests/database-integrity.sql` for validation
5. Review `tests/TESTING_GUIDE.md` for testing procedures

---

**Migration File:** `migrations/005_member_portal_schema_v2.sql`
**Status:** ✅ Production Ready
**Version:** 2.0
**Date:** 2026-02-15
