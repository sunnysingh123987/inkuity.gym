'use server';

import { resend } from './client';
import { WelcomeEmail } from './templates/welcome-email';
import { CheckInConfirmation } from './templates/checkin-confirmation';
import { PINEmail } from './templates/pin-email';
import { InactiveMemberCheckIn } from './templates/inactive-member-checkin';
import type { Member, Gym } from '@/types/database';

// ============================================================
// EMAIL NOTIFICATION SERVICE
// ============================================================

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'noreply@inkuity.com';
const FROM_NAME = 'Inkuity';

// ============================================================
// 1. WELCOME EMAIL (New Member)
// ============================================================

export async function sendWelcomeEmail(member: Member, gym: Gym): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if member has email
    if (!member.email) {
      return { success: false, error: 'Member has no email address' };
    }

    // Check notification preferences (stored in metadata)
    const preferences = member.metadata as any;
    if (preferences?.notification_preferences?.email_checkin === false) {
      return { success: false, error: 'Member has disabled email notifications' };
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${gym.name} via ${FROM_NAME} <${FROM_EMAIL}>`,
      to: [member.email],
      subject: `Welcome to ${gym.name}!`,
      react: WelcomeEmail({
        memberName: member.full_name || 'there',
        gymName: gym.name,
        gymLogo: gym.logo_url || undefined,
      }),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent:', data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// 2. CHECK-IN CONFIRMATION EMAIL
// ============================================================

export async function sendCheckInConfirmation(
  member: Member,
  gym: Gym,
  checkInData: {
    checkInTime: string;
    totalCheckIns: number;
    currentStreak?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if member has email
    if (!member.email) {
      return { success: false, error: 'Member has no email address' };
    }

    // Check notification preferences
    const preferences = member.metadata as any;
    if (preferences?.notification_preferences?.email_checkin === false) {
      return { success: false, error: 'Member has disabled email notifications' };
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${gym.name} via ${FROM_NAME} <${FROM_EMAIL}>`,
      to: [member.email],
      subject: `Check-in confirmed at ${gym.name}`,
      react: CheckInConfirmation({
        memberName: member.full_name || 'there',
        gymName: gym.name,
        gymLogo: gym.logo_url || undefined,
        checkInTime: checkInData.checkInTime,
        totalCheckIns: checkInData.totalCheckIns,
        currentStreak: checkInData.currentStreak,
        gymSlug: gym.slug,
      }),
    });

    if (error) {
      console.error('Failed to send check-in confirmation:', error);
      return { success: false, error: error.message };
    }

    console.log('Check-in confirmation sent:', data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending check-in confirmation:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// 3. PIN EMAIL (Member Portal Access)
// ============================================================

export async function sendPINEmail(data: {
  to: string;
  pin: string;
  memberName: string;
  gymName: string;
  isNewPIN: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate email format
    if (!isValidEmail(data.to)) {
      return { success: false, error: 'Invalid email address' };
    }

    // Send PIN email
    const { data: emailData, error } = await resend.emails.send({
      from: `${data.gymName} via ${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.to],
      subject: `Your ${data.gymName} Portal PIN`,
      react: PINEmail({
        memberName: data.memberName,
        gymName: data.gymName,
        pin: data.pin,
        isNewPIN: data.isNewPIN,
      }),
    });

    if (error) {
      console.error('Failed to send PIN email:', error);
      return { success: false, error: error.message };
    }

    console.log('PIN email sent:', emailData?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending PIN email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// 4. INACTIVE MEMBER CHECK-IN NOTIFICATION (to Gym Owner)
// ============================================================

export async function sendInactiveMemberCheckInNotification(data: {
  ownerEmail: string;
  ownerName: string;
  memberName: string;
  memberEmail: string;
  gymName: string;
  gymSlug: string;
  membershipStatus: string;
  subscriptionEndDate?: string;
  checkInTime: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidEmail(data.ownerEmail)) {
      return { success: false, error: 'Invalid owner email address' };
    }

    const { data: emailData, error } = await resend.emails.send({
      from: `${data.gymName} via ${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.ownerEmail],
      subject: `Alert: Inactive member ${data.memberName} checked in at ${data.gymName}`,
      react: InactiveMemberCheckIn({
        ownerName: data.ownerName,
        memberName: data.memberName,
        memberEmail: data.memberEmail,
        gymName: data.gymName,
        membershipStatus: data.membershipStatus,
        subscriptionEndDate: data.subscriptionEndDate,
        checkInTime: data.checkInTime,
        gymSlug: data.gymSlug,
      }),
    });

    if (error) {
      console.error('Failed to send inactive member notification:', error);
      return { success: false, error: error.message };
    }

    console.log('Inactive member notification sent:', emailData?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending inactive member notification:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// 5. VALIDATE EMAIL ADDRESS (Helper - not a server action)
// ============================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================
// 6. CHECK NOTIFICATION PREFERENCES (Helper - not a server action)
// ============================================================

function canSendEmail(member: Member): boolean {
  if (!member.email) return false;
  if (!isValidEmail(member.email)) return false;

  const preferences = member.metadata as any;
  return preferences?.notification_preferences?.email_checkin !== false;
}
