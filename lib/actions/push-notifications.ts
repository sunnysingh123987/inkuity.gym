'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendPushNotification, type PushPayload } from '@/lib/push/server';

/**
 * Save a push subscription for a member. Upserts by (member_id, endpoint).
 * Also sets metadata.notification_preferences.push_enabled = true.
 */
export async function savePushSubscription(
  memberId: string,
  gymId: string,
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string }
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Upsert subscription
    const { error: subError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          member_id: memberId,
          gym_id: gymId,
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys_p256dh,
          keys_auth: subscription.keys_auth,
        },
        { onConflict: 'member_id,endpoint' }
      );

    if (subError) throw subError;

    // Update member metadata to mark push as enabled
    const { data: member } = await supabase
      .from('members')
      .select('metadata')
      .eq('id', memberId)
      .single();

    const currentMetadata = member?.metadata || {};
    const currentPrefs = currentMetadata.notification_preferences || {};

    await supabase
      .from('members')
      .update({
        metadata: {
          ...currentMetadata,
          notification_preferences: {
            ...currentPrefs,
            push_enabled: true,
            push_meal_reminders: currentPrefs.push_meal_reminders !== false,
            push_workout_reminders: currentPrefs.push_workout_reminders !== false,
            push_tracker_reminders: currentPrefs.push_tracker_reminders !== false,
          },
        },
      })
      .eq('id', memberId);

    return { success: true };
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove all push subscriptions for a member and reset push prefs.
 */
export async function removePushSubscription(memberId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    // Delete all subscriptions for this member
    const { error: delError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('member_id', memberId);

    if (delError) throw delError;

    // Reset push preferences
    const { data: member } = await supabase
      .from('members')
      .select('metadata')
      .eq('id', memberId)
      .single();

    const currentMetadata = member?.metadata || {};
    const currentPrefs = currentMetadata.notification_preferences || {};

    await supabase
      .from('members')
      .update({
        metadata: {
          ...currentMetadata,
          notification_preferences: {
            ...currentPrefs,
            push_enabled: false,
            push_meal_reminders: false,
            push_workout_reminders: false,
            push_tracker_reminders: false,
          },
        },
      })
      .eq('id', memberId);

    return { success: true };
  } catch (error: any) {
    console.error('Error removing push subscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to all subscriptions for a member.
 * Automatically cleans up expired/invalid subscriptions (410/404).
 */
export async function sendPushToMember(memberId: string, payload: PushPayload) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('member_id', memberId);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) return { success: true, sent: 0 };

    let sent = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const result = await sendPushNotification(sub, payload);
      if (result.success) {
        sent++;
      } else if (result.statusCode === 410 || result.statusCode === 404) {
        expiredEndpoints.push(sub.endpoint);
      }
    }

    // Cleanup expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('member_id', memberId)
        .in('endpoint', expiredEndpoints);
    }

    return { success: true, sent };
  } catch (error: any) {
    console.error('Error sending push to member:', error);
    return { success: false, error: error.message, sent: 0 };
  }
}
