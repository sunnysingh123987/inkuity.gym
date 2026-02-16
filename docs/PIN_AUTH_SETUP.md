# PIN-Based Authentication Setup Guide

## Overview

The member portal now uses a **simple PIN-based authentication system**:
- Member enters email
- System sends 4-digit PIN via email
- Member enters PIN to sign in
- Session lasts 7 days

**No passwords. No OAuth. Just email + PIN.** ✅

---

## What Changed

### Files Created
1. **`migrations/007_add_pin_auth.sql`** - Database migration
   - Adds `portal_pin`, `pin_created_at`, `last_pin_sent_at` to members table
   - Updates RLS policies for service role access

2. **`lib/actions/pin-auth.ts`** - Authentication logic
   - `requestPortalAccess()` - Generate and send PIN
   - `signInWithPIN()` - Verify PIN and create session
   - `getAuthenticatedMember()` - Get current user
   - `signOut()` - Clear session

3. **`lib/email/templates/pin-email.tsx`** - PIN email template
   - Beautiful email with 4-digit PIN
   - Security reminder
   - Portal features for new users

### Files Modified
1. **`app/[slug]/portal/sign-in/page.tsx`** - Updated to PIN flow
   - Step 1: Enter email → Request PIN
   - Step 2: Enter PIN → Sign in
   - Resend PIN button

2. **`app/[slug]/portal/(portal)/layout.tsx`** - Uses new auth
   - Import from `pin-auth` instead of `member-auth`

3. **`components/member-portal/layout/portal-header.tsx`** - Uses new signOut
   - Import from `pin-auth` instead of `member-auth`

4. **`lib/email/notifications.ts`** - Added PIN email function
   - `sendPINEmail()` function

5. **`lib/email/templates/checkin-confirmation.tsx`** - Updated link
   - Portal button now points to `/sign-in`

6. **`docs/AUTHENTICATION_FLOW.md`** - Updated documentation
   - Complete PIN-based flow documentation

---

## Setup Steps

### 1. Run Database Migration

```bash
# Connect to your Supabase project
supabase migration new add_pin_auth

# Copy the contents of migrations/007_add_pin_auth.sql
# Then run:
supabase db push
```

Or manually run the SQL in Supabase Dashboard → SQL Editor.

### 2. Add Environment Variable

Add to `.env.local`:

```bash
# PIN encryption key (use a strong random 32-character string)
PIN_ENCRYPTION_KEY=your-secret-32-character-key-here-please-change-this
```

Generate a secure key:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any password generator for a 32+ character string
```

### 3. Test the Flow

1. **Check in a member** (if not already done)
   - Go to gym landing page
   - Scan QR code or enter email to check in

2. **Access portal**
   - Click "Access Member Portal" button
   - Or go to `/{gym-slug}/portal/sign-in`

3. **Request PIN**
   - Enter member's email
   - Click "Send PIN to Email"
   - Check email inbox

4. **Sign in**
   - Enter 4-digit PIN from email
   - Click "Sign In"
   - Should redirect to dashboard

5. **Test session**
   - Refresh page (should stay logged in)
   - Navigate to other portal pages
   - Logout and verify session cleared

---

## Security Features

### PIN Encryption
- All PINs encrypted with AES-256-CBC
- Encryption key from environment variable
- Stored as `iv:encrypted` format in database

### Rate Limiting
- Can only request new PIN every 2 minutes
- Prevents PIN spam/brute force
- Tracked via `last_pin_sent_at` timestamp

### Session Security
- HttpOnly cookies (not accessible via JavaScript)
- Secure flag in production
- SameSite=Strict (prevents CSRF)
- 7-day expiration
- Encrypted session tokens

### Member Verification
- Email must match existing member record
- Member must belong to the specific gym
- PIN only works for the member it was generated for

---

## How It Works

### PIN Generation
```typescript
// Generates random 4-digit number
function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
```

### PIN Storage
```typescript
// Encrypted before storing in database
const encryptedPIN = encryptPIN(pin); // "abc123:def456789..."
await supabase
  .from('members')
  .update({ portal_pin: encryptedPIN })
  .eq('id', memberId);
```

### PIN Verification
```typescript
// Decrypt and compare
const storedPIN = member.portal_pin;
const decryptedPIN = decryptPIN(storedPIN); // "1234"
if (decryptedPIN === enteredPIN) {
  // Valid PIN
}
```

### Session Management
```typescript
// Create encrypted session token
const sessionToken = createSessionToken(memberId, gymId);

// Store in HTTP-only cookie
cookies().set('member_portal_session', sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60, // 7 days
});
```

---

## User Experience

### Email Flow
1. Member clicks "Access Member Portal"
2. Enters email address
3. Receives email within seconds:
   ```
   Your {Gym Name} Portal PIN

   [Large 4-digit PIN display]

   Use this PIN along with your email to sign in.
   ```
4. Returns to portal page
5. Enters PIN
6. Signed in for 7 days

### Returning User
1. Goes to portal
2. Enters email
3. Gets NEW PIN via email
4. Enters new PIN
5. Signed in again

---

## Troubleshooting

### "Member not found" error
- Member must check in at gym first
- Email must match exactly (case-insensitive)
- Member must belong to the correct gym

### "Wait X minutes before requesting new PIN"
- Rate limiting active (2-minute cooldown)
- Wait the specified time
- Prevents PIN spam

### PIN email not received
- Check spam folder
- Verify RESEND_API_KEY is set
- Check Resend dashboard for delivery logs
- Verify member email is valid

### "Invalid email or PIN"
- PIN is case-sensitive (numbers only)
- PIN must be exactly 4 digits
- PIN expires when new one is requested
- Check for typos

### Session expires too quickly
- Default is 7 days
- Adjust `SESSION_DURATION` in `pin-auth.ts`:
  ```typescript
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // Change here
  ```

---

## Migration from Previous Auth Systems

### From Google OAuth / Email-Password
The system automatically works with existing members:
- `auth_user_id` column is ignored (not removed)
- Members can still be identified by email
- PIN system works independently

### From Magic Links
The migration removes old tables:
- `member_portal_tokens` table dropped (if existed)
- Session management now uses encrypted cookies
- No database queries for token validation

---

## Files You Can Remove (Optional)

These files are no longer used with PIN auth:

1. **`lib/actions/member-auth.ts`** - Old Supabase Auth actions
2. **`app/[slug]/portal/auth/callback/route.ts`** - OAuth callback
3. **`lib/email/templates/magic-link-email.tsx`** - Old magic link email
4. **`docs/GOOGLE_OAUTH_SETUP.md`** - OAuth setup guide (obsolete)

**Note:** Keeping these files won't hurt anything, but they're not used.

---

## Environment Variables Reference

Required:
```bash
PIN_ENCRYPTION_KEY=your-secret-key-minimum-32-characters
NEXT_PUBLIC_APP_URL=https://yourdomain.com
RESEND_API_KEY=re_xxxxxxxxxxxxx
NOTIFICATION_FROM_EMAIL=noreply@yourdomain.com
```

Optional (already set):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Next Steps

1. ✅ Run migration `007_add_pin_auth.sql`
2. ✅ Add `PIN_ENCRYPTION_KEY` to `.env.local`
3. ✅ Test the complete flow
4. ✅ Update production environment variables
5. ✅ Deploy changes
6. ⚠️ Monitor email delivery (Resend dashboard)
7. ⚠️ Monitor PIN requests for abuse

---

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check server logs for detailed errors
3. Verify all environment variables are set
4. Check database migration was successful
5. Test with a different member/email

---

**Status:** ✅ Ready for Testing

**Last Updated:** 2026-02-15
