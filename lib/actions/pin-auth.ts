'use server';

import { cookies } from 'next/headers';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendPINEmail } from '@/lib/email/notifications';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'member_portal_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const PIN_RATE_LIMIT_MINUTES = 2; // Can request new PIN every 2 minutes

// Encryption key from environment (should be 64 character hex string = 32 bytes)
const ENCRYPTION_KEY = process.env.PIN_ENCRYPTION_KEY || 'default-key-change-in-production-32b';

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
function verifySessionToken(token: string): { memberId: string; gymId: string } | null {
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
 * Check if member has existing PIN
 */
export async function checkMemberPINStatus(email: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, portal_pin')
      .eq('email', email.toLowerCase().trim())
      .eq('gym_id', gymId)
      .single();

    if (memberError || !member) {
      return {
        success: false,
        error: 'No member found with this email. Please check in at the gym first.',
      };
    }

    return {
      success: true,
      data: {
        hasPin: !!member.portal_pin,
        memberId: member.id,
      },
    };
  } catch (error: any) {
    console.error('Error checking PIN status:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
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

    // Find member
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
      return {
        success: false,
        error: 'Invalid email or PIN.',
      };
    }

    // Create session
    const sessionToken = createSessionToken(member.id, member.gym_id);

    // Set session cookie
    cookies().set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
