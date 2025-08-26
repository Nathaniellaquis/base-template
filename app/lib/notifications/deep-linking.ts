import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { trackEvent } from '@/lib/analytics';

/**
 * Deep linking configuration for notifications
 * Handles navigation when users tap on push notifications
 */

export interface NotificationDeepLink {
  type: 'payment' | 'user' | 'social' | 'update' | 'reminder';
  action?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

/**
 * Parse deep link URL to extract navigation intent
 */
export function parseDeepLink(url: string): NotificationDeepLink | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) return null;
    
    const type = pathParts[0] as NotificationDeepLink['type'];
    const action = pathParts[1];
    const targetId = pathParts[2];
    
    // Extract query parameters as metadata
    const metadata: Record<string, any> = {};
    parsed.searchParams.forEach((value, key) => {
      metadata[key] = value;
    });
    
    return {
      type,
      action,
      targetId,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}

/**
 * Navigate based on notification deep link data
 */
export function navigateFromNotification(data: NotificationDeepLink & { notificationId?: string }) {
  // Track navigation
  analytics.track('notification_deep_link_navigation', {
    type: data.type,
    action: data.action,
    hasTargetId: !!data.targetId,
    notificationId: data.notificationId,
  });
  
  switch (data.type) {
    case 'payment':
      handlePaymentNavigation(data);
      break;
      
    case 'user':
      handleUserNavigation(data);
      break;
      
    case 'social':
      handleSocialNavigation(data);
      break;
      
    case 'update':
      handleUpdateNavigation(data);
      break;
      
    case 'reminder':
    default:
      // Default to notifications list
      router.push('/(tabs)/notifications');
  }
}

function handlePaymentNavigation(data: NotificationDeepLink) {
  switch (data.action) {
    case 'subscription_expired':
    case 'subscription_expiring':
      router.push('/(tabs)/settings');
      break;
      
    case 'payment_failed':
    case 'payment_method_required':
      router.push('/(tabs)/settings/payment-methods');
      break;
      
    case 'invoice_ready':
      if (data.metadata?.invoiceUrl) {
        // Open invoice in browser
        Linking.openURL(data.metadata.invoiceUrl);
      } else {
        router.push('/(tabs)/settings');
      }
      break;
      
    default:
      router.push('/(tabs)/settings');
  }
}

function handleUserNavigation(data: NotificationDeepLink) {
  switch (data.action) {
    case 'profile_update':
    case 'achievement_unlocked':
      router.push('/(tabs)/profile');
      break;
      
    case 'account_security':
      router.push('/(tabs)/settings');
      break;
      
    default:
      router.push('/(tabs)/profile');
  }
}

function handleSocialNavigation(data: NotificationDeepLink) {
  switch (data.action) {
    case 'new_follower':
    case 'mention':
      router.push('/(tabs)/profile');
      break;
      
    case 'message':
      // In the future, could navigate to messages
      router.push('/(tabs)/notifications');
      break;
      
    default:
      router.push('/(tabs)/notifications');
  }
}

function handleUpdateNavigation(data: NotificationDeepLink) {
  switch (data.action) {
    case 'new_feature':
      // Could show a feature announcement modal
      router.push('/(tabs)/home');
      break;
      
    case 'maintenance':
    case 'system_update':
      router.push('/(tabs)/notifications');
      break;
      
    default:
      router.push('/(tabs)/home');
  }
}

/**
 * Set up notification handlers for the app
 */
export function setupNotificationHandlers() {
  // Handle notifications when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Handle initial notification (app was opened from notification)
  Notifications.getLastNotificationResponseAsync().then(response => {
    if (response) {
      const data = response.notification.request.content.data;
      if (data?.deepLink) {
        const parsed = parseDeepLink(data.deepLink);
        if (parsed) {
          navigateFromNotification({
            ...parsed,
            notificationId: data.notificationId,
          });
        }
      }
    }
  });
  
  // Listen for deep links from other sources
  const subscription = Linking.addEventListener('url', (event) => {
    if (event.url.includes('notification')) {
      const parsed = parseDeepLink(event.url);
      if (parsed) {
        navigateFromNotification(parsed);
      }
    }
  });
  
  return () => {
    subscription.remove();
  };
}

/**
 * Create a deep link URL for a notification
 */
export function createNotificationDeepLink(
  type: NotificationDeepLink['type'],
  action?: string,
  targetId?: string,
  metadata?: Record<string, any>
): string {
  let url = `ingrd://notification/${type}`;
  
  if (action) {
    url += `/${action}`;
  }
  
  if (targetId) {
    url += `/${targetId}`;
  }
  
  if (metadata && Object.keys(metadata).length > 0) {
    const params = new URLSearchParams(metadata);
    url += `?${params.toString()}`;
  }
  
  return url;
}