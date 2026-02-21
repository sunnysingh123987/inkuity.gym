'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendInactiveMemberCheckInNotification } from '@/lib/email/notifications';
import { revalidatePath } from 'next/cache';

/**
 * Record a check-in after successful PIN login from QR scan.
 * Checks subscription status and notifies gym owner if inactive.
 */
export async function recordQRCheckIn(
  memberId: string,
  gymId: string,
  scanId?: string,
  qrCode?: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Get member details including subscription status
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return { success: false, error: 'Member not found' };
    }

    // Find the QR code ID if code provided
    let qrCodeId: string | null = null;
    if (qrCode) {
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('code', qrCode)
        .single();
      qrCodeId = qrData?.id || null;
    }

    // Record the check-in
    const { data: checkIn, error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        gym_id: gymId,
        member_id: memberId,
        qr_code_id: qrCodeId,
        scan_id: scanId || null,
        tags: ['qr-scan'],
      })
      .select()
      .single();

    if (checkInError) {
      console.error('Failed to record check-in:', checkInError);
      return { success: false, error: 'Failed to record check-in' };
    }

    // Update QR code total scans
    if (qrCodeId) {
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('total_scans')
        .eq('id', qrCodeId)
        .single();
      if (qrData) {
        try {
          await supabase
            .from('qr_codes')
            .update({ total_scans: (qrData.total_scans || 0) + 1 })
            .eq('id', qrCodeId);
        } catch { /* Non-critical */ }
      }
    }

    // If trial member, create notification for gym owner
    if (member.membership_status === 'trial') {
      const { data: gym } = await supabase
        .from('gyms')
        .select('owner_id, name')
        .eq('id', gymId)
        .single();

      if (gym?.owner_id) {
        const checkInTime = new Date(checkIn.check_in_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        import('@/lib/actions/notifications').then(({ createNotification }) => {
          createNotification({
            gym_id: gymId,
            user_id: gym.owner_id,
            type: 'trial_checkin',
            title: 'Trial Member Check-in',
            message: `${member.full_name || 'A trial member'} checked in at ${checkInTime}.`,
            metadata: {
              member_id: member.id,
              member_name: member.full_name,
              check_in_id: checkIn.id,
            },
          }).catch((err: any) => console.error('Failed to create trial notification:', err));
        }).catch(() => {});
      }
    }

    // Check subscription status
    const isActive = member.membership_status === 'active';
    let subscriptionWarning = false;

    if (!isActive) {
      subscriptionWarning = true;

      // Get gym details and owner info for notification
      const { data: gym } = await supabase
        .from('gyms')
        .select('*, owner:profiles(*)')
        .eq('id', gymId)
        .single();

      if (gym?.owner?.email) {
        // Send notification to gym owner (fire and forget)
        sendInactiveMemberCheckInNotification({
          ownerEmail: gym.owner.email,
          ownerName: gym.owner.full_name || 'Gym Owner',
          memberName: member.full_name || 'Unknown Member',
          memberEmail: member.email || '',
          gymName: gym.name,
          gymSlug: gym.slug,
          membershipStatus: member.membership_status || 'expired',
          subscriptionEndDate: member.subscription_end_date || undefined,
          checkInTime: checkIn.check_in_at,
        }).catch((err) => console.error('Failed to send owner notification:', err));
      }
    }

    revalidatePath('/portal/dashboard');
    revalidatePath('/portal/check-ins');

    return {
      success: true,
      data: {
        checkInId: checkIn.id,
        checkInAt: checkIn.check_in_at,
        memberName: member.full_name || 'Member',
        membershipStatus: member.membership_status || 'active',
        subscriptionEndDate: member.subscription_end_date,
        subscriptionWarning,
      },
    };
  } catch (error: any) {
    console.error('Error recording QR check-in:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Save the member's selected workout focus for today's check-in.
 */
export async function saveWorkoutFocus(
  checkInId: string,
  workoutFocus: string[]
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('check_ins')
      .update({
        metadata: { workout_focus: workoutFocus },
        tags: ['qr-scan', ...workoutFocus.map((w) => `workout:${w}`)],
      })
      .eq('id', checkInId);

    if (error) {
      console.error('Failed to save workout focus:', error);
      return { success: false, error: 'Failed to save workout focus' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving workout focus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
