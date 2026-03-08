'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { GymReview, GymReviewWithMember, FeedbackRequest, FeedbackRequestWithMember, FeedbackMessage } from '@/types/database';

// ============================================================
// REVIEWS ACTIONS
// ============================================================

export async function getGymReviews(gymId: string): Promise<{
  success: boolean;
  data?: GymReviewWithMember[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: reviews, error } = await supabase
      .from('gym_reviews')
      .select(`*, member:members(id, full_name, avatar_url)`)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: (reviews || []) as GymReviewWithMember[] };
  } catch (error: any) {
    console.error('Get gym reviews error:', error);
    return { success: false, error: error.message };
  }
}

export async function createReview(data: {
  gym_id: string;
  member_id: string;
  rating: number;
  review_text?: string;
  is_public?: boolean;
}): Promise<{ success: boolean; data?: GymReview; error?: string }> {
  try {
    // Use admin client since members don't have auth.users access
    const supabase = createAdminSupabaseClient();

    const { data: review, error } = await supabase
      .from('gym_reviews')
      .insert({
        gym_id: data.gym_id,
        member_id: data.member_id,
        rating: data.rating,
        review_text: data.review_text || null,
        is_public: data.is_public !== undefined ? data.is_public : true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data: review };
  } catch (error: any) {
    console.error('Create review error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateReview(
  reviewId: string,
  data: {
    rating: number;
    review_text?: string;
    is_public?: boolean;
  }
): Promise<{ success: boolean; data?: GymReview; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: review, error } = await supabase
      .from('gym_reviews')
      .update({
        rating: data.rating,
        review_text: data.review_text || null,
        is_public: data.is_public !== undefined ? data.is_public : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data: review };
  } catch (error: any) {
    console.error('Update review error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPublicGymReviews(gymId: string): Promise<{
  success: boolean;
  data?: GymReviewWithMember[];
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: reviews, error } = await supabase
      .from('gym_reviews')
      .select(`*, member:members(id, full_name, avatar_url)`)
      .eq('gym_id', gymId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return { success: true, data: (reviews || []) as GymReviewWithMember[] };
  } catch (error: any) {
    console.error('Get public gym reviews error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteReview(reviewId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('gym_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Delete review error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// FEEDBACK REQUESTS ACTIONS
// ============================================================

export async function sendFeedbackRequest(
  gymId: string,
  memberIds: string[]
): Promise<{ success: boolean; data?: FeedbackRequest[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const feedbackRequests = memberIds.map((memberId) => ({
      gym_id: gymId,
      member_id: memberId,
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('feedback_requests')
      .insert(feedbackRequests)
      .select();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Send feedback request error:', error);
    return { success: false, error: error.message };
  }
}

export async function getFeedbackRequests(gymId: string): Promise<{
  success: boolean;
  data?: FeedbackRequestWithMember[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('feedback_requests')
      .select(`*, member:members(id, full_name, email, phone)`)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: (data || []) as FeedbackRequestWithMember[] };
  } catch (error: any) {
    console.error('Get feedback requests error:', error);
    return { success: false, error: error.message };
  }
}

export async function respondToFeedback(
  requestId: string,
  data: { response_text: string; response_rating: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use admin client since members respond via portal
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('feedback_requests')
      .update({
        response_text: data.response_text,
        response_rating: data.response_rating,
        responded_at: new Date().toISOString(),
        status: 'responded',
      })
      .eq('id', requestId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Respond to feedback error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// FEEDBACK CHAT ACTIONS
// ============================================================

export async function getFeedbackMessages(
  memberId: string,
  gymId: string
): Promise<{ success: boolean; data?: FeedbackMessage[]; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('feedback_messages')
      .select('*')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data: (data || []) as FeedbackMessage[] };
  } catch (error: any) {
    console.error('Get feedback messages error:', error);
    return { success: false, error: error.message };
  }
}

const MAX_CONSECUTIVE_MEMBER_MESSAGES = 5;

export async function sendFeedbackMessage(
  memberId: string,
  gymId: string,
  message: string
): Promise<{ success: boolean; data?: FeedbackMessage; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    // Enforce consecutive message limit
    const { data: recent } = await supabase
      .from('feedback_messages')
      .select('sender_type')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })
      .limit(MAX_CONSECUTIVE_MEMBER_MESSAGES);

    if (
      recent &&
      recent.length >= MAX_CONSECUTIVE_MEMBER_MESSAGES &&
      recent.every((m) => m.sender_type === 'member')
    ) {
      return { success: false, error: 'Please wait for a reply before sending more messages.' };
    }

    const { data, error } = await supabase
      .from('feedback_messages')
      .insert({
        gym_id: gymId,
        member_id: memberId,
        message: message.trim(),
        sender_type: 'member',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as FeedbackMessage };
  } catch (error: any) {
    console.error('Send feedback message error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// ADMIN — INKUITY FEEDBACK INBOX
// ============================================================

export interface FeedbackConversation {
  member_id: string;
  gym_id: string;
  member_name: string;
  member_email: string | null;
  gym_name: string;
  last_message: string;
  last_message_at: string;
  last_sender: 'member' | 'inkuity';
  unread_count: number;
}

export async function getAllFeedbackConversations(): Promise<{
  success: boolean;
  data?: FeedbackConversation[];
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: messages, error } = await supabase
      .from('feedback_messages')
      .select('*, member:members(full_name, email), gym:gyms(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by (member_id, gym_id) — pick latest message per conversation
    const convMap = new Map<string, FeedbackConversation>();

    for (const msg of messages || []) {
      const key = `${msg.member_id}::${msg.gym_id}`;
      const memberData = Array.isArray(msg.member) ? msg.member[0] : msg.member;
      const gymData = Array.isArray(msg.gym) ? msg.gym[0] : msg.gym;

      if (!convMap.has(key)) {
        convMap.set(key, {
          member_id: msg.member_id,
          gym_id: msg.gym_id,
          member_name: memberData?.full_name || 'Unknown',
          member_email: memberData?.email || null,
          gym_name: gymData?.name || 'Unknown Gym',
          last_message: msg.message,
          last_message_at: msg.created_at,
          last_sender: msg.sender_type,
          unread_count: 0,
        });
      }

      // Count unread member messages
      if (msg.sender_type === 'member' && !msg.read_at) {
        const conv = convMap.get(key)!;
        conv.unread_count++;
      }
    }

    const conversations = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    return { success: true, data: conversations };
  } catch (error: any) {
    console.error('Get all feedback conversations error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendInkuityReply(
  memberId: string,
  gymId: string,
  message: string
): Promise<{ success: boolean; data?: FeedbackMessage; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('feedback_messages')
      .insert({
        gym_id: gymId,
        member_id: memberId,
        message: message.trim(),
        sender_type: 'inkuity',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as FeedbackMessage };
  } catch (error: any) {
    console.error('Send inkuity reply error:', error);
    return { success: false, error: error.message };
  }
}

export async function markConversationRead(
  memberId: string,
  gymId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('feedback_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('sender_type', 'member')
      .is('read_at', null);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Mark conversation read error:', error);
    return { success: false, error: error.message };
  }
}
