'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Announcement } from '@/types/database';

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

    // If notify_members is true, create a confirmation notification for the gym owner
    if (data.notify_members) {
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
  updates: Partial<Announcement>
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
