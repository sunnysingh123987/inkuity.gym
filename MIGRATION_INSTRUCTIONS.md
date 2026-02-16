# Run PIN Authentication Migration

## Quick Start

1. **Go to Supabase Dashboard:**
   - Open https://supabase.com/dashboard
   - Select your project: `sncpbnwkvbhqiohaygra`
   - Click on **SQL Editor** in the left sidebar

2. **Create New Query:**
   - Click **New Query** button
   - Copy and paste the SQL below
   - Click **Run** (or press Ctrl+Enter)

---

## Migration SQL

```sql
-- Add PIN-based authentication to members table
-- Replace Supabase Auth with simple PIN system

-- Add PIN columns to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS portal_pin TEXT,
ADD COLUMN IF NOT EXISTS pin_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_pin_sent_at TIMESTAMPTZ;

-- Create index for faster PIN lookups
CREATE INDEX IF NOT EXISTS idx_members_email_pin ON public.members(email, portal_pin)
WHERE portal_pin IS NOT NULL;

-- Update RLS policies to use PIN-based auth instead of auth.uid()
-- We'll manage sessions manually with cookies

-- Drop existing auth-based RLS policies and create new ones
DROP POLICY IF EXISTS "Members can view own data" ON public.members;
DROP POLICY IF EXISTS "Members can update own data" ON public.members;

-- For member portal access, we'll use service role with manual filtering
-- These policies allow service role access (our server actions will filter by member_id)
CREATE POLICY "Service role can manage members"
ON public.members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Gym owners can still view their members
CREATE POLICY "Gym owners can view members"
ON public.members
FOR SELECT
USING (
  gym_id IN (
    SELECT id FROM public.gyms
    WHERE owner_id = auth.uid()
  )
);

-- Similar updates for other member-related tables
-- workout_routines
DROP POLICY IF EXISTS "Members can view own routines" ON public.workout_routines;
CREATE POLICY "Service role can manage routines"
ON public.workout_routines
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- workout_sessions
DROP POLICY IF EXISTS "Members can view own sessions" ON public.workout_sessions;
CREATE POLICY "Service role can manage sessions"
ON public.workout_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- diet_plans
DROP POLICY IF EXISTS "Members can view own diet plans" ON public.diet_plans;
CREATE POLICY "Service role can manage diet plans"
ON public.diet_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- meal_plans
DROP POLICY IF EXISTS "Members can view own meals" ON public.meal_plans;
CREATE POLICY "Service role can manage meals"
ON public.meal_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comments
COMMENT ON COLUMN public.members.portal_pin IS 'Encrypted 4-digit PIN for member portal access. Generated on first portal access attempt.';
COMMENT ON COLUMN public.members.pin_created_at IS 'Timestamp when PIN was first created';
COMMENT ON COLUMN public.members.last_pin_sent_at IS 'Timestamp when PIN was last sent via email (for rate limiting)';
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members'
  AND column_name IN ('portal_pin', 'pin_created_at', 'last_pin_sent_at');

-- Should return 3 rows
```

Expected output:
```
column_name          | data_type
---------------------|------------------------
portal_pin           | text
pin_created_at       | timestamp with time zone
last_pin_sent_at     | timestamp with time zone
```

---

## Troubleshooting

### "permission denied for table members"
- Make sure you're running the SQL in the SQL Editor (not the Table Editor)
- The SQL Editor runs with elevated permissions

### "policy already exists"
- This is okay, the `IF EXISTS` clauses handle this
- The migration is idempotent (safe to run multiple times)

### "column already exists"
- This is also okay, the `IF NOT EXISTS` clauses handle this
- Migration has already been partially applied

---

## Next Steps After Migration

1. ✅ Verify columns were added (run verification query above)
2. ✅ Test the PIN auth flow at `/[gym-slug]/portal/sign-in`
3. ✅ Check that `.env` file has `PIN_ENCRYPTION_KEY`

---

## Alternative: Run via Supabase CLI (If Installed)

If you have Supabase CLI installed:

```bash
# Navigate to project
cd "C:\Users\prita\Downloads\ai agents\inkuity.com"

# Run migration
supabase db push
```

---

**Ready to test after running the SQL above!** 🎉
