# Member Portal - Comprehensive Test Plan

## Test Environment Setup

**Prerequisites:**
- Local development server running (`npm run dev`)
- Supabase instance with migrations applied
- Test gym created with:
  - Gym name: "Test Fitness Center"
  - Gym slug: "test-gym"
  - Owner account created
- Test member accounts:
  - Member A: `membera@test.com`
  - Member B: `memberb@test.com` (same gym)
  - Member C: `memberc@test.com` (different gym)

---

## Phase 8: Testing Checklist

### 1. End-to-End Flow Testing

#### 1.1 Magic Link Authentication Flow ✅

**Test Case: Request Portal Access**
```
Steps:
1. Navigate to http://localhost:3000/test-gym/portal/request-access
2. Enter email: membera@test.com
3. Click "Send Magic Link"

Expected Results:
- ✅ Success toast appears: "Magic link sent!"
- ✅ Email received with magic link button
- ✅ Token created in member_portal_tokens table
- ✅ Token expires_at is 15 minutes from now
- ✅ Rate limit: Can only request 3 links per hour
```

**Test Case: Use Magic Link**
```
Steps:
1. Click magic link in email
2. Should redirect to portal dashboard

Expected Results:
- ✅ Token marked as used (used_at populated)
- ✅ Session cookie created (24-hour expiry)
- ✅ Redirected to dashboard
- ✅ Can access all portal pages

Security Tests:
- ✅ Expired token (>15 min) shows error
- ✅ Used token (clicked twice) shows error
- ✅ Invalid token shows error
- ✅ Session cookie is HttpOnly, Secure, SameSite=Strict
```

#### 1.2 Workout Routine Creation Flow ✅

**Test Case: Create Chest Day Routine**
```
Steps:
1. Login as Member A
2. Navigate to /test-gym/portal/workouts
3. Click "Create Workout Routine"
4. Enter:
   - Name: "Chest Day"
   - Description: "Heavy chest workout"
5. Click "Add Exercises"
6. Select exercises:
   - Bench Press (4 sets, 8-10 reps, 90s rest)
   - Incline Press (3 sets, 10-12 reps, 60s rest)
   - Cable Flyes (3 sets, 12-15 reps, 45s rest)
7. Click "Create Routine"

Expected Results:
- ✅ Routine created in workout_routines table
- ✅ 3 entries in routine_exercises table
- ✅ Exercises ordered correctly (order_index)
- ✅ Redirected to routines list
- ✅ "Chest Day" appears in active routines
```

**Database Verification:**
```sql
-- Check routine created
SELECT * FROM workout_routines
WHERE member_id = '<member-a-id>'
AND name = 'Chest Day';

-- Check exercises linked
SELECT re.*, el.name
FROM routine_exercises re
JOIN exercise_library el ON re.exercise_id = el.id
WHERE routine_id = '<routine-id>'
ORDER BY order_index;
```

#### 1.3 Workout Session Flow ✅

**Test Case: Complete Full Workout**
```
Steps:
1. From routines list, click "Start Workout" on "Chest Day"
2. Confirm start → redirected to active session
3. Session timer starts counting

Exercise 1: Bench Press
- Set 1: 135 lbs × 10 reps → Click "Log Set"
- Set 2: 135 lbs × 10 reps → Click "Log Set"
- Set 3: 135 lbs × 8 reps → Click "Log Set"
- Set 4: 135 lbs × 8 reps → Click "Log Set"
- Click "Complete Exercise"

Exercise 2: Incline Press
- Set 1: 115 lbs × 10 reps
- Set 2: 115 lbs × 9 reps
- Set 3: 115 lbs × 8 reps
- Click "Complete Exercise"

Exercise 3: Cable Flyes
- Set 1: 40 lbs × 15 reps
- Set 2: 40 lbs × 14 reps
- Set 3: 40 lbs × 12 reps
- Click "Complete Exercise"

4. Click "Finish Workout"
5. View completed session

Expected Results:
- ✅ Session created with status 'in_progress'
- ✅ Timer shows elapsed time (updates every second)
- ✅ Progress bar updates (0/3 → 1/3 → 2/3 → 3/3)
- ✅ All sets logged to exercise_sets table
- ✅ Completed exercises turn green
- ✅ Status changes to 'completed'
- ✅ Duration calculated correctly
- ✅ Total volume calculated: (135×10×4) + (115×10×3) + (40×15×3) = 9,750 lbs
- ✅ Session appears in history
```

**Database Verification:**
```sql
-- Check session completed
SELECT * FROM workout_sessions
WHERE member_id = '<member-a-id>'
AND status = 'completed'
ORDER BY started_at DESC LIMIT 1;

-- Check all sets logged
SELECT se.*, es.*
FROM session_exercises se
JOIN exercise_sets es ON es.session_exercise_id = se.id
WHERE session_id = '<session-id>'
ORDER BY se.order_index, es.set_number;

-- Verify total volume
SELECT
  SUM(weight_lbs * reps) as total_volume
FROM exercise_sets
WHERE session_exercise_id IN (
  SELECT id FROM session_exercises
  WHERE session_id = '<session-id>'
);
```

#### 1.4 Diet Plan Flow ✅

**Test Case: Create and Track Diet Plan**
```
Steps:
1. Navigate to /test-gym/portal/diet
2. Click "Create Diet Plan"
3. Enter:
   - Name: "Cutting Phase"
   - Description: "2000 calorie deficit"
   - Daily Calories: 2000
   - Protein: 180g
   - Carbs: 150g
   - Fat: 67g
   - Start Date: Today
   - Active: Yes
4. Click "Create Plan"

5. Click "View Meals"
6. Click "+ breakfast" for today
7. Add meal:
   - Name: "Oatmeal with Protein"
   - Calories: 450
   - Protein: 40g
   - Carbs: 50g
   - Fat: 12g
8. Click "Add Meal"

9. Click meal to mark complete

Expected Results:
- ✅ Diet plan created with is_active = true
- ✅ Macro percentages calculated correctly
  - Protein: 180g × 4 = 720 cal (36%)
  - Carbs: 150g × 4 = 600 cal (30%)
  - Fat: 67g × 9 = 603 cal (30%)
  - Total: 1,923 cal (close to 2000 target)
- ✅ Meal created for today
- ✅ Nutrition tracker updates:
  - Calories: 450/2000 (22.5%)
  - Protein: 40/180g (22%)
- ✅ Progress bars show correct percentages
- ✅ Meal marked as completed
```

**Database Verification:**
```sql
-- Check diet plan
SELECT * FROM diet_plans
WHERE member_id = '<member-a-id>'
AND is_active = true;

-- Check meals for today
SELECT * FROM meal_plans
WHERE diet_plan_id = '<plan-id>'
AND DATE(scheduled_for) = CURRENT_DATE;
```

---

### 2. Security Testing

#### 2.1 Cross-Member Isolation ✅

**Test Case: Member A Cannot See Member B's Data**
```
Steps:
1. Login as Member A, create workout routine "A's Routine"
2. Note the routine ID from database
3. Logout
4. Login as Member B (same gym)
5. Try to access: /test-gym/portal/workouts/<routine-a-id>
6. Try to view Member A's sessions via direct ID

Expected Results:
- ✅ Member B redirected or sees empty state
- ✅ No data from Member A visible
- ✅ Database queries filtered by member_id
```

**Database Test:**
```sql
-- This should return 0 rows when run with Member B's context
SELECT * FROM workout_routines
WHERE id = '<member-a-routine-id>'
AND member_id = '<member-b-id>';
```

#### 2.2 Cross-Gym Isolation ✅

**Test Case: Member C (Different Gym) Cannot Access Data**
```
Steps:
1. Create second gym: "Another Gym" (slug: another-gym)
2. Create Member C in Another Gym
3. Login as Member C
4. Try to access: /test-gym/portal/workouts
5. Try direct access to Member A's routine ID

Expected Results:
- ✅ Member C cannot access test-gym portal
- ✅ Redirected to request-access or error
- ✅ RLS policies prevent data leakage
```

**Database Test:**
```sql
-- Verify RLS policies active
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'workout_routines',
  'workout_sessions',
  'diet_plans'
);

-- Test cross-gym isolation
SELECT * FROM workout_routines
WHERE gym_id != '<member-c-gym-id>'
LIMIT 1;
-- Should be blocked by RLS if using member role
```

#### 2.3 Gym Owner Access ✅

**Test Case: Gym Owner Can View Member Data**
```
Steps:
1. Login as gym owner
2. Navigate to dashboard
3. Go to Members → View Member A
4. Should see workout/diet tabs (if implemented)

Expected Results:
- ✅ Owner can query all routines for gym
- ✅ Owner can view member sessions
- ✅ RLS policy "Owners can view gym..." works
```

**Database Test:**
```sql
-- As gym owner (auth.uid = owner_id)
SELECT wr.*, m.full_name
FROM workout_routines wr
JOIN members m ON wr.member_id = m.id
WHERE wr.gym_id = '<gym-id>';
-- Should return all members' routines
```

#### 2.4 Magic Link Security ✅

**Test Case: Token Security**
```
Tests:
1. Token Expiration
   - Create token, wait 16 minutes
   - ✅ Link should be rejected as expired

2. Token Reuse
   - Use magic link once successfully
   - ✅ Try to use same link again → rejected

3. Rate Limiting
   - Request magic link 4 times within 1 hour
   - ✅ 4th request should be rejected

4. Token Strength
   - ✅ Token should be 32+ bytes (64 hex chars)
   - ✅ Cryptographically secure (crypto.randomBytes)
```

**Database Test:**
```sql
-- Check for expired unused tokens
SELECT * FROM member_portal_tokens
WHERE expires_at < NOW()
AND used_at IS NULL;

-- Check rate limit (max 3 per hour per member)
SELECT COUNT(*)
FROM member_portal_tokens
WHERE member_id = '<member-id>'
AND created_at > NOW() - INTERVAL '1 hour';
```

---

### 3. Performance Testing

#### 3.1 Query Performance ✅

**Test Case: Dashboard Load Time**
```
Test with large dataset:
- 1000+ check-ins for Member A
- 50 workout routines
- 100 completed sessions
- 30-day diet plan with all meals

Measure:
- Dashboard load time < 1 second
- Check-in history (90 days) < 2 seconds
- Session history < 500ms

Tools:
- Browser DevTools Network tab
- Supabase slow query log
```

**Index Verification:**
```sql
-- Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'workout_routines',
  'workout_sessions',
  'diet_plans',
  'meal_plans',
  'member_portal_tokens'
);

-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM workout_sessions
WHERE member_id = '<member-id>'
ORDER BY started_at DESC
LIMIT 20;
-- Should use idx_workout_sessions_member
```

#### 3.2 Large Dataset Testing ✅

**Test Case: 1000 Check-Ins Performance**
```
Setup:
1. Insert 1000 check-ins for Member A over past year
2. Load check-in history page
3. Test calendar view
4. Export to CSV

Expected Results:
- ✅ Table pagination works smoothly
- ✅ Calendar view loads within 2 seconds
- ✅ CSV export completes within 5 seconds
- ✅ No memory issues in browser
```

**Database Script:**
```sql
-- Generate test check-ins
INSERT INTO check_ins (gym_id, member_id, check_in_at)
SELECT
  '<gym-id>',
  '<member-id>',
  NOW() - (n || ' days')::interval
FROM generate_series(1, 1000) n;
```

#### 3.3 Concurrent Session Testing ✅

**Test Case: Multiple Active Sessions**
```
Scenario:
- Member A: Active workout session
- Member B: Active workout session (same gym)
- Member C: Active workout session (different gym)

Expected Results:
- ✅ Each member sees only their own active session
- ✅ No session interference
- ✅ Set logging happens independently
- ✅ No race conditions
```

---

### 4. Edge Cases & Error Handling

#### 4.1 Incomplete Session Recovery ✅

**Test Case: Browser Closed During Workout**
```
Steps:
1. Start workout session
2. Log 2 sets of first exercise
3. Close browser completely
4. Reopen browser after 5 minutes
5. Login and navigate to portal

Expected Results:
- ✅ Session still shows as 'in_progress'
- ✅ Logged sets are preserved
- ✅ Can resume from where left off
- ✅ Option to abandon session if needed
```

#### 4.2 Empty States ✅

**Test Case: New Member Experience**
```
Tests:
- ✅ No check-ins → Empty state with helpful message
- ✅ No routines → "Create Your First Routine" CTA
- ✅ No active session → "Start a Workout" button
- ✅ No diet plan → "Create Diet Plan" CTA
- ✅ All empty states have clear call-to-action
```

#### 4.3 Validation & Constraints ✅

**Test Case: Data Validation**
```
Tests:
1. Duplicate routine name (same member)
   - ✅ Unique constraint prevents duplicate

2. Negative weight/reps
   - ✅ Frontend validation prevents negative numbers

3. Future check-in date
   - ✅ Validation prevents future dates

4. Meal without name
   - ✅ Required field validation

5. Diet plan with mismatched macros
   - ✅ Warning shown (not blocked)
```

#### 4.4 Streak Calculation Edge Cases ✅

**Test Case: Streak Boundary Conditions**
```
Scenarios:
1. Check-in at 11:59 PM, next at 12:01 AM
   - ✅ Streak continues (consecutive days)

2. Skip exactly 1 day
   - ✅ Streak resets to 0

3. Multiple check-ins same day
   - ✅ Counts as 1 day for streak

4. First ever check-in
   - ✅ Streak = 1
```

**Database Test:**
```sql
-- Test streak calculation function
SELECT calculate_member_streak('<member-id>');
```

---

### 5. Integration Testing

#### 5.1 Check-In → Portal Flow ✅

**Test Case: Check-In Integration**
```
Steps:
1. Navigate to gym landing page
2. Check in with email
3. See success message
4. Click "Access Member Portal" button
5. Request magic link
6. Login via magic link

Expected Results:
- ✅ Seamless flow from check-in to portal
- ✅ Button visible after check-in
- ✅ Email includes portal link
- ✅ Auto-populate email in portal access form
```

#### 5.2 Email Notifications ✅

**Test Case: Check-In Email with Portal Link**
```
Steps:
1. Check in at gym
2. Check email inbox

Expected Results:
- ✅ Check-in confirmation received
- ✅ Email includes "Access Member Portal" button
- ✅ Button links to /test-gym/portal/request-access
- ✅ Email styling matches brand
- ✅ Email sent from correct address
```

#### 5.3 Settings & Preferences ✅

**Test Case: Notification Preferences**
```
Steps:
1. Navigate to /test-gym/portal/settings
2. Disable "Check-in Confirmations"
3. Save preferences
4. Check in at gym

Expected Results:
- ✅ Preferences saved to member.metadata
- ✅ No check-in email sent (preferences respected)
- ✅ Other notifications still work
```

---

## Testing Checklist Summary

### Authentication & Security
- [ ] Magic link generation works
- [ ] Magic link expiration (15 min) enforced
- [ ] Token one-time use enforced
- [ ] Rate limiting (3/hour) works
- [ ] Session cookies secure (HttpOnly, Secure, SameSite)
- [ ] Cross-member data isolation
- [ ] Cross-gym data isolation
- [ ] Gym owner can view member data
- [ ] RLS policies active on all tables

### Workout Features
- [ ] Create workout routine
- [ ] Add/remove exercises from routine
- [ ] Start workout session
- [ ] Log exercise sets (weight/reps)
- [ ] Complete exercise
- [ ] Complete workout
- [ ] View session history
- [ ] View session details
- [ ] Calculate total volume
- [ ] Session timer accuracy

### Diet Features
- [ ] Create diet plan
- [ ] Set macro targets
- [ ] Add meals to calendar
- [ ] Toggle meal completion
- [ ] Nutrition tracker updates
- [ ] Weekly meal view
- [ ] Macro percentage calculations
- [ ] Multi-week planning

### UI/UX
- [ ] All pages load < 1 second
- [ ] Mobile responsive (375px-1920px)
- [ ] Empty states helpful
- [ ] Error messages clear
- [ ] Toast notifications work
- [ ] Loading states show
- [ ] Progress bars accurate

### Performance
- [ ] Dashboard with 1000+ check-ins loads fast
- [ ] Index usage verified
- [ ] Large CSV exports work
- [ ] No memory leaks
- [ ] Concurrent sessions work

### Integration
- [ ] Check-in → Portal flow smooth
- [ ] Portal link in check-in email
- [ ] Settings save correctly
- [ ] Gym owner dashboard integration

---

## Known Issues / Future Enhancements

**Not Implemented (Out of Scope):**
- Personal records tracking (PR detection)
- Workout frequency charts
- Goal progress indicators
- Rest timer during active sessions
- Exercise video demonstrations
- Social features (share workouts)
- Mobile app
- Offline support

**Migration Notes:**
- Exercise library must be seeded per gym using: `SELECT seed_exercise_library_for_gym('<gym-id>');`
- Existing members will have zero check-ins/workouts until they use portal
- No data migration needed from previous system

---

## Test Sign-Off

**Tester:** _________________
**Date:** _________________
**Pass/Fail:** _________________
**Notes:** _________________

