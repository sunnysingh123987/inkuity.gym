'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Referral, ReferralWithMembers } from '@/types/database';

// ============================================================
// REFERRALS ACTIONS
// ============================================================

export async function getReferrals(gymId: string): Promise<{
  success: boolean;
  data?: ReferralWithMembers[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referrer:members!referrals_referrer_member_id_fkey(id, full_name, email),
        referred:members!referrals_referred_member_id_fkey(id, full_name, email)
      `)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: (data || []) as ReferralWithMembers[] };
  } catch (error: any) {
    console.error('Get referrals error:', error);
    return { success: false, error: error.message };
  }
}

export async function createReferral(data: {
  gym_id: string;
  referrer_member_id: string;
  referred_member_id: string;
}): Promise<{ success: boolean; data?: Referral; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: referral, error } = await supabase
      .from('referrals')
      .insert({
        gym_id: data.gym_id,
        referrer_member_id: data.referrer_member_id,
        referred_member_id: data.referred_member_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data: referral };
  } catch (error: any) {
    console.error('Create referral error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateReferralStatus(
  referralId: string,
  status: string,
  bonusType?: string,
  bonusValue?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const updates: Record<string, any> = { status };

    if (bonusType) updates.bonus_type = bonusType;
    if (bonusValue !== undefined) updates.bonus_value = bonusValue;
    if (bonusType || bonusValue !== undefined) {
      updates.bonus_applied_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('referrals')
      .update(updates)
      .eq('id', referralId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Update referral status error:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemberReferrals(memberId: string): Promise<{
  success: boolean;
  data?: ReferralWithMembers[];
  error?: string;
}> {
  try {
    // Use admin client since members access via portal
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referrer:members!referrals_referrer_member_id_fkey(id, full_name, email),
        referred:members!referrals_referred_member_id_fkey(id, full_name, email)
      `)
      .eq('referrer_member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: (data || []) as ReferralWithMembers[] };
  } catch (error: any) {
    console.error('Get member referrals error:', error);
    return { success: false, error: error.message };
  }
}

export async function getReferralStats(gymId: string): Promise<{
  success: boolean;
  data?: {
    totalReferrals: number;
    convertedCount: number;
    pendingCount: number;
  };
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId);

    const { count: convertedCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'converted');

    const { count: pendingCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'pending');

    return {
      success: true,
      data: {
        totalReferrals: totalReferrals || 0,
        convertedCount: convertedCount || 0,
        pendingCount: pendingCount || 0,
      },
    };
  } catch (error: any) {
    console.error('Get referral stats error:', error);
    return { success: false, error: error.message };
  }
}
