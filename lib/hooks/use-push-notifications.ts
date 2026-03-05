'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/push/client';
import {
  savePushSubscription,
  removePushSubscription,
} from '@/lib/actions/push-notifications';

interface UsePushNotificationsOptions {
  memberId: string;
  gymId: string;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications({
  memberId,
  gymId,
}: UsePushNotificationsOptions): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check support and current subscription on mount
  useEffect(() => {
    const init = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        const sub = await getCurrentSubscription();
        setIsSubscribed(!!sub);
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (!subscription) {
        setPermission(Notification.permission);
        setIsLoading(false);
        return false;
      }

      const subJson = subscription.toJSON();
      const result = await savePushSubscription(memberId, gymId, {
        endpoint: subJson.endpoint!,
        keys_p256dh: subJson.keys!.p256dh!,
        keys_auth: subJson.keys!.auth!,
      });

      if (result.success) {
        setIsSubscribed(true);
        setPermission('granted');
        setIsLoading(false);
        return true;
      }

      // Rollback browser subscription if DB save failed
      await unsubscribeFromPush();
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, memberId, gymId]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const unsubbed = await unsubscribeFromPush();
      if (unsubbed) {
        await removePushSubscription(memberId);
        setIsSubscribed(false);
      }
      setIsLoading(false);
      return unsubbed;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      setIsLoading(false);
      return false;
    }
  }, [memberId]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
