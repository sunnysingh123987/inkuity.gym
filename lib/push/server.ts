import webpush from 'web-push';

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@inkuity.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
  payload: PushPayload
): Promise<{ success: boolean; statusCode?: number }> {
  try {
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys_p256dh,
          auth: subscription.keys_auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true, statusCode: result.statusCode };
  } catch (error: any) {
    // 410 Gone or 404 means subscription is no longer valid
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, statusCode: error.statusCode };
    }
    console.error('Push send error:', error);
    return { success: false, statusCode: error.statusCode };
  }
}
