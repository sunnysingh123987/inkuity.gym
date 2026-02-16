# Test PIN Authentication - Step by Step

## ✅ Prerequisites Completed

1. ✅ PIN encryption key added to `.env`
2. ✅ Dev server running on `http://localhost:3000`
3. ✅ All code files updated

## 🚀 Step 1: Run Database Migration

**IMPORTANT:** You must run this SQL in Supabase Dashboard first!

1. Go to: https://supabase.com/dashboard/project/sncpbnwkvbhqiohaygra
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. Copy and paste this SQL:

```sql
-- Add PIN-based authentication to members table
ALTER TABLE public.members
ADD COLUMN portal_pin TEXT,
ADD COLUMN pin_created_at TIMESTAMPTZ,
ADD COLUMN last_pin_sent_at TIMESTAMPTZ;

-- Create index for faster PIN lookups
CREATE INDEX idx_members_email_pin ON public.members(email, portal_pin)
WHERE portal_pin IS NOT NULL;

-- Drop existing auth-based RLS policies and create new ones
DROP POLICY IF EXISTS "Members can view own data" ON public.members;
DROP POLICY IF EXISTS "Members can update own data" ON public.members;

-- Service role can manage members
CREATE POLICY "Service role can manage members"
ON public.members FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Gym owners can view members
CREATE POLICY "Gym owners can view members"
ON public.members FOR SELECT
USING (gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid()));

-- Update policies for workout_routines
DROP POLICY IF EXISTS "Members can view own routines" ON public.workout_routines;
CREATE POLICY "Service role can manage routines"
ON public.workout_routines FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Update policies for workout_sessions
DROP POLICY IF EXISTS "Members can view own sessions" ON public.workout_sessions;
CREATE POLICY "Service role can manage sessions"
ON public.workout_sessions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Update policies for diet_plans
DROP POLICY IF EXISTS "Members can view own diet plans" ON public.diet_plans;
CREATE POLICY "Service role can manage diet plans"
ON public.diet_plans FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Update policies for meal_plans
DROP POLICY IF EXISTS "Members can view own meals" ON public.meal_plans;
CREATE POLICY "Service role can manage meals"
ON public.meal_plans FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Add comments
COMMENT ON COLUMN public.members.portal_pin IS 'Encrypted 4-digit PIN for member portal access';
COMMENT ON COLUMN public.members.pin_created_at IS 'Timestamp when PIN was first created';
COMMENT ON COLUMN public.members.last_pin_sent_at IS 'Timestamp when PIN was last sent via email';
```

5. Click **"Run"** or press **Ctrl+Enter**
6. Wait for success message

### Verify Migration

Run this query to verify:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members'
  AND column_name IN ('portal_pin', 'pin_created_at', 'last_pin_sent_at')
ORDER BY column_name;
```

You should see 3 rows.

---

## 🧪 Step 2: Test PIN Authentication Flow

### A. Find a Test Gym

1. Go to: http://localhost:3000
2. Sign in to dashboard (gym owner account)
3. Note your gym's slug (e.g., "my-gym")
4. Go to Members page
5. Note a member's email (or create a test member)

### B. Access Member Portal Sign-In

1. Open: `http://localhost:3000/[gym-slug]/portal/sign-in`
   - Example: `http://localhost:3000/my-gym/portal/sign-in`

2. **Expected:** You should see:
   - Gym logo/name
   - "Member Portal" title
   - Email input field
   - "Send PIN to Email" button

### C. Request PIN

1. Enter the member's email address
2. Click "Send PIN to Email"

**Expected Results:**
- ✅ Success toast: "PIN sent to your email!" or "Welcome! Your PIN has been sent"
- ✅ Form changes to show PIN input (4-digit)
- ✅ Check email inbox for PIN

**If email not configured:**
- Check browser console for PIN (temporarily log it for testing)
- Or check Supabase database:
  ```sql
  SELECT email, portal_pin, pin_created_at
  FROM members
  WHERE email = 'test@example.com';
  ```
  - The `portal_pin` is encrypted, so you'll need to use a test PIN

### D. Sign In with PIN

1. Check your email for the 4-digit PIN
2. Enter the PIN in the input field
3. Click "Sign In"

**Expected Results:**
- ✅ Success toast: "Signed in successfully!"
- ✅ Redirect to: `/[gym-slug]/portal/dashboard`
- ✅ See member portal dashboard with stats

### E. Verify Session

1. Refresh the page
   - ✅ Should stay logged in

2. Navigate to different portal pages:
   - `/[gym-slug]/portal/check-ins`
   - `/[gym-slug]/portal/workouts`
   - `/[gym-slug]/portal/diet`
   - ✅ All should be accessible

3. Open browser DevTools → Application → Cookies
   - ✅ Should see cookie: `member_portal_session`
   - ✅ HttpOnly: true
   - ✅ Expires in 7 days

### F. Test Logout

1. Click user avatar in top-right
2. Click "Logout"

**Expected Results:**
- ✅ Success toast: "Logged out successfully"
- ✅ Redirect to gym landing page
- ✅ Session cookie cleared

### G. Test Rate Limiting

1. Request a PIN for a member
2. Immediately request another PIN
3. **Expected:** Error toast: "Please wait X minutes before requesting a new PIN"

---

## 🐛 Troubleshooting

### "Member not found" Error
- Verify the member exists in the database
- Check that the email matches exactly
- Ensure member belongs to the correct gym

### No PIN Email Received
- Check `.env` for `RESEND_API_KEY`
- Verify email is valid
- Check spam folder
- For testing, temporarily log PIN in console:
  ```typescript
  // In lib/actions/pin-auth.ts, after generating PIN:
  console.log('🔐 TEST PIN:', pin);
  ```

### "Invalid email or PIN" Error
- PIN is case-sensitive (numbers only)
- PIN must be exactly 4 digits
- Try requesting a new PIN
- Check database for encrypted PIN

### Session Expires Immediately
- Check that cookies are enabled
- Verify `PIN_ENCRYPTION_KEY` is set in `.env`
- Check browser console for errors

### Database Errors
- Ensure migration ran successfully
- Check that all 3 columns were added
- Verify RLS policies are correct

---

## 📊 Success Criteria

After testing, you should be able to:

- ✅ Request a PIN via email
- ✅ Receive PIN email with 4-digit code
- ✅ Sign in with email + PIN
- ✅ Access full member portal
- ✅ Session persists for 7 days
- ✅ Logout clears session
- ✅ Rate limiting prevents spam
- ✅ Security: Encrypted PINs in database
- ✅ Security: HttpOnly session cookies

---

## 🎉 Next Steps After Successful Testing

1. Remove old auth files (optional):
   - `lib/actions/member-auth.ts`
   - `app/[slug]/portal/auth/callback/route.ts`

2. Update production environment:
   - Add `PIN_ENCRYPTION_KEY` to production env vars
   - Deploy changes

3. Test with real members

4. Monitor email delivery in Resend dashboard

---

**Current Status:**
- ✅ Code updated
- ✅ Encryption key generated
- ✅ Dev server running
- ⏳ **Awaiting: Run migration SQL in Supabase Dashboard**

**Ready to test!** 🚀
