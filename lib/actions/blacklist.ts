'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/types/database';

// ============================================================
// BLACKLIST ACTIONS
// ============================================================

export async function blacklistMember(
  memberId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get member info for notification
    const { data: member } = await supabase
      .from('members')
      .select('full_name, gym_id')
      .eq('id', memberId)
      .single();

    const { error } = await supabase
      .from('members')
      .update({
        is_blacklisted: true,
        blacklisted_at: new Date().toISOString(),
        blacklist_reason: reason,
      })
      .eq('id', memberId);

    if (error) throw error;

    // Create notification for the gym owner
    if (member) {
      await supabase.from('notifications').insert({
        gym_id: member.gym_id,
        user_id: user.id,
        type: 'member_blacklisted',
        title: 'Member Blacklisted',
        message: `${member.full_name || 'A member'} has been blacklisted. Reason: ${reason}`,
        metadata: {
          member_id: memberId,
          member_name: member.full_name,
          reason,
        },
      });
    }

    revalidatePath('/dashboard/members');
    return { success: true };
  } catch (error: any) {
    console.error('Blacklist member error:', error);
    return { success: false, error: error.message };
  }
}

export async function unblacklistMember(memberId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('members')
      .update({
        is_blacklisted: false,
        blacklisted_at: null,
        blacklist_reason: null,
      })
      .eq('id', memberId);

    if (error) throw error;

    revalidatePath('/dashboard/members');
    return { success: true };
  } catch (error: any) {
    console.error('Unblacklist member error:', error);
    return { success: false, error: error.message };
  }
}

export async function getBlacklistedMembers(gymId: string): Promise<{
  success: boolean;
  data?: Member[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_blacklisted', true)
      .order('blacklisted_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get blacklisted members error:', error);
    return { success: false, error: error.message };
  }
}

export async function checkBlacklistOnScan(
  memberId: string,
  gymId: string
): Promise<{
  isBlacklisted: boolean;
  reason?: string;
}> {
  try {
    // Use admin client since this is called during QR scan (no auth user)
    const supabase = createAdminSupabaseClient();

    const { data: member, error } = await supabase
      .from('members')
      .select('is_blacklisted, blacklist_reason, full_name')
      .eq('id', memberId)
      .single();

    if (error) throw error;

    if (member?.is_blacklisted) {
      // Get gym owner for notification
      const { data: gym } = await supabase
        .from('gyms')
        .select('owner_id')
        .eq('id', gymId)
        .single();

      if (gym?.owner_id) {
        // Create notification for gym owner
        await supabase.from('notifications').insert({
          gym_id: gymId,
          user_id: gym.owner_id,
          type: 'blacklisted_scan',
          title: 'Blacklisted Member Scanned QR',
          message: `Blacklisted member ${member.full_name || 'Unknown'} just scanned QR code.`,
          metadata: {
            member_id: memberId,
            member_name: member.full_name,
            reason: member.blacklist_reason,
          },
        });
      }

      return { isBlacklisted: true, reason: member.blacklist_reason || undefined };
    }

    return { isBlacklisted: false };
  } catch (error: any) {
    console.error('Check blacklist on scan error:', error);
    // Default to not blacklisted on error to not block scan
    return { isBlacklisted: false };
  }
}
