'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Announcement } from '@/types/database';
import { sendAnnouncementEmail } from '@/lib/email/notifications';

export type MemberStatusTag = 'active' | 'trial' | 'expired' | 'pending';

// ============================================================
// ANNOUNCEMENTS ACTIONS
// ============================================================

export async function getAnnouncements(gymId: string): Promise<{
  success: boolean;
  data?: Announcement[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get announcements error:', error);
    return { success: false, error: error.message };
  }
}

export async function getActiveAnnouncements(gymId: string): Promise<{
  success: boolean;
  data?: Announcement[];
  error?: string;
}> {
  try {
    // Use admin client for member portal access
    const supabase = createAdminSupabaseClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get active announcements error:', error);
    return { success: false, error: error.message };
  }
}

export async function createAnnouncement(data: {
  gym_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'emergency' | 'holiday' | 'closure';
  starts_at?: string;
  ends_at?: string;
  notify_members?: boolean;
  selected_tags?: MemberStatusTag[];
}): Promise<{ success: boolean; data?: Announcement; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        gym_id: data.gym_id,
        title: data.title,
        message: data.message,
        type: data.type,
        starts_at: data.starts_at || new Date().toISOString(),
        ends_at: data.ends_at || null,
        is_active: true,
        notify_members: data.notify_members || false,
      })
      .select()
      .single();

    if (error) throw error;

    // If notify_members is true, send emails to matching members
    if (data.notify_members && data.selected_tags && data.selected_tags.length > 0) {
      const emailResult = await sendAnnouncementToMembers({
        gymId: data.gym_id,
        tags: data.selected_tags,
        announcementTitle: data.title,
        announcementMessage: data.message,
        announcementType: data.type,
      });

      await supabase.from('notifications').insert({
        gym_id: data.gym_id,
        user_id: user.id,
        type: 'announcement_sent',
        title: 'Announcement Published',
        message: `Your announcement "${data.title}" has been published. Emails sent to ${emailResult.sentCount} member(s).${emailResult.failedCount > 0 ? ` ${emailResult.failedCount} failed.` : ''}`,
        metadata: {
          announcement_id: announcement.id,
          announcement_title: data.title,
          emails_sent: emailResult.sentCount,
          emails_failed: emailResult.failedCount,
        },
      });
    } else if (data.notify_members) {
      await supabase.from('notifications').insert({
        gym_id: data.gym_id,
        user_id: user.id,
        type: 'announcement_sent',
        title: 'Announcement Published',
        message: `Your announcement "${data.title}" has been published and members will be notified.`,
        metadata: {
          announcement_id: announcement.id,
          announcement_title: data.title,
        },
      });
    }

    revalidatePath('/dashboard');
    return { success: true, data: announcement };
  } catch (error: any) {
    console.error('Create announcement error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAnnouncement(
  announcementId: string,
  updates: Partial<Announcement>,
  options?: { selected_tags?: MemberStatusTag[] }
): Promise<{ success: boolean; data?: Announcement; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', announcementId)
      .select()
      .single();

    if (error) throw error;

    // If notify_members is being set to true with tags, send emails
    if (updates.notify_members && options?.selected_tags && options.selected_tags.length > 0 && data) {
      const emailResult = await sendAnnouncementToMembers({
        gymId: data.gym_id,
        tags: options.selected_tags,
        announcementTitle: data.title,
        announcementMessage: data.message,
        announcementType: data.type,
      });

      await supabase.from('notifications').insert({
        gym_id: data.gym_id,
        user_id: user.id,
        type: 'announcement_sent',
        title: 'Announcement Updated & Sent',
        message: `Your announcement "${data.title}" has been updated. Emails sent to ${emailResult.sentCount} member(s).${emailResult.failedCount > 0 ? ` ${emailResult.failedCount} failed.` : ''}`,
        metadata: {
          announcement_id: data.id,
          announcement_title: data.title,
          emails_sent: emailResult.sentCount,
          emails_failed: emailResult.failedCount,
        },
      });
    }

    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error: any) {
    console.error('Update announcement error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// HELPER: Fetch members by tags and send announcement emails
// ============================================================

async function sendAnnouncementToMembers(params: {
  gymId: string;
  tags: MemberStatusTag[];
  announcementTitle: string;
  announcementMessage: string;
  announcementType: 'info' | 'warning' | 'emergency' | 'holiday' | 'closure';
}): Promise<{ sentCount: number; failedCount: number }> {
  try {
    const adminSupabase = createAdminSupabaseClient();

    // Fetch gym details for email branding
    const { data: gym } = await adminSupabase
      .from('gyms')
      .select('name, logo_url')
      .eq('id', params.gymId)
      .single();

    if (!gym) {
      console.error('Gym not found for announcement email:', params.gymId);
      return { sentCount: 0, failedCount: 0 };
    }

    // Fetch members matching the selected status tags
    const { data: members, error } = await adminSupabase
      .from('members')
      .select('email, full_name')
      .eq('gym_id', params.gymId)
      .in('membership_status', params.tags)
      .not('email', 'is', null);

    if (error) {
      console.error('Error fetching members for announcement:', error);
      return { sentCount: 0, failedCount: 0 };
    }

    if (!members || members.length === 0) {
      console.log('No members found matching tags:', params.tags);
      return { sentCount: 0, failedCount: 0 };
    }

    // Send emails via the notification service
    const result = await sendAnnouncementEmail({
      members: members as { email: string; full_name: string | null }[],
      gymName: gym.name,
      gymLogo: gym.logo_url,
      announcementTitle: params.announcementTitle,
      announcementMessage: params.announcementMessage,
      announcementType: params.announcementType,
    });

    return { sentCount: result.sentCount, failedCount: result.failedCount };
  } catch (error: any) {
    console.error('sendAnnouncementToMembers error:', error);
    return { sentCount: 0, failedCount: 0 };
  }
}
