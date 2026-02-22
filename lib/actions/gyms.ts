'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { generateQRCodeIdentifier, generateGymSlug } from '@/lib/utils/qr';
import { sendWelcomeEmail, sendCheckInConfirmation } from '@/lib/email/notifications';
import type { Gym, QRCode, Member } from '@/types/database';

// ============================================================
// GYM ACTIONS
// ============================================================

export async function createGym(formData: {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
}): Promise<{ success: boolean; data?: Gym; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Generate unique slug
    let slug = generateGymSlug(formData.name);
    let counter = 1;

    // Check if slug exists and append number if needed
    while (true) {
      const { data: existing } = await supabase
        .from('gyms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) break;
      slug = `${generateGymSlug(formData.name)}-${counter}`;
      counter++;
    }

    const { data: gym, error } = await supabase
      .from('gyms')
      .insert({
        owner_id: user.id,
        name: formData.name,
        slug,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        phone: formData.phone,
        email: formData.email,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/gyms');
    return { success: true, data: gym };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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
// QR CODE ACTIONS
// ============================================================

export async function createQRCode(formData: {
  gym_id: string;
  name: string;
  label?: string;
  type: 'check-in' | 'equipment' | 'class' | 'promotion' | 'custom';
  redirect_url?: string;
  primary_color?: string;
  background_color?: string;
  frame_style?: string;
}): Promise<{ success: boolean; data?: QRCode; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const code = generateQRCodeIdentifier();

    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .insert({
        gym_id: formData.gym_id,
        code,
        name: formData.name,
        label: formData.label,
        type: formData.type,
        redirect_url: formData.redirect_url,
        design_settings: {
          primaryColor: formData.primary_color || '#000000',
          backgroundColor: formData.background_color || '#FFFFFF',
          frameStyle: formData.frame_style || 'square',
        },
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/qr-codes');
    return { success: true, data: qrCode };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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

export async function updateQRCode(
  qrId: string,
  updates: Partial<QRCode>
): Promise<{ success: boolean; data?: QRCode; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', qrId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/qr-codes');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQRCode(qrId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', qrId);

    if (error) throw error;

    revalidatePath('/dashboard/qr-codes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    const supabase = createServerSupabaseClient();

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

    revalidatePath(`/dashboard/members`);
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
    const supabase = createServerSupabaseClient();

    const { data: member, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/dashboard/members`);
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

    // 3. CHECK DAILY LIMIT (unless admin override or new member)
    if (!isNewMember && !formData.adminOverride) {
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('check_daily_checkin_limit', {
          p_member_id: member.id,
          p_gym_id: formData.gymId,
        });

      if (limitError) {
        console.error('Error checking daily limit:', limitError);
        // Continue anyway - don't block check-in on limit check failure
      } else if (limitCheck && limitCheck.length > 0) {
        const { can_check_in, last_checkin_at } = limitCheck[0];

        if (!can_check_in) {
          return {
            success: false,
            error: 'DAILY_LIMIT_REACHED',
            lastCheckIn: last_checkin_at,
          };
        }
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
      .select('id, membership_status, subscription_plan, subscription_start_date, subscription_end_date, member_since')
      .eq('gym_id', gymId);

    if (fetchError) throw fetchError;
    if (!members || members.length === 0) return { success: true, updated: 0 };

    const now = new Date();
    let updated = 0;

    for (const member of members) {
      // Skip members with manually managed statuses
      if (member.membership_status === 'cancelled' || member.membership_status === 'suspended') {
        continue;
      }

      // Skip pending members with no subscription info
      if (member.membership_status === 'pending' && !member.subscription_plan && !member.subscription_end_date) {
        continue;
      }

      // Skip trial members (they stay trial until manually changed or subscription is set)
      if (member.membership_status === 'trial') {
        continue;
      }

      let newStatus: string | null = null;

      if (member.subscription_end_date) {
        const endDate = new Date(member.subscription_end_date);

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

  // Calculate if subscription has expired
  const endDate = new Date(member.subscription_end_date!);
  const now = new Date();

  if (endDate < now) {
    return 'expired';
  }

  return 'active';
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
