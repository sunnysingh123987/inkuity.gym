# Authentication Flow - PIN-Based System

## Overview

The member portal uses **PIN-based authentication** for simple, secure access.

**No passwords. No OAuth. Just email + PIN.** ✅

---

## Authentication Flow

```
Member checks in at gym
         ↓
Member record created (email stored)
         ↓
Member clicks "Access Member Portal"
         ↓
Redirected to: /{gym-slug}/portal/sign-in
         ↓
┌────────────────────────────────────────┐
│        Step 1: Enter Email              │
│                                         │
│  Member enters email address            │
│  System generates 4-digit PIN           │
│  PIN sent to email (encrypted in DB)   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│        Step 2: Enter PIN                │
│                                         │
│  Member checks email                    │
│  Enters 4-digit PIN                     │
│  System validates email + PIN           │
└────────────────────────────────────────┘
         ↓
   Authentication Success
         ↓
   Session cookie created (7 days)
         ↓
   Redirected to: /{gym-slug}/portal/dashboard
         ↓
   ✅ Member has access to portal
```

---

## How It Works

### First-Time Access
1. Member enters email at sign-in page
2. System checks if member exists in gym
3. Generates random 4-digit PIN
4. Encrypts and stores PIN in database
5. Sends PIN via email
6. Member enters PIN to sign in
7. Session created, lasts 7 days

### Returning Access
1. Member enters email at sign-in page
2. System generates NEW 4-digit PIN
3. Replaces old PIN in database
4. Sends new PIN via email
5. Member enters PIN to sign in
6. Session extended for 7 days

### Security Features
- **Encrypted PINs**: All PINs encrypted in database with AES-256
- **Rate Limiting**: Can only request new PIN every 2 minutes
- **Session Expiry**: Sessions expire after 7 days
- **HttpOnly Cookies**: Session stored in secure, HttpOnly cookies
- **One Member Per Email**: Email must match existing member record

---

## Routes

### Active Routes ✅
- `/{gym-slug}/portal/sign-in` - Sign-in page (email → PIN → access)
- `/{gym-slug}/portal/dashboard` - Dashboard (authenticated)
- `/{gym-slug}/portal/*` - All portal pages (require session)

### Removed Routes ❌
- `/{gym-slug}/portal/request-access` - (old magic link)
- `/{gym-slug}/portal/auth?token=xxx` - (old magic link validation)
- `/{gym-slug}/portal/auth/callback` - (old OAuth callback)

---

## Key Files

### Authentication Actions
**`lib/actions/pin-auth.ts`** - All auth functions
- `requestPortalAccess()` - Generate and send PIN
- `signInWithPIN()` - Verify PIN and create session
- `getAuthenticatedMember()` - Get current user from session
- `signOut()` - Clear session

### Email Template
**`lib/email/templates/pin-email.tsx`** - PIN email template
- Displays 4-digit PIN prominently
- Explains portal features for new users
- Security reminder to keep PIN private

**`lib/email/notifications.ts`** - Email sending
- `sendPINEmail()` - Sends PIN to member

### UI Components
**`app/[slug]/portal/sign-in/page.tsx`** - Sign-in page
- Step 1: Email input form
- Step 2: PIN input form
- Resend PIN button
- Change email button

**`app/[slug]/portal/(portal)/layout.tsx`** - Auth guard
- Checks session on all portal pages
- Redirects to `/sign-in` if not authenticated

**`components/member-portal/layout/portal-header.tsx`** - Header
- Logout button (clears session)

---

## Database Schema

### members table
```sql
members
├── id (UUID)
├── email (TEXT)
├── full_name (TEXT)
├── gym_id (UUID) → gyms
├── portal_pin (TEXT) ← Encrypted 4-digit PIN
├── pin_created_at (TIMESTAMPTZ) ← First PIN creation
├── last_pin_sent_at (TIMESTAMPTZ) ← For rate limiting
└── ...
```

### RLS Policies
Portal uses service role with manual filtering:
```typescript
// In server actions, we manually filter by memberId
const { data } = await supabase
  .from('workout_routines')
  .select('*')
  .eq('member_id', memberId); // ← Manual filtering
```

Gym owners can still view member data via owner-specific policies.

---

## Session Management

**Session Storage:** HttpOnly cookie (`member_portal_session`)
**Session Duration:** 7 days
**Cookie Settings:**
- HttpOnly: true
- Secure: true (production)
- SameSite: Strict
- Path: /

**Logout:**
- Calls `signOut()` from `pin-auth.ts`
- Deletes session cookie
- Redirects to gym landing page

---

## Security

### PIN Generation
- 4 random digits (1000-9999)
- Generated using Math.random()
- New PIN on every request

### PIN Storage
- Encrypted with AES-256-CBC
- Encryption key from environment variable
- Stored as `iv:encrypted` format

### Session Tokens
- Encrypted with AES-256-CBC
- Contains memberId, gymId, expiresAt
- Verified on every portal page load

### Rate Limiting
- Can request new PIN every 2 minutes
- Prevents PIN spamming
- Tracked via `last_pin_sent_at` timestamp

---

## For Developers

### Check if user is authenticated:
```typescript
import { getAuthenticatedMember } from '@/lib/actions/pin-auth';

const authResult = await getAuthenticatedMember(gymSlug);
if (!authResult.success) {
  redirect(`/${gymSlug}/portal/sign-in`);
}

const { memberId, gymId } = authResult.data;
```

### Request portal access (send PIN):
```typescript
import { requestPortalAccess } from '@/lib/actions/pin-auth';

const result = await requestPortalAccess(email, gymId);
if (result.success) {
  // PIN sent to email
}
```

### Sign in with PIN:
```typescript
import { signInWithPIN } from '@/lib/actions/pin-auth';

const result = await signInWithPIN(email, pin, gymSlug);
if (result.success) {
  // Session created, redirect to dashboard
}
```

### Sign out user:
```typescript
import { signOut } from '@/lib/actions/pin-auth';

await signOut();
router.push(`/${gymSlug}`);
router.refresh();
```

### Protected page template:
```typescript
// app/[slug]/portal/(portal)/my-page/page.tsx
export default async function MyPage({ params }: { params: { slug: string } }) {
  // Layout already handles auth, just use the data
  // If user reaches here, they're authenticated

  return <div>Protected content</div>;
}
```

---

## Environment Variables

Required in `.env.local`:

```bash
# PIN encryption key (32 characters recommended)
PIN_ENCRYPTION_KEY=your-secret-key-here-32-chars-minimum

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
NOTIFICATION_FROM_EMAIL=noreply@yourdomain.com
```

---

## Testing Checklist

- [ ] Request PIN for first-time member
- [ ] Receive PIN email with correct format
- [ ] Sign in with email + PIN
- [ ] Session persists across page refresh
- [ ] Request new PIN (old PIN invalidated)
- [ ] Rate limiting works (2-minute wait)
- [ ] Logout clears session
- [ ] Unauthenticated users redirected to /sign-in
- [ ] Cross-member data isolation (RLS)
- [ ] PIN encryption/decryption works
- [ ] Session expiry (7 days)

---

## Migration History

### v1: Magic Link Authentication
- Used temporary tokens in database
- Email with magic link
- One-time use, 15-minute expiry

### v2: Google OAuth + Email/Password
- Supabase Auth integration
- Google OAuth sign-in
- Email/password accounts
- auth_user_id in members table

### v3: PIN-Based Authentication ✅ (Current)
- Simple 4-digit PIN system
- No external auth providers
- No password management
- Encrypted PIN storage
- Email-based verification

---

**Status:** ✅ Active and Production Ready

**Last Updated:** 2026-02-15 (PIN-based system)
