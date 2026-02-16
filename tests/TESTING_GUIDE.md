# Member Portal Testing Guide

Quick guide to running Phase 8 tests for the member portal.

---

## Prerequisites

1. **Apply Database Migration:**
   ```bash
   # Connect to your Supabase database
   psql postgresql://[YOUR_CONNECTION_STRING]

   # Run the migration
   \i migrations/004_member_portal_schema.sql
   ```

2. **Seed Exercise Library:**
   ```sql
   -- For each gym in your system, seed exercises
   SELECT seed_exercise_library_for_gym('<gym-id>');
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## Quick Test Checklist

### 1. Database Integrity (5 minutes)

Run the database integrity tests:

```bash
psql postgresql://[YOUR_CONNECTION_STRING] -f tests/database-integrity.sql
```

**Expected Output:**
- All checks should show `PASS ✓`
- 9 tables created
- RLS enabled on all tables
- 10+ indexes created
- All constraints verified

**Fix if failed:**
- Re-run migration 004
- Check for SQL errors in console
- Verify Supabase connection

---

### 2. Magic Link Auth (10 minutes)

**Quick Test:**
1. Go to `http://localhost:3000/[gym-slug]/portal/request-access`
2. Enter test email
3. Check email inbox for magic link
4. Click link → should redirect to dashboard
5. Try clicking link again → should fail (one-time use)

**Verify in Database:**
```sql
-- Check token created
SELECT * FROM member_portal_tokens
WHERE member_id = (SELECT id FROM members WHERE email = 'test@example.com')
ORDER BY created_at DESC LIMIT 1;

-- Check token is marked as used
-- used_at should be populated after clicking link
```

**Pass Criteria:**
- ✅ Email received within 10 seconds
- ✅ Link works on first click
- ✅ Link fails on second click
- ✅ Token expires after 15 minutes

---

### 3. Workout Flow (15 minutes)

**Quick Test:**
1. Login to portal
2. Create routine: "Test Workout" with 3 exercises
3. Start workout
4. Log sets for each exercise (2-3 sets each)
5. Complete workout
6. View session details

**Verify in Database:**
```sql
-- Check routine created
SELECT * FROM workout_routines
WHERE name = 'Test Workout';

-- Check session created and completed
SELECT * FROM workout_sessions
WHERE routine_id = '<routine-id>'
AND status = 'completed';

-- Check sets logged
SELECT COUNT(*) FROM exercise_sets
WHERE session_exercise_id IN (
  SELECT id FROM session_exercises
  WHERE session_id = '<session-id>'
);
```

**Pass Criteria:**
- ✅ Routine saves with all exercises
- ✅ Session timer starts
- ✅ Sets log successfully
- ✅ Progress bar updates
- ✅ Session completes with duration
- ✅ Total volume calculated correctly

---

### 4. Diet Plan Flow (10 minutes)

**Quick Test:**
1. Create diet plan: 2000 cal, 180p/150c/67f
2. Add 3 meals for today
3. Mark meals as complete
4. Check nutrition tracker updates

**Verify in Database:**
```sql
-- Check diet plan created
SELECT * FROM diet_plans
WHERE name LIKE '%test%'
AND is_active = true;

-- Check meals created
SELECT * FROM meal_plans
WHERE diet_plan_id = '<plan-id>'
AND DATE(scheduled_for) = CURRENT_DATE;

-- Check completion status
SELECT meal_type, completed
FROM meal_plans
WHERE diet_plan_id = '<plan-id>'
AND DATE(scheduled_for) = CURRENT_DATE;
```

**Pass Criteria:**
- ✅ Plan saves with correct macros
- ✅ Macro percentages calculated
- ✅ Meals add to calendar
- ✅ Completion toggles work
- ✅ Nutrition tracker updates

---

### 5. Security Tests (15 minutes)

**Test 1: Cross-Member Isolation**
```
1. Login as Member A
2. Create workout routine, note the ID
3. Logout
4. Login as Member B (same gym)
5. Try to access Member A's routine via direct URL
```
**Expected:** Redirected or empty state (no data visible)

**Test 2: Cross-Gym Isolation**
```
1. Create second test gym
2. Create Member C in second gym
3. Try to access first gym's portal with Member C
```
**Expected:** Cannot access, redirected to request-access

**Test 3: RLS Verification**
```sql
-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('workout_routines', 'workout_sessions', 'diet_plans');
```
**Expected:** Service role and owner policies exist

**Pass Criteria:**
- ✅ Members cannot see each other's data
- ✅ Gyms are isolated
- ✅ RLS policies active
- ✅ Owners can view member data

---

### 6. Performance Tests (Optional, 30 minutes)

**Large Dataset Test:**
1. Insert 1000 test check-ins
2. Create 50 workout routines
3. Create 100 workout sessions
4. Load dashboard and measure:
   - Dashboard load time
   - Check-in history load time
   - Session history load time

**Quick Script:**
```sql
-- Generate 1000 check-ins
INSERT INTO check_ins (gym_id, member_id, check_in_at)
SELECT
  '<gym-id>',
  '<member-id>',
  NOW() - (n || ' days')::interval
FROM generate_series(1, 1000) n;
```

**Pass Criteria:**
- ✅ Dashboard loads < 1 second
- ✅ History pages load < 2 seconds
- ✅ No UI lag or freezing
- ✅ CSV export works

---

## Common Issues & Fixes

### Issue: Magic link emails not sending

**Fix:**
1. Check Resend API key in `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxx
   ```
2. Verify email template renders:
   ```bash
   npm run email:dev
   ```
3. Check Resend dashboard for errors

### Issue: RLS blocking portal queries

**Fix:**
1. Verify using service role client:
   ```typescript
   const supabase = createAdminSupabaseClient();
   ```
2. Check queries filter by `member_id` AND `gym_id`
3. Review RLS policies in Supabase dashboard

### Issue: Workout session not creating

**Fix:**
1. Check exercise library seeded:
   ```sql
   SELECT COUNT(*) FROM exercise_library WHERE gym_id = '<gym-id>';
   ```
2. If 0, run seed function:
   ```sql
   SELECT seed_exercise_library_for_gym('<gym-id>');
   ```

### Issue: Meal calendar not showing meals

**Fix:**
1. Check `scheduled_for` column exists (not `date`):
   ```sql
   \d meal_plans
   ```
2. If `date` column exists, migration needs to be updated
3. Re-run migration 004

---

## Automated Testing (Future)

**Setup Jest/Vitest:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Example Unit Test:**
```typescript
// lib/actions/__tests__/members-portal.test.ts
describe('getMemberCheckInHistory', () => {
  it('filters by member_id and gym_id', async () => {
    const result = await getMemberCheckInHistory('member-1', 'gym-1');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

**Example Integration Test:**
```typescript
// app/__tests__/workout-session.test.tsx
describe('Workout Session Flow', () => {
  it('completes full workout', async () => {
    // Test start session
    // Test log sets
    // Test complete workout
    // Verify database state
  });
});
```

---

## Test Report Template

**Test Session:** [Date]
**Tester:** [Name]
**Environment:** [Local/Staging/Production]

### Results Summary

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Database Integrity | 15 | | | |
| Authentication | 5 | | | |
| Workout Features | 10 | | | |
| Diet Features | 8 | | | |
| Security | 5 | | | |
| Performance | 4 | | | |
| **Total** | **47** | **0** | **0** | |

### Issues Found

1. **Issue:** [Description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** [...]
   - **Expected:** [...]
   - **Actual:** [...]
   - **Fix:** [...]

### Sign-Off

- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for deployment

**Approved By:** _______________
**Date:** _______________

---

## Next Steps After Testing

1. **Deploy Migration:**
   - Run migration on staging
   - Seed exercise library
   - Test on staging environment

2. **User Acceptance Testing:**
   - Real members test portal
   - Gather feedback
   - Iterate on UX

3. **Monitor Production:**
   - Watch error logs
   - Track API performance
   - Monitor database load

4. **Future Enhancements:**
   - Personal records tracking
   - Workout charts/analytics
   - Mobile app development
   - Social features
