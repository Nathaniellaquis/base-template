import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/auth';
import { trpc } from '@/lib/api/trpc';
import { useEffect, useMemo, useCallback } from 'react';
import { handleError } from '@/utils/error-handler';
import { trackEvent } from '@/lib/analytics';
import type { Notification } from '@shared/types/notification';

export function useNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();
  
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
    onSuccess: (updatedNotification) => {
      // Update cache directly
      utils.notifications.getNotifications.setData(
        undefined,
        (old) => old?.map(n => 
          n._id === updatedNotification._id ? updatedNotification : n
        )
      );
    },
    onError: (error) => {
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
    onSuccess: (_, { id }) => {
      // Remove from cache
      utils.notifications.getNotifications.setData(
        undefined,
        (old) => old?.filter(n => n._id !== id)
      );
    },
  });
  
  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
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
  
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Track notification interaction
    analytics.track('notification_clicked', {
      notificationId: data?.notificationId,
      type: data?.type,
      hasDeepLink: !!data?.deepLink,
    });
    
    if (data?.deepLink) {
      // Navigate based on notification type and deep link
      switch (data.type) {
        case 'payment':
          if (data.paymentId) {
            router.push(`/(tabs)/settings/payment-methods`);
          } else if (data.action === 'subscription_expired') {
            router.push(`/(tabs)/settings`);
          } else {
            router.push(`/(tabs)/settings`);
          }
          break;
          
        case 'user':
          if (data.userId === user?._id) {
            router.push(`/(tabs)/profile`);
          } else {
            // Could navigate to a public profile view in the future
            router.push(`/(tabs)/home`);
          }
          break;
          
        case 'social':
          // Navigate to relevant social feature
          if (data.action === 'new_follower') {
            router.push(`/(tabs)/profile`);
          } else {
            router.push(`/(tabs)/notifications`);
          }
          break;
          
        case 'update':
          // System updates, feature announcements
          if (data.featureId) {
            // Could navigate to feature-specific screens
            router.push(`/(tabs)/home`);
          } else {
            router.push(`/(tabs)/notifications`);
          }
          break;
          
        case 'reminder':
        default:
          // Default to notifications list
          router.push(`/(tabs)/notifications`);
      }
    } else {
      // No deep link, go to notifications
      router.push(`/(tabs)/notifications`);
    }
    
    // Mark as read
    if (data?.notificationId) {
      markAsRead.mutate({ notificationId: data.notificationId });
    }
  }, [markAsRead, router, user?._id]);

  return {
    // Data
    notifications: groupedNotifications,
    unreadCount,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
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