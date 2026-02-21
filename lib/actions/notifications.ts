'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { Notification } from '@/types/database';

export async function createNotification(data: {
  gym_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .insert({
        gym_id: data.gym_id,
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNotifications(userId: string): Promise<{ data: Notification[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return { data: data || [] };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

export async function markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = createServerSupabaseClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Check for members whose subscriptions are expiring or recently expired.
 * Creates notifications at T-3, T-0, T+1, T+3 days relative to end date.
 */
export async function checkSubscriptionExpiry(gymId: string): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();

    // Get gym owner
    const { data: gym } = await supabase
      .from('gyms')
      .select('owner_id, name')
      .eq('id', gymId)
      .single();

    if (!gym) return;

    const now = new Date();
    const checkPoints = [
      { days: -3, label: 'expires in 3 days' },
      { days: 0, label: 'expires today' },
      { days: 1, label: 'expired yesterday' },
      { days: 3, label: 'expired 3 days ago' },
    ];

    for (const point of checkPoints) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + point.days);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Find members whose subscription end date matches
      const { data: members } = await supabase
        .from('members')
        .select('id, full_name, subscription_end_date')
        .eq('gym_id', gymId)
        .eq('subscription_end_date', dateStr)
        .in('membership_status', ['active', 'expired']);

      if (!members || members.length === 0) continue;

      for (const member of members) {
        // Check if notification already exists for this member + date combo
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', gym.owner_id)
          .eq('type', 'subscription_expiry')
          .contains('metadata', { member_id: member.id, check_date: dateStr })
          .limit(1);

        if (existing && existing.length > 0) continue;

        await supabase.from('notifications').insert({
          gym_id: gymId,
          user_id: gym.owner_id,
          type: 'subscription_expiry',
          title: `Subscription ${point.days <= 0 ? 'Expiring' : 'Expired'}`,
          message: `${member.full_name || 'A member'}'s subscription ${point.label}.`,
          metadata: {
            member_id: member.id,
            member_name: member.full_name,
            check_date: dateStr,
            days_offset: point.days,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
  }
}
