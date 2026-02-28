'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail, sendCheckInConfirmation } from '@/lib/email/notifications';
import type { Gym, QRCode, Member } from '@/types/database';

// ============================================================
// GYM ACTIONS
// ============================================================

export async function updateGym(
  gymId: string,
  updates: Partial<Gym>
): Promise<{ success: boolean; data?: Gym; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('gyms')
      .update(updates)
      .eq('id', gymId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/${gymId}`);
    revalidatePath(`/${data.slug}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getGyms(): Promise<{ data: Gym[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function getGymById(id: string): Promise<{ data?: Gym; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getGymBySlug(slug: string): Promise<{ data?: Gym; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============================================================
// DASHBOARD SETTINGS
// ============================================================

import type { DashboardWidgetSettings } from '@/lib/dashboard-settings';
export type { DashboardWidgetSettings };

export async function updateDashboardSettings(
  gymId: string,
  widgets: DashboardWidgetSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    // Get existing settings to merge
    const { data: gym, error: fetchError } = await supabase
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .single();

    if (fetchError) throw fetchError;

    const existingSettings = (gym?.settings || {}) as Record<string, any>;
    const updatedSettings = {
      ...existingSettings,
      dashboard_widgets: widgets,
    };

    const { error } = await supabase
      .from('gyms')
      .update({ settings: updatedSettings })
      .eq('id', gymId);

    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// QR CODE ACTIONS
// ============================================================

export async function getQRCodes(gymId?: string): Promise<{ data: QRCode[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('qr_codes')
      .select('*, gym:gyms(name, slug)')
      .order('created_at', { ascending: false });

    if (gymId) {
      query = query.eq('gym_id', gymId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [] };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function getQRCodeByCode(code: string): Promise<{ data?: QRCode; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('qr_codes')
      .select('*, gym:gyms(*)')
      .eq('code', code)
      .single();

    if (error) throw error;
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============================================================
// MEMBER ACTIONS
// ============================================================

export async function getMembers(gymId: string): Promise<{ data: Member[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('members')
      .select('*, gym:gyms(name)')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function getMemberById(memberId: string): Promise<{ data?: Member; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createMember(formData: {
  gym_id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  birth_date?: string;
  gender?: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; data?: Member; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        ...formData,
        membership_status: 'active',
        member_since: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/members`);
    revalidatePath(`/payments`);
    return { success: true, data: member };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMember(
  memberId: string,
  updates: Partial<Member>
): Promise<{ success: boolean; data?: Member; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    // Store subscription_end_date in metadata as well, in case the column doesn't exist yet
    const endDate = updates.subscription_end_date;
    if (endDate) {
      const currentMeta = updates.metadata || {};
      updates.metadata = { ...currentMeta, subscription_end_date: endDate };
    }

    // Try update with subscription_end_date column first
    let { data: member, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    // If subscription_end_date column doesn't exist, retry without it
    if (error && error.message?.includes('subscription_end_date')) {
      const { subscription_end_date, ...updatesWithoutEndDate } = updates;
      const retry = await supabase
        .from('members')
        .update(updatesWithoutEndDate)
        .eq('id', memberId)
        .select()
        .single();
      member = retry.data;
      error = retry.error;
    }

    if (error) throw error;

    revalidatePath(`/members`);
    revalidatePath(`/members/${memberId}`);
    revalidatePath(`/payments`);
    return { success: true, data: member };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function identifyMemberByEmail(
  email: string,
  gymId: string
): Promise<{ data?: Member; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .eq('gym_id', gymId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function checkInMember(formData: {
  email: string;
  gymId: string;
  scanId?: string;
  adminOverride?: boolean;
}): Promise<{
  success: boolean;
  member?: Member;
  isNewMember?: boolean;
  error?: string;
  lastCheckIn?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    // 1. Try to find existing member
    const { data: existingMember } = await identifyMemberByEmail(formData.email, formData.gymId);

    let member: Member;
    const isNewMember = !existingMember;

    if (existingMember) {
      member = existingMember;
    } else {
      // 2. Create new member with trial status
      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert({
          gym_id: formData.gymId,
          email: formData.email,
          membership_status: 'trial',
        })
        .select()
        .single();

      if (createError) throw createError;
      member = newMember;
    }

    // 3. CHECK DAILY LIMIT — only 1 check-in per member per date
    if (!isNewMember && !formData.adminOverride) {
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id, check_in_at')
        .eq('member_id', member.id)
        .eq('gym_id', formData.gymId)
        .gte('check_in_at', todayDate)
        .limit(1)
        .maybeSingle();

      if (existingCheckIn) {
        return {
          success: false,
          error: 'DAILY_LIMIT_REACHED',
          lastCheckIn: existingCheckIn.check_in_at,
        };
      }
    }

    // 4. Update scan with member_id if scanId provided
    if (formData.scanId) {
      await supabase
        .from('scans')
        .update({ member_id: member.id })
        .eq('id', formData.scanId);
    }

    // 5. Create or update check-in
    let checkInTime = new Date().toISOString();
    if (formData.scanId) {
      // Find existing check-in for this scan
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('*')
        .eq('scan_id', formData.scanId)
        .single();

      if (existingCheckIn) {
        // Update existing check-in with member_id
        await supabase
          .from('check_ins')
          .update({ member_id: member.id })
          .eq('id', existingCheckIn.id);
        checkInTime = existingCheckIn.check_in_at;
      } else {
        // Create new check-in
        const { data: newCheckIn } = await supabase
          .from('check_ins')
          .insert({
            gym_id: formData.gymId,
            member_id: member.id,
            scan_id: formData.scanId,
            tags: ['qr-scan'],
          })
          .select()
          .single();

        if (newCheckIn) {
          checkInTime = newCheckIn.check_in_at;
        }
      }
    }

    // 6. Send email notifications (async, don't block check-in)
    // Get gym data for email
    const { data: gym } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', formData.gymId)
      .single();

    if (gym && member.email) {
      // Send emails asynchronously without blocking
      if (isNewMember) {
        // Send welcome email for new members
        sendWelcomeEmail(member, gym).catch((error) => {
          console.error('Failed to send welcome email:', error);
        });
      } else {
        // Send check-in confirmation for existing members
        // Get member stats
        const stats = await getMemberStats(member.id);

        sendCheckInConfirmation(member, gym, {
          checkInTime,
          totalCheckIns: stats.totalCheckIns,
          currentStreak: stats.currentStreak,
        }).catch((error) => {
          console.error('Failed to send check-in confirmation:', error);
        });
      }
    }

    return {
      success: true,
      member,
      isNewMember
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function approveMember(memberId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    // Get member data first to check for referral info
    const { data: member } = await supabase
      .from('members')
      .select('id, gym_id, metadata')
      .eq('id', memberId)
      .single();

    const { error } = await supabase
      .from('members')
      .update({
        membership_status: 'active',
        member_since: new Date().toISOString().split('T')[0],
      })
      .eq('id', memberId);

    if (error) throw error;

    // Process referral if member was referred
    if (member?.metadata?.referred_by) {
      const referralCode = member.metadata.referred_by;

      // Find the referrer by matching first 8 chars of member ID or phone
      const { data: referrer } = await supabase
        .from('members')
        .select('id')
        .eq('gym_id', member.gym_id)
        .or(`id.like.${referralCode}%,phone.eq.${referralCode}`)
        .limit(1)
        .single();

      if (referrer) {
        // Create referral record as converted since the member is being approved
        await supabase
          .from('referrals')
          .insert({
            gym_id: member.gym_id,
            referrer_member_id: referrer.id,
            referred_member_id: memberId,
            status: 'converted',
          });
      }
    }

    revalidatePath('/members');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectMember(memberId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;

    revalidatePath('/members');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncMemberStatuses(gymId: string): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    // Get all members for this gym
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id, membership_status, subscription_plan, subscription_start_date, member_since, metadata')
      .eq('gym_id', gymId);

    if (fetchError) throw fetchError;
    if (!members || members.length === 0) return { success: true, updated: 0 };

    const now = new Date();
    let updated = 0;

    for (const member of members) {
      // Use metadata fallback for subscription_end_date
      const subEndDate = (member as any).subscription_end_date || member.metadata?.subscription_end_date;

      // Skip members with manually managed statuses
      if (member.membership_status === 'cancelled' || member.membership_status === 'suspended') {
        continue;
      }

      // Skip pending members with no subscription info
      if (member.membership_status === 'pending' && !member.subscription_plan && !subEndDate) {
        continue;
      }

      // Skip trial members (they stay trial until manually changed or subscription is set)
      if (member.membership_status === 'trial') {
        continue;
      }

      let newStatus: string | null = null;

      if (subEndDate) {
        const endDate = new Date(subEndDate);

        if (endDate < now && member.membership_status === 'active') {
          // Subscription expired but still marked active -> set to expired
          newStatus = 'expired';
        } else if (endDate >= now && member.membership_status === 'expired') {
          // Subscription renewed (end date in future) but still marked expired -> set to active
          newStatus = 'active';
        }
      }

      if (newStatus && newStatus !== member.membership_status) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ membership_status: newStatus })
          .eq('id', member.id);

        if (!updateError) {
          updated++;
        }
      }
    }

    return { success: true, updated };
  } catch (error: any) {
    console.error('Error syncing member statuses:', error);
    return { success: false, updated: 0, error: error.message };
  }
}

export async function calculateMembershipStatus(member: Member): Promise<'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | 'trial'> {
  // If manually set to suspended or cancelled, respect that
  if (member.membership_status === 'suspended' || member.membership_status === 'cancelled') {
    return member.membership_status;
  }

  // If trial, keep as trial
  if (member.membership_status === 'trial') {
    return 'trial';
  }

  // If no subscription info, keep current status (trial members stay trial)
  if (!member.subscription_start_date || !member.subscription_plan) {
    return member.membership_status;
  }

  // For custom plans, we can't auto-calculate, so use manual status
  if (member.subscription_plan === 'custom') {
    return member.membership_status;
  }

  // Calculate if subscription has expired (use metadata fallback for end date)
  const endDateStr = member.subscription_end_date || member.metadata?.subscription_end_date;
  if (!endDateStr) return member.membership_status;
  const endDate = new Date(endDateStr);
  const now = new Date();

  if (endDate < now) {
    return 'expired';
  }

  return 'active';
}

export async function getMembersWithStats(gymId: string): Promise<{
  data: Array<Member & {
    stats: {
      totalCheckIns: number;
      totalWorkoutDays: number;
      lastCheckIn: string | null;
      currentStreak: number;
      averageSessionDuration: number;
    };
    calculatedStatus: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | 'trial';
  }>;
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    // Fetch all members
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (membersError) throw membersError;
    if (!membersData || membersData.length === 0) return { data: [] };

    const memberIds = membersData.map((m) => m.id);

    // Fetch ALL check-ins for these members in a single query
    const { data: allCheckIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('member_id, check_in_at, check_out_at, duration_minutes')
      .in('member_id', memberIds)
      .order('check_in_at', { ascending: false });

    if (checkInsError) throw checkInsError;

    // Group check-ins by member
    const checkInsByMember = new Map<string, typeof allCheckIns>();
    for (const ci of allCheckIns || []) {
      const existing = checkInsByMember.get(ci.member_id) || [];
      existing.push(ci);
      checkInsByMember.set(ci.member_id, existing);
    }

    // Compute stats per member
    const result = membersData.map((member) => {
      const checkIns = checkInsByMember.get(member.id) || [];
      const totalCheckIns = checkIns.length;

      const workoutDays = new Set(
        checkIns.map((ci) => new Date(ci.check_in_at).toDateString())
      );
      const totalWorkoutDays = workoutDays.size;
      const lastCheckIn = checkIns[0]?.check_in_at || null;

      let currentStreak = 0;
      if (checkIns.length > 0) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (workoutDays.has(today) || workoutDays.has(yesterday)) {
          currentStreak = 1;
        }
      }

      const totalDuration = checkIns.reduce((sum, ci) => sum + (ci.duration_minutes || 0), 0);
      const averageSessionDuration = totalCheckIns > 0 ? totalDuration / totalCheckIns : 0;

      // Calculate status inline (same logic as calculateMembershipStatus)
      // Use subscription_end_date from column or metadata fallback
      const memberEndDate = member.subscription_end_date || member.metadata?.subscription_end_date;
      let calculatedStatus: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | 'trial' = member.membership_status;
      if (member.membership_status !== 'suspended' && member.membership_status !== 'cancelled' && member.membership_status !== 'trial') {
        if (member.subscription_start_date && member.subscription_plan && member.subscription_plan !== 'custom' && memberEndDate) {
          const endDate = new Date(memberEndDate);
          calculatedStatus = endDate < new Date() ? 'expired' : 'active';
        }
      }

      return {
        ...member,
        stats: { totalCheckIns, totalWorkoutDays, lastCheckIn, currentStreak, averageSessionDuration },
        calculatedStatus,
      };
    });

    return { data: result };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function getMemberStats(memberId: string): Promise<{
  totalCheckIns: number;
  totalWorkoutDays: number;
  lastCheckIn: string | null;
  currentStreak: number;
  averageSessionDuration: number;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    // Get all check-ins for this member
    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('check_in_at, check_out_at, duration_minutes')
      .eq('member_id', memberId)
      .order('check_in_at', { ascending: false });

    if (error) throw error;

    const totalCheckIns = checkIns?.length || 0;

    // Calculate unique workout days
    const workoutDays = new Set(
      checkIns?.map(checkIn => 
        new Date(checkIn.check_in_at).toDateString()
      ) || []
    );
    const totalWorkoutDays = workoutDays.size;

    // Last check-in
    const lastCheckIn = checkIns?.[0]?.check_in_at || null;

    // Calculate current streak (consecutive days)
    let currentStreak = 0;
    if (checkIns && checkIns.length > 0) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      
      // Check if checked in today or yesterday
      const recentDays = new Set([today, yesterday]);
      const hasRecentCheckIn = Array.from(workoutDays).some(day => recentDays.has(day));
      
      if (hasRecentCheckIn) {
        // Simple streak calculation - in a real app, you'd want more sophisticated logic
        currentStreak = 1; // Placeholder
      }
    }

    // Average session duration
    const totalDuration = checkIns?.reduce((sum, checkIn) => sum + (checkIn.duration_minutes || 0), 0) || 0;
    const averageSessionDuration = totalCheckIns > 0 ? totalDuration / totalCheckIns : 0;

    return {
      totalCheckIns,
      totalWorkoutDays,
      lastCheckIn,
      currentStreak,
      averageSessionDuration,
    };
  } catch (error: any) {
    return {
      totalCheckIns: 0,
      totalWorkoutDays: 0,
      lastCheckIn: null,
      currentStreak: 0,
      averageSessionDuration: 0,
    };
  }
}

// ============================================================
// ANALYTICS ACTIONS
// ============================================================

export async function getScans(params: {
  gymId?: string;
  qrCodeId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ data: any[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('scans')
      .select('*, qr_code:qr_codes(name, code), member:members(full_name, email)')
      .order('scanned_at', { ascending: false });

    if (params.gymId) query = query.eq('gym_id', params.gymId);
    if (params.qrCodeId) query = query.eq('qr_code_id', params.qrCodeId);
    if (params.memberId) query = query.eq('member_id', params.memberId);
    if (params.startDate) query = query.gte('scanned_at', params.startDate);
    if (params.endDate) query = query.lte('scanned_at', params.endDate);
    if (params.limit) query = query.limit(params.limit);

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [] };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function getAnalyticsSummary(gymId: string): Promise<{
  totalScans: number;
  uniqueVisitors: number;
  todayScans: number;
  weekScans: number;
  topQRCode: { name: string; scans: number } | null;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get total scans
    const { count: totalScans } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId);

    // Get today's scans
    const { count: todayScans } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('scanned_at', today);

    // Get this week's scans
    const { count: weekScans } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('scanned_at', weekAgo);

    // Get top QR code
    const { data: topQR } = await supabase
      .from('qr_codes')
      .select('name, total_scans')
      .eq('gym_id', gymId)
      .order('total_scans', { ascending: false })
      .limit(1)
      .single();

    return {
      totalScans: totalScans || 0,
      uniqueVisitors: 0, // Calculate from scans
      todayScans: todayScans || 0,
      weekScans: weekScans || 0,
      topQRCode: topQR ? { name: topQR.name, scans: topQR.total_scans } : null,
    };
  } catch (error: any) {
    return {
      totalScans: 0,
      uniqueVisitors: 0,
      todayScans: 0,
      weekScans: 0,
      topQRCode: null,
      error: error.message,
    };
  }
}
