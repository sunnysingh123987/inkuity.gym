'use server';

import { cookies } from 'next/headers';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendPINEmail } from '@/lib/email/notifications';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'member_portal_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const PIN_RATE_LIMIT_MINUTES = 2; // Can request new PIN every 2 minutes

// Encryption key from environment (should be 64 character hex string = 32 bytes)
function getEncryptionKeyEnv(): string {
  const key = process.env.PIN_ENCRYPTION_KEY;
  if (!key) throw new Error('PIN_ENCRYPTION_KEY env var is required');
  return key;
}
const ENCRYPTION_KEY: string = getEncryptionKeyEnv();

// Helper function to get encryption key as buffer
function getEncryptionKey(): Buffer {
  // If the key is a hex string (64 chars), convert it to buffer
  if (ENCRYPTION_KEY.length === 64) {
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  }
  // Otherwise, pad/truncate to 32 bytes
  return Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
}

// Helper function to generate 4-digit PIN
function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper function to encrypt PIN
function encryptPIN(pin: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    getEncryptionKey(),
    iv
  );

  let encrypted = cipher.update(pin, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// Helper function to decrypt PIN
function decryptPIN(encryptedPIN: string): string {
  const parts = encryptedPIN.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    getEncryptionKey(),
    iv
  );

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Helper function to create session token
function createSessionToken(memberId: string, gymId: string): string {
  const payload = JSON.stringify({
    memberId,
    gymId,
    expiresAt: Date.now() + SESSION_DURATION,
  });

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    getEncryptionKey(),
    iv
  );

  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// Helper function to verify session token
function verifySessionToken(token: string): { memberId: string; gymId: string; expiresAt: number } | null {
  try {
    const parts = token.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      getEncryptionKey(),
      iv
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted);

    // Check if expired
    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return {
      memberId: payload.memberId,
      gymId: payload.gymId,
      expiresAt: payload.expiresAt,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get gym info by slug (bypasses RLS for public access like QR scan sign-in)
 */
export async function getGymBySlug(slug: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: gym, error } = await supabase
      .from('gyms')
      .select('id, name, logo_url')
      .eq('slug', slug)
      .single();

    if (error || !gym) {
      return { success: false, error: 'Gym not found' };
    }

    return { success: true, data: gym };
  } catch (error: any) {
    console.error('Error fetching gym:', error);
    return { success: false, error: 'Failed to load gym information' };
  }
}

/**
 * Check if member exists and has a PIN
 * Returns { exists: boolean, hasPin: boolean } — does NOT error for non-existent members
 */
export async function checkMemberPINStatus(email: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, portal_pin')
      .eq('email', email.toLowerCase().trim())
      .eq('gym_id', gymId)
      .maybeSingle();

    if (memberError) {
      console.error('Error checking PIN status:', memberError);
      return { success: false, error: 'An unexpected error occurred.' };
    }

    if (!member) {
      return {
        success: true,
        data: {
          exists: false,
          hasPin: false,
          memberId: null,
        },
      };
    }

    return {
      success: true,
      data: {
        exists: true,
        hasPin: !!member.portal_pin,
        memberId: member.id,
      },
    };
  } catch (error: any) {
    console.error('Error checking PIN status:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Send a verification code to a new member's email for self-registration
 */
export async function sendVerificationCode(email: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const encryptedCode = encryptPIN(code);

    // Store verification code temporarily in a metadata approach:
    // We'll use a simple approach — store in a temp record or use the members table
    // For simplicity, we store it in a verification_codes approach using supabase
    // But since we don't have a separate table, we'll use Supabase's built-in OTP or
    // store the code in memory. For now, we'll create a pending member record with the code.

    // Check if there's already a pending verification for this email
    const { data: existing } = await supabase
      .from('members')
      .select('id, last_pin_sent_at, metadata, membership_status')
      .eq('email', email.toLowerCase().trim())
      .eq('gym_id', gymId)
      .maybeSingle();

    if (existing && existing.membership_status !== 'pending') {
      // Member already exists — they should use the normal PIN flow
      return { success: false, error: 'An account with this email already exists. Please enter your PIN.' };
    }

    // Rate limiting for pending verification resends
    if (existing && existing.membership_status === 'pending') {
      const metadata = existing.metadata as Record<string, any> | null;
      const sentAt = metadata?.verification_sent_at;
      if (sentAt) {
        const minutesSinceLastSend = (Date.now() - new Date(sentAt).getTime()) / (1000 * 60);
        if (minutesSinceLastSend < PIN_RATE_LIMIT_MINUTES) {
          const waitTime = Math.ceil(PIN_RATE_LIMIT_MINUTES - minutesSinceLastSend);
          return {
            success: false,
            error: `Please wait ${waitTime} minute${waitTime > 1 ? 's' : ''} before requesting a new code.`,
          };
        }
      }

      // Update existing pending record with new code instead of creating duplicate
      const { error: updateError } = await supabase
        .from('members')
        .update({
          metadata: {
            verification_code: encryptedCode,
            verification_sent_at: new Date().toISOString(),
          },
        })
        .eq('id', existing.id);

      if (updateError) {
        return { success: false, error: 'Failed to send verification code. Please try again.' };
      }

      // Get gym details for email
      const { data: gym } = await supabase
        .from('gyms')
        .select('name, slug, logo_url')
        .eq('id', gymId)
        .single();

      await sendPINEmail({
        to: email,
        pin: code,
        memberName: 'New Member',
        gymName: gym?.name || 'Gym',
        isNewPIN: true,
      });

      return {
        success: true,
        message: 'Verification code sent to your email!',
        memberId: existing.id,
      };
    }

    // Store verification code in a temporary way — we'll create the member record
    // with 'pending' status and store the code in metadata
    const { data: pendingMember, error: createError } = await supabase
      .from('members')
      .insert({
        gym_id: gymId,
        email: email.toLowerCase().trim(),
        membership_status: 'pending',
        metadata: {
          verification_code: encryptedCode,
          verification_sent_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating pending member:', createError);
      return { success: false, error: 'Failed to send verification code. Please try again.' };
    }

    // Get gym details for email
    const { data: gym } = await supabase
      .from('gyms')
      .select('name, slug, logo_url')
      .eq('id', gymId)
      .single();

    // Send verification code via email
    await sendPINEmail({
      to: email,
      pin: code,
      memberName: 'New Member',
      gymName: gym?.name || 'Gym',
      isNewPIN: true,
    });

    return {
      success: true,
      message: 'Verification code sent to your email!',
      memberId: pendingMember.id,
    };
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Verify the code sent during self-registration
 */
export async function verifyCode(email: string, code: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, metadata')
      .eq('email', email.toLowerCase().trim())
      .eq('gym_id', gymId)
      .eq('membership_status', 'pending')
      .maybeSingle();

    if (memberError || !member) {
      return { success: false, error: 'No pending verification found. Please try again.' };
    }

    const metadata = member.metadata as Record<string, any> | null;
    const encryptedCode = metadata?.verification_code;

    if (!encryptedCode) {
      return { success: false, error: 'No verification code found. Please request a new one.' };
    }

    // Check if code has expired (10 minutes)
    const sentAt = metadata?.verification_sent_at;
    if (sentAt) {
      const elapsed = (Date.now() - new Date(sentAt).getTime()) / 1000 / 60;
      if (elapsed > 10) {
        return { success: false, error: 'Verification code has expired. Please request a new one.' };
      }
    }

    // Decrypt and compare
    const decryptedCode = decryptPIN(encryptedCode);
    if (decryptedCode !== code.trim()) {
      return { success: false, error: 'Invalid verification code.' };
    }

    return { success: true, memberId: member.id };
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Complete registration for a new member after verification:
 * set their PIN, upgrade to trial status, and create a session
 */
export async function registerNewMember(
  memberId: string,
  pin: string,
  gymSlug: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, error: 'PIN must be exactly 4 digits.' };
    }

    const encryptedPIN = encryptPIN(pin);

    // Get gym id from slug
    const { data: gym } = await supabase
      .from('gyms')
      .select('id')
      .eq('slug', gymSlug)
      .single();

    if (!gym) {
      return { success: false, error: 'Gym not found.' };
    }

    // Update member: set PIN, upgrade to trial, clear verification metadata
    const { data: member, error: updateError } = await supabase
      .from('members')
      .update({
        portal_pin: encryptedPIN,
        pin_created_at: new Date().toISOString(),
        membership_status: 'trial',
        member_since: new Date().toISOString().split('T')[0],
        metadata: {},
      })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError || !member) {
      console.error('Error registering member:', updateError);
      return { success: false, error: 'Failed to complete registration.' };
    }

    // Create session
    const sessionToken = createSessionToken(member.id, gym.id);

    cookies().set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    });

    return {
      success: true,
      data: {
        memberId: member.id,
        gymId: gym.id,
      },
    };
  } catch (error: any) {
    console.error('Error registering new member:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Request portal access - generates and sends PIN
 */
export async function requestPortalAccess(email: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    // Find member by email and gym
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, full_name, gym_id, portal_pin, last_pin_sent_at')
      .eq('email', email.toLowerCase().trim())
      .eq('gym_id', gymId)
      .single();

    if (memberError || !member) {
      return {
        success: false,
        error: 'No member found with this email. Please check in at the gym first.',
      };
    }

    // Rate limiting - check if PIN was sent recently
    if (member.last_pin_sent_at) {
      const lastSent = new Date(member.last_pin_sent_at).getTime();
      const now = Date.now();
      const minutesSinceLastSend = (now - lastSent) / (1000 * 60);

      if (minutesSinceLastSend < PIN_RATE_LIMIT_MINUTES) {
        const waitTime = Math.ceil(PIN_RATE_LIMIT_MINUTES - minutesSinceLastSend);
        return {
          success: false,
          error: `Please wait ${waitTime} minute${waitTime > 1 ? 's' : ''} before requesting a new PIN.`,
        };
      }
    }

    // Generate new PIN
    const pin = generatePIN();
    const encryptedPIN = encryptPIN(pin);

    // Update member with new PIN
    const { error: updateError } = await supabase
      .from('members')
      .update({
        portal_pin: encryptedPIN,
        pin_created_at: member.portal_pin ? undefined : new Date().toISOString(),
        last_pin_sent_at: new Date().toISOString(),
      })
      .eq('id', member.id);

    if (updateError) {
      console.error('Error updating PIN:', updateError);
      return {
        success: false,
        error: 'Failed to generate PIN. Please try again.',
      };
    }

    // Get gym details for email
    const { data: gym } = await supabase
      .from('gyms')
      .select('name, slug, logo_url')
      .eq('id', gymId)
      .single();

    // Send PIN via email
    await sendPINEmail({
      to: email,
      pin,
      memberName: member.full_name || 'Member',
      gymName: gym?.name || 'Gym',
      isNewPIN: !member.portal_pin,
    });

    return {
      success: true,
      message: member.portal_pin
        ? 'PIN sent to your email!'
        : 'Welcome! Your PIN has been sent to your email.',
    };
  } catch (error: any) {
    console.error('Error requesting portal access:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Sign in with email and PIN
 */
export async function signInWithPIN(email: string, pin: string, gymSlug: string) {
  try {
    const supabase = createAdminSupabaseClient();

    // Get gym by slug
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('slug', gymSlug)
      .single();

    if (gymError || !gym) {
      return {
        success: false,
        error: 'Gym not found.',
      };
    }

    // Find member — query core columns only, then lockout columns separately
    // to avoid breaking login if lockout columns haven't been migrated yet
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, full_name, gym_id, portal_pin')
      .eq('email', email.toLowerCase().trim())
      .eq('gym_id', gym.id)
      .single();

    if (memberError || !member) {
      return {
        success: false,
        error: 'Invalid email or PIN.',
      };
    }

    // Fetch lockout columns (may not exist if migration not yet applied)
    let failedAttempts = 0;
    let pinLockedUntil: string | null = null;
    const { data: lockoutData } = await supabase
      .from('members')
      .select('failed_pin_attempts, pin_locked_until')
      .eq('id', member.id)
      .single();

    if (lockoutData) {
      failedAttempts = lockoutData.failed_pin_attempts || 0;
      pinLockedUntil = lockoutData.pin_locked_until;
    }

    // Check if account is locked due to too many failed attempts
    if (pinLockedUntil) {
      const lockExpiry = new Date(pinLockedUntil).getTime();
      if (Date.now() < lockExpiry) {
        const minutesLeft = Math.ceil((lockExpiry - Date.now()) / (1000 * 60));
        return {
          success: false,
          error: `Invalid email or PIN. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        };
      }
      // Lock has expired — reset on next successful/failed attempt below
    }

    // Check if member has a PIN
    if (!member.portal_pin) {
      return {
        success: false,
        error: 'No PIN found. Please request access first.',
      };
    }

    // Verify PIN
    const decryptedPIN = decryptPIN(member.portal_pin);
    if (decryptedPIN !== pin.trim()) {
      // Increment failed attempts (best-effort, won't break if columns missing)
      const newAttempts = failedAttempts + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MINUTES = 15;

      await supabase
        .from('members')
        .update({
          failed_pin_attempts: newAttempts,
          ...(newAttempts >= MAX_ATTEMPTS
            ? { pin_locked_until: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString() }
            : {}),
        })
        .eq('id', member.id);

      return {
        success: false,
        error: 'Invalid email or PIN.',
      };
    }

    // Successful login — reset failed attempts
    if (failedAttempts > 0) {
      await supabase
        .from('members')
        .update({ failed_pin_attempts: 0, pin_locked_until: null })
        .eq('id', member.id);
    }

    // Create session
    const sessionToken = createSessionToken(member.id, member.gym_id);

    // Set session cookie
    cookies().set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // Convert to seconds
      path: '/',
    });

    return {
      success: true,
      data: {
        memberId: member.id,
        gymId: member.gym_id,
      },
    };
  } catch (error: any) {
    console.error('Error signing in with PIN:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get authenticated member from session cookie
 */
export async function getAuthenticatedMember(gymSlug: string) {
  try {
    const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify session token
    const session = verifySessionToken(sessionToken);
    if (!session) {
      // Invalid or expired session
      cookies().delete(SESSION_COOKIE_NAME);
      return {
        success: false,
        error: 'Session expired',
      };
    }

    // Verify gym slug matches
    const supabase = createAdminSupabaseClient();
    const { data: gym } = await supabase
      .from('gyms')
      .select('id, slug')
      .eq('id', session.gymId)
      .eq('slug', gymSlug)
      .single();

    if (!gym) {
      return {
        success: false,
        error: 'Invalid session',
      };
    }

    // Sliding renewal: refresh session if less than half the duration remains
    if (session.expiresAt - Date.now() < SESSION_DURATION / 2) {
      const newToken = createSessionToken(session.memberId, session.gymId);
      cookies().set(SESSION_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION / 1000,
        path: '/',
      });
    }

    return {
      success: true,
      data: {
        memberId: session.memberId,
        gymId: session.gymId,
      },
    };
  } catch (error: any) {
    console.error('Error getting authenticated member:', error);
    return {
      success: false,
      error: 'Authentication error',
    };
  }
}

/**
 * Get authenticated member info (name + gym name) for quick check-in
 */
export async function getAuthenticatedMemberInfo(gymSlug: string) {
  try {
    const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return { success: false as const, error: 'Not authenticated' };
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      cookies().delete(SESSION_COOKIE_NAME);
      return { success: false as const, error: 'Session expired' };
    }

    const supabase = createAdminSupabaseClient();

    // Fetch gym and member in parallel
    const [gymResult, memberResult] = await Promise.all([
      supabase
        .from('gyms')
        .select('id, name, slug, logo_url')
        .eq('id', session.gymId)
        .eq('slug', gymSlug)
        .single(),
      supabase
        .from('members')
        .select('id, full_name, email')
        .eq('id', session.memberId)
        .single(),
    ]);

    if (!gymResult.data || !memberResult.data) {
      return { success: false as const, error: 'Invalid session' };
    }

    return {
      success: true as const,
      data: {
        memberId: session.memberId,
        gymId: session.gymId,
        memberName: memberResult.data.full_name || 'Member',
        memberEmail: memberResult.data.email,
        gymName: gymResult.data.name,
        gymLogoUrl: gymResult.data.logo_url as string | null,
      },
    };
  } catch (error: any) {
    console.error('Error getting authenticated member info:', error);
    return { success: false as const, error: 'Authentication error' };
  }
}

/**
 * Change member PIN - validates current PIN, sets new one
 */
export async function changeMemberPIN(
  memberId: string,
  currentPIN: string,
  newPIN: string,
  gymSlug: string
) {
  try {
    if (!/^\d{4}$/.test(newPIN)) {
      return { success: false, error: 'New PIN must be exactly 4 digits.' };
    }

    const supabase = createAdminSupabaseClient();

    // Verify gym slug matches session
    const authResult = await getAuthenticatedMember(gymSlug);
    if (!authResult.success || authResult.data?.memberId !== memberId) {
      return { success: false, error: 'Unauthorized.' };
    }

    // Get current stored PIN
    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('portal_pin')
      .eq('id', memberId)
      .single();

    if (fetchError || !member?.portal_pin) {
      return { success: false, error: 'No existing PIN found.' };
    }

    // Verify current PIN
    const decryptedCurrentPIN = decryptPIN(member.portal_pin);
    if (decryptedCurrentPIN !== currentPIN.trim()) {
      return { success: false, error: 'Current PIN is incorrect.' };
    }

    // Encrypt and save new PIN
    const encryptedNewPIN = encryptPIN(newPIN);
    const { error: updateError } = await supabase
      .from('members')
      .update({ portal_pin: encryptedNewPIN })
      .eq('id', memberId);

    if (updateError) {
      return { success: false, error: 'Failed to update PIN.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error changing PIN:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Sign out - clear session cookie
 */
export async function signOut() {
  try {
    cookies().delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: 'Failed to sign out',
    };
  }
}
