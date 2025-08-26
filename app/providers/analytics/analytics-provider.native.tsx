/**
 * Analytics Provider for Native (iOS & Android)
 * Optimized for mobile with React Native specific features
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { PostHogProvider as PHProvider } from 'posthog-react-native';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Dimensions, Platform } from 'react-native';
// Note: expo-network and expo-battery would need to be installed for full functionality
// For now, we'll work without them to avoid dependency issues
import { posthog } from '@/config';
import { setAnalyticsInstance } from '@/lib/analytics/tracking';
import { useAuth } from '@/providers/auth';
import type { AnalyticsContextValue } from './types';

// Create context
const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const appState = useRef(AppState.currentState);
  const sessionStartTime = useRef<number>(Date.now());

  // Initialize analytics for native
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        console.log('📊 Initializing native analytics...');

        // Get device info (network and battery would require additional packages)

        // Set super properties for native
        posthog.register({
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version || 'unknown',
          buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'unknown',
          deviceType: Device.deviceType || 'unknown',
          deviceName: Device.deviceName || 'unknown',
          deviceBrand: Device.brand || 'unknown',
          deviceModel: Device.modelName || 'unknown',
          osVersion: Device.osVersion || 'unknown',
          osName: Device.osName || 'unknown',
          isDevice: Device.isDevice || false,

          // Screen dimensions
          screenWidth: Dimensions.get('screen').width,
          screenHeight: Dimensions.get('screen').height,
          windowWidth: Dimensions.get('window').width,
          windowHeight: Dimensions.get('window').height,

          // Network and battery info would be added with expo-network and expo-battery packages

          // Expo specific
          isExpoGo: Constants.appOwnership === 'expo',
          expoSdkVersion: Constants.expoConfig?.sdkVersion || 'unknown',
        });

        setAnalyticsInstance(posthog);
        setIsInitialized(true);
        console.log('📊 Native analytics initialized successfully');
      } catch (error) {
        console.error('Failed to initialize native analytics:', error);
        setIsInitialized(true);
      }
    };

    initAnalytics();
  }, []);

  // Track app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        sessionStartTime.current = Date.now();
        posthog.capture('app_opened', {
          from_background: true,
          timestamp: new Date().toISOString(),
        });
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to background
        const sessionDuration = Date.now() - sessionStartTime.current;
        posthog.capture('app_backgrounded', {
          session_duration_ms: sessionDuration,
          timestamp: new Date().toISOString(),
        });
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Track screen dimensions changes (orientation)
  useEffect(() => {
    const handleDimensionsChange = ({ window, screen }: { window: any; screen: any }) => {
      posthog.capture('orientation_changed', {
        orientation: window.width > window.height ? 'landscape' : 'portrait',
        windowWidth: window.width,
        windowHeight: window.height,
        screenWidth: screen.width,
        screenHeight: screen.height,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionsChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Update user identification when auth changes
  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      // Build user properties for native
      const userProperties: Record<string, any> = {
        email: user.email,
        displayName: user.displayName,
        plan: user.subscription?.plan || 'free',
        onboardingCompleted: user.onboardingCompleted || false,
        onboardingStep: user.onboarding?.currentStep || 0,
        isNewUser: isWithinDays(user.createdAt, 7),
        daysSinceSignup: daysSince(user.createdAt),
        cohort: getWeeklyCohort(user.createdAt),

        // Native-specific properties
        platform: Platform.OS,
        deviceType: Device.deviceType,
        hasNotificationPermission: user.pushTokens && user.pushTokens.length > 0,
      };

      // Add subscription details if available
      if (user.subscription?.status) {
        userProperties.subscriptionStatus = user.subscription.status;
      }
      if (user.createdAt) {
        userProperties.createdAt = new Date(user.createdAt).toISOString();
      }

      // Identify user
      posthog.identify(user._id, userProperties);

      // Track sign in
      posthog.capture('user_signed_in', {
        method: 'native',
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });

      // Reload feature flags when user changes
      posthog.reloadFeatureFlags();
    } else {
      // Reset when user logs out
      posthog.reset();
    }
  }, [user, isInitialized]);

  // Track low memory warnings (iOS/Android specific)
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const handleMemoryWarning = () => {
        posthog.capture('memory_warning', {
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        });
      };

      // Note: React Native doesn't have a built-in memory warning event
      // This would need to be implemented with native modules if needed
    }
  }, []);

  // Context value with methods
  const contextValue: AnalyticsContextValue = {
    isInitialized,

    identify: useCallback((userId: string, properties?: Record<string, any>) => {
      posthog.identify(userId, properties);
    }, []),

    track: useCallback((eventName: string, properties?: Record<string, any>) => {
      // Add native-specific context to events
      const enrichedProperties = {
        ...properties,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      };
      posthog.capture(eventName, enrichedProperties);
    }, []),

    capture: useCallback((eventName: string, properties?: Record<string, any>) => {
      const enrichedProperties = {
        ...properties,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      };
      posthog.capture(eventName, enrichedProperties);
    }, []),

    reset: useCallback(() => {
      posthog.reset();
    }, []),

    setUserProperties: useCallback((properties: Record<string, any>) => {
      if (user?._id) {
        posthog.identify(user._id, properties);
      }
    }, [user]),

    trackScreen: useCallback((screenName: string, properties?: Record<string, any>) => {
      posthog.capture('$screen', {
        name: screenName,
        ...properties,
      });
    }, []),

    // Experiments & Feature Flags
    getFeatureFlag: useCallback(async (key: string) => {
      return posthog.getFeatureFlag(key);
    }, []),

    getFeatureFlagPayload: useCallback(async (key: string) => {
      return posthog.getFeatureFlagPayload(key);
    }, []),

    getAllFlags: useCallback(async () => {
      // PostHog React Native SDK may not have getAllFlags method
      // Return empty object as fallback
      return {};
    }, []),

    reloadFeatureFlags: useCallback(() => {
      posthog.reloadFeatureFlags();
    }, []),

    overrideFeatureFlag: useCallback((key: string, value: any) => {
      // PostHog React Native SDK may not support overrides directly
      // Store in memory for testing purposes
      console.log(`Feature flag ${key} overridden to ${value}`);
    }, []),

    // Native-specific methods
    trackGesture: useCallback((gestureName: string, properties?: Record<string, any>) => {
      posthog.capture('gesture_performed', {
        gesture: gestureName,
        ...properties,
      });
    }, []),

    trackDeepLink: useCallback((url: string, properties?: Record<string, any>) => {
      posthog.capture('deep_link_opened', {
        url,
        ...properties,
      });
    }, []),

    trackPushNotification: useCallback((action: 'received' | 'opened' | 'dismissed', properties?: Record<string, any>) => {
      posthog.capture(`push_notification_${action}`, properties);
    }, []),

    trackInAppPurchase: useCallback((productId: string, price: number, currency: string, properties?: Record<string, any>) => {
      posthog.capture('in_app_purchase', {
        product_id: productId,
        price,
        currency,
        ...properties,
      });
    }, []),
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      <PHProvider client={posthog}>
        {children}
      </PHProvider>
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

// Export PostHog hooks for experiments and feature flags
export { useFeatureFlag, useFeatureFlagWithPayload as useFeatureFlagPayload, usePostHog } from 'posthog-react-native';

// Utility functions
function isWithinDays(date: string | Date | undefined, days: number): boolean {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffTime = Math.abs(Date.now() - dateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

function daysSince(date: string | Date | undefined): number {
  if (!date) return 0;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffTime = Math.abs(Date.now() - dateObj.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getWeeklyCohort(date: string | Date | undefined): string {
  if (!date) return 'unknown';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const weekNumber = Math.ceil((dateObj.getDate() - dateObj.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}