import { trackEvent } from '@/lib/analytics/tracking';
import { trpc } from '@/lib/api/trpc';
import { useAuth } from '@/providers/auth';
import { handleError } from '@/utils/error-handler';
import type { Notification } from '@shared';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

export function useNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const utils = trpc.useContext();

  // Existing mutations
  const registerToken = trpc.notifications.registerToken.useMutation();

  // TRPC queries following codebase pattern
  const { data, refetch } = trpc.notifications.getNotifications.useQuery(
    {},
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Poll every minute
      enabled: !!user, // Only fetch if user is authenticated
    }
  );

  // Extract notifications array from response
  const notifications = data?.notifications || [];

  // Mutations following pattern
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: (updatedNotification: Notification) => {
      // Update cache directly
      utils.notifications.getNotifications.setData(
        {},
        (old: typeof data) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: Notification) =>
              n._id === updatedNotification._id ? updatedNotification : n
            )
          };
        }
      );
    },
    onError: (error: any) => {
      handleError(error, 'Failed to mark notification as read');
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      // Refetch to get updated data
      utils.notifications.getNotifications.invalidate();
    },
  });

  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: (_: any, { notificationId }: { notificationId: string }) => {
      // Remove from cache
      utils.notifications.getNotifications.setData(
        {},
        (old: typeof data) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.filter((n: Notification) => n._id !== notificationId)
          };
        }
      );
    },
  });

  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter((n: Notification) => !n.readAt).length,
    [notifications]
  );

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications]
  );

  const registerForPushNotifications = async () => {
    // Only register on mobile
    if (Platform.OS === 'web') return null;

    try {
      // Mobile push notifications only
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return null;

      // Note: In production, you'll need to configure projectId in app.json
      // For now, we'll catch the error and skip token registration
      let expoPushToken;
      try {
        expoPushToken = await Notifications.getExpoPushTokenAsync({
          // This would be set in app.json: extra.eas.projectId
          projectId: undefined // Will use default from app.json if configured
        });
      } catch (error) {
        console.log('Push notifications not configured for Expo Go. Use a development build for full functionality.');
        return null;
      }

      // Device ID not available in newer Expo SDK - use token as ID
      const deviceId = expoPushToken.data;

      // Add/update token for this device
      // This should upsert based on deviceId to handle multiple devices
      await registerToken.mutateAsync({
        token: expoPushToken.data,
        deviceId,
        platform: Platform.OS as 'ios' | 'android',
      });

      return expoPushToken.data;
    } catch (error) {
      console.error('Failed to register:', error);
      return null;
    }
  };

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Track notification interaction
    trackEvent('notification_clicked', {
      notificationId: data?.notificationId,
      type: data?.type,
    });

    // For now, always navigate to home when notification is tapped
    router.push('/(tabs)/home');

    // Mark as read
    if (data?.notificationId) {
      markAsRead.mutate({ notificationId: data.notificationId });
    }
  }, [markAsRead, router]);

  // Handle notification interactions
  useEffect(() => {
    // When app is in foreground
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // When user taps notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [handleNotificationResponse]);

  return {
    // Data
    notifications: groupedNotifications,
    unreadCount,

    // Actions
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: (id: string) => deleteNotification.mutate({ notificationId: id }),
    refetch,

    // Existing returns
    registerForPushNotifications,
    handleNotificationResponse,
  };
}

// Helper function following existing patterns
function groupNotificationsByDate(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);

    if (date >= today) {
      groups.today.push(notification);
    } else if (date >= yesterday) {
      groups.yesterday.push(notification);
    } else if (date >= weekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
}