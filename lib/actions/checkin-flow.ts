'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendInactiveMemberCheckInNotification } from '@/lib/email/notifications';
import { checkBlacklistOnScan } from './blacklist';
import { revalidatePath } from 'next/cache';

/**
 * Get the start of "today" as an ISO/UTC string based on the gym's local timezone.
 * E.g., if it's 12:30 AM IST Mar 7, this returns the UTC equivalent of Mar 7 00:00 IST
 * which is "2026-03-06T18:30:00.000Z". This ensures "today" queries match the gym's local date.
 */
export async function getGymTodayStart(gymId: string, supabase?: ReturnType<typeof createAdminSupabaseClient>): Promise<string> {
  const sb = supabase || createAdminSupabaseClient();
  let tz = 'Asia/Kolkata';
  try {
    const { data } = await sb.from('gyms').select('timezone').eq('id', gymId).single();
    if (data?.timezone) tz = data.timezone;
  } catch {}
  const now = new Date();
  // Get today's date string (YYYY-MM-DD) in the gym's timezone
  const localDate = now.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA gives YYYY-MM-DD
  // Compute UTC offset for the gym's timezone at this moment
  // by comparing the local time string to UTC
  const localStr = now.toLocaleString('en-US', { timeZone: tz, hour12: false });
  const localNow = new Date(localStr);
  const utcNow = new Date(now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false }));
  const offsetMs = localNow.getTime() - utcNow.getTime();
  // Midnight in gym's timezone, converted to UTC
  const midnightLocal = new Date(`${localDate}T00:00:00`);
  const midnightUtc = new Date(midnightLocal.getTime() - offsetMs);
  return midnightUtc.toISOString();
}

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
    const geofenceRadius = (settings.geofence_radius as number) || 6;

    // If location check-in is disabled by gym owner, allow check-in
    const requireLocation = settings.require_location_checkin !== false;
    if (!requireLocation) {
      return { success: true, allowed: true };
    }

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
 * Check if the gym requires location validation for check-ins.
 */
export async function isLocationRequiredForCheckIn(gymId: string): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data: gym } = await supabase
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .single();

    if (!gym) return false;
    const settings = (gym.settings || {}) as Record<string, any>;
    return settings.require_location_checkin !== false &&
      settings.latitude != null &&
      settings.longitude != null;
  } catch {
    return false;
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

    // Check if member already checked in today (1 check-in per date, gym timezone)
    const todayStart = await getGymTodayStart(gymId, supabase);
    const { data: existingCheckIn } = await supabase
      .from('check_ins')
      .select('id, check_in_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', todayStart)
      .limit(1)
      .maybeSingle();

    if (existingCheckIn) {
      return {
        success: true,
        alreadyCheckedIn: true,
        data: {
          checkInId: existingCheckIn.id,
          checkInAt: existingCheckIn.check_in_at,
          memberName: member.full_name || 'Member',
          membershipStatus: member.membership_status || 'active',
          subscriptionEndDate: member.subscription_end_date,
          subscriptionWarning: false,
          blacklisted: false,
        },
      };
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
          timeZone: 'Asia/Kolkata',
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
    const todayStart = await getGymTodayStart(gymId);

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        id,
        check_in_at,
        check_out_at,
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
 * Check out a member by setting check_out_at on their most recent active check-in today.
 */
export async function checkOutMember(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();
    const todayStart = await getGymTodayStart(gymId, supabase);

    // Find today's check-in where check_out_at IS NULL
    const { data: activeCheckIn, error: findError } = await supabase
      .from('check_ins')
      .select('id')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', todayStart)
      .is('check_out_at', null)
      .order('check_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Failed to find active check-in:', findError);
      return { success: false, error: 'Failed to find active check-in' };
    }

    if (!activeCheckIn) {
      return { success: false, error: 'No active check-in found' };
    }

    const { error: updateError } = await supabase
      .from('check_ins')
      .update({ check_out_at: new Date().toISOString() })
      .eq('id', activeCheckIn.id);

    if (updateError) {
      console.error('Failed to check out:', updateError);
      return { success: false, error: 'Failed to check out' };
    }

    revalidatePath('/portal/dashboard');
    revalidatePath('/portal/check-ins');

    return { success: true };
  } catch (error: any) {
    console.error('Error checking out member:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get a member's active check-in today (no check-out, within last 3 hours).
 */
export async function getActiveCheckIn(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('check_ins')
      .select('id, check_in_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', threeHoursAgo)
      .is('check_out_at', null)
      .order('check_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to get active check-in:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('Error getting active check-in:', error);
    return null;
  }
}

/**
 * Get today's check-in status for a member:
 * - 'active': currently checked in (no check_out_at)
 * - 'checked-out': checked in today but already checked out, returns check_out_at
 * - 'none': no check-in today
 */
export async function getTodayCheckInStatus(memberId: string, gymId: string): Promise<{
  status: 'active' | 'checked-out' | 'none';
  checkOutAt?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('check_ins')
      .select('id, check_in_at, check_out_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', today.toISOString())
      .order('check_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return { status: 'none' };

    if (!data.check_out_at) return { status: 'active' };

    return { status: 'checked-out', checkOutAt: data.check_out_at };
  } catch {
    return { status: 'none' };
  }
}

/**
 * Count members currently in the gym (checked in within last 1.5 hours, not checked out).
 */
export async function getLiveGymTraffic(gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();
    const cutoff = new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('check_in_at', cutoff)
      .is('check_out_at', null);

    if (error) {
      console.error('Failed to get live gym traffic:', error);
      return 0;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error getting live gym traffic:', error);
    return 0;
  }
}

/**
 * Get the gym's peak hour based on historical check-in averages (last 30 days).
 * Returns the hour with the highest average check-ins per day, and that average count.
 */
export async function getPeakHourToday(gymId: string): Promise<{ hour: number; count: number } | null> {
  try {
    const supabase = createAdminSupabaseClient();

    // Get gym timezone
    let tz = 'Asia/Kolkata';
    try {
      const { data: gym } = await supabase.from('gyms').select('timezone').eq('id', gymId).single();
      if (gym?.timezone) tz = gym.timezone;
    } catch {}

    // Fetch check-ins from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('gym_id', gymId)
      .gte('check_in_at', thirtyDaysAgo);

    if (error || !data || data.length === 0) return null;

    // Count check-ins per hour, and track unique days per hour
    const hourTotals: Record<number, number> = {};
    const hourDays: Record<number, Set<string>> = {};

    for (const ci of data) {
      const dt = new Date(ci.check_in_at);
      const hourStr = dt.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
      const hour = parseInt(hourStr, 10);
      const dateStr = dt.toLocaleDateString('en-CA', { timeZone: tz });

      hourTotals[hour] = (hourTotals[hour] || 0) + 1;
      if (!hourDays[hour]) hourDays[hour] = new Set();
      hourDays[hour].add(dateStr);
    }

    // Find the hour with the highest average check-ins per day
    let peakHour = 0;
    let peakAvg = 0;
    for (const [h, total] of Object.entries(hourTotals)) {
      const hour = Number(h);
      const daysActive = hourDays[hour].size;
      const avg = total / daysActive;
      if (avg > peakAvg) {
        peakHour = hour;
        peakAvg = avg;
      }
    }

    return { hour: peakHour, count: Math.round(peakAvg) };
  } catch (error: any) {
    console.error('Error getting peak hour:', error);
    return null;
  }
}

/**
 * Count today's unique member check-ins.
 */
export async function getCheckInCount(gymId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const todayStart = await getGymTodayStart(gymId);

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

/**
 * Get average hourly gym traffic based on last 30 days of check-ins.
 * Returns an array of { hour, count } for hours 5-23 (5 AM to 11 PM).
 */
export async function getHourlyTrafficAverage(gymId: string): Promise<{ hour: number; count: number }[]> {
  try {
    const supabase = createAdminSupabaseClient();

    let tz = 'Asia/Kolkata';
    try {
      const { data: gym } = await supabase.from('gyms').select('timezone').eq('id', gymId).single();
      if (gym?.timezone) tz = gym.timezone;
    } catch {}

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('gym_id', gymId)
      .gte('check_in_at', thirtyDaysAgo);

    if (error || !data || data.length === 0) {
      // Return empty hours with 0 counts
      return Array.from({ length: 19 }, (_, i) => ({ hour: i + 5, count: 0 }));
    }

    // Count check-ins per hour and track unique days
    const hourTotals: Record<number, number> = {};
    const uniqueDays = new Set<string>();

    for (const ci of data) {
      const dt = new Date(ci.check_in_at);
      const hourStr = dt.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
      const hour = parseInt(hourStr, 10);
      const dateStr = dt.toLocaleDateString('en-CA', { timeZone: tz });

      hourTotals[hour] = (hourTotals[hour] || 0) + 1;
      uniqueDays.add(dateStr);
    }

    const totalDays = uniqueDays.size || 1;

    // Return hours 5 AM - 11 PM with averaged counts
    return Array.from({ length: 19 }, (_, i) => {
      const hour = i + 5;
      return {
        hour,
        count: Math.round((hourTotals[hour] || 0) / totalDays),
      };
    });
  } catch (error: any) {
    console.error('Error getting hourly traffic:', error);
    return Array.from({ length: 19 }, (_, i) => ({ hour: i + 5, count: 0 }));
  }
}
