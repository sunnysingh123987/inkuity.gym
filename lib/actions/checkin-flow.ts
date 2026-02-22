'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendInactiveMemberCheckInNotification } from '@/lib/email/notifications';
import { checkBlacklistOnScan } from './blacklist';
import { revalidatePath } from 'next/cache';

/**
 * Calculate the distance in meters between two lat/lng points using the Haversine formula.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate that a member's location is within the gym's geofence radius.
 * If the gym has no location configured, check-in is always allowed.
 */
export async function validateCheckInLocation(
  gymId: string,
  memberLat: number,
  memberLng: number
): Promise<{
  success: boolean;
  allowed: boolean;
  distance?: number;
  maxDistance?: number;
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return { success: false, allowed: true, error: 'Gym not found' };
    }

    const settings = (gym.settings || {}) as Record<string, any>;
    const gymLat = settings.latitude as number | undefined;
    const gymLng = settings.longitude as number | undefined;
    const geofenceRadius = (settings.geofence_radius as number) || 200;

    // If no location configured, allow check-in (geofencing not set up)
    if (gymLat == null || gymLng == null) {
      return { success: true, allowed: true };
    }

    const distance = haversineDistance(memberLat, memberLng, gymLat, gymLng);
    const allowed = distance <= geofenceRadius;

    return {
      success: true,
      allowed,
      distance: Math.round(distance),
      maxDistance: geofenceRadius,
    };
  } catch (error: any) {
    console.error('Error validating check-in location:', error);
    // On error, allow check-in (graceful degradation)
    return { success: false, allowed: true, error: 'Location validation failed' };
  }
}

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

    // Check blacklist status
    const blacklistResult = await checkBlacklistOnScan(memberId, gymId);
    const blacklisted = blacklistResult.isBlacklisted;

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
      blacklisted,
      data: {
        checkInId: checkIn.id,
        checkInAt: checkIn.check_in_at,
        memberName: member.full_name || 'Member',
        membershipStatus: member.membership_status || 'active',
        subscriptionEndDate: member.subscription_end_date,
        subscriptionWarning,
        blacklisted,
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

/**
 * Get today's live check-ins with member info for the gym owner dashboard.
 */
export async function getLiveCheckIns(gymId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const todayStart = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        id,
        check_in_at,
        member:members!member_id (
          id,
          full_name,
          phone,
          avatar_url,
          membership_status
        )
      `)
      .eq('gym_id', gymId)
      .gte('check_in_at', todayStart)
      .order('check_in_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch live check-ins:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching live check-ins:', error);
    return { success: false, data: [], error: 'An unexpected error occurred' };
  }
}

/**
 * Count today's unique member check-ins.
 */
export async function getCheckInCount(gymId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const todayStart = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('check_ins')
      .select('member_id')
      .eq('gym_id', gymId)
      .gte('check_in_at', todayStart);

    if (error) {
      console.error('Failed to count check-ins:', error);
      return { success: false, count: 0, error: error.message };
    }

    // Count unique member IDs
    const uniqueMembers = new Set(
      (data || []).map((row) => row.member_id).filter(Boolean)
    );

    return { success: true, count: uniqueMembers.size, error: null };
  } catch (error: any) {
    console.error('Error counting check-ins:', error);
    return { success: false, count: 0, error: 'An unexpected error occurred' };
  }
}
