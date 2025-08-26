/**
 * Analytics Provider for Web
 * Optimized for browser environment with web-specific features
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import posthog from 'posthog-js';
import { useAuth } from '@/providers/auth';
import { setAnalyticsInstance } from '@/lib/analytics/tracking';
import { config } from '@/config';
import type { AnalyticsContextValue } from './types';

// Create context
const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

// PostHog initialization state
let posthogInitialized = false;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<Record<string, any>>({});

  // Initialize analytics for web
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        console.log('📊 Initializing web analytics...');
        
        // Only initialize once
        if (!posthogInitialized && typeof window !== 'undefined') {
          const apiKey = config.posthog.apiKey;
          const apiHost = config.posthog.host;
          
          if (!apiKey) {
            console.warn('PostHog API key not found');
            setIsInitialized(true);
            return;
          }
          
          // Initialize PostHog with proper configuration
          posthog.init(apiKey, {
            api_host: apiHost,
            persistence: 'localStorage',
            autocapture: false, // We'll track manually for better control
            capture_pageview: false, // We'll handle page views manually
            capture_pageleave: true,
            disable_session_recording: false,
            session_recording: {
              // Only record sessions for certain users/plans
              maskAllInputs: true,
            },
            loaded: (posthogInstance) => {
              console.log('📊 PostHog loaded successfully');
              posthogInitialized = true;
              
              // Load initial feature flags
              posthogInstance.reloadFeatureFlags();
              
              // Get all flags after a short delay to ensure they're loaded
              setTimeout(() => {
                const flags = posthogInstance.getFeatureFlags();
                setFeatureFlags(flags || {});
                console.log('📊 Initial feature flags:', flags);
              }, 100);
            },
            bootstrap: {
              // Optionally bootstrap with feature flags from server/cache
              featureFlags: {},
            },
          });

          // Set super properties for web
          posthog.register({
            platform: 'web',
            browser: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            referrer: document.referrer || 'direct',
            url: window.location.href,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
          });

          // Track web-specific metrics
          if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            if (connection) {
              posthog.register({
                connectionType: connection.effectiveType,
                connectionSpeed: connection.downlink,
              });
            }
          }

          // Subscribe to feature flag changes
          posthog.onFeatureFlags((flags) => {
            console.log('📊 Feature flags updated:', flags);
            setFeatureFlags(flags);
          });

          // Set the analytics instance for tracking helper
          setAnalyticsInstance(posthog);
          setIsInitialized(true);
          console.log('📊 Web analytics initialized successfully');
        } else if (posthogInitialized) {
          // Already initialized, just update state
          setIsInitialized(true);
          const flags = posthog.getFeatureFlags();
          setFeatureFlags(flags || {});
        }
      } catch (error) {
        console.error('Failed to initialize web analytics:', error);
        setIsInitialized(true);
      }
    };

    initAnalytics();
  }, []);

  // Update user identification when auth changes
  useEffect(() => {
    if (!isInitialized || !posthogInitialized) return;

    if (user) {
      // Build user properties for web
      const userProperties: Record<string, any> = {
        email: user.email,
        displayName: user.displayName,
        plan: user.subscription?.plan || 'free',
        onboardingCompleted: user.onboardingCompleted || false,
        onboardingStep: user.onboarding?.currentStep || 0,
        isNewUser: isWithinDays(user.createdAt, 7),
        daysSinceSignup: daysSince(user.createdAt),
        cohort: getWeeklyCohort(user.createdAt),
        
        // Web-specific properties
        browser: getBrowserName(),
        os: getOSName(),
        deviceType: getDeviceType(),
      };

      // Add subscription details if available
      if (user.subscription?.status) {
        userProperties.subscriptionStatus = user.subscription.status;
      }
      if (user.createdAt) {
        userProperties.createdAt = new Date(user.createdAt).toISOString();
      }

      // Identify user
      if (user._id) {
        posthog.identify(user._id, userProperties);
      }

      // Set up user for session recording
      if (user.subscription?.plan === 'pro' || user.subscription?.plan === 'enterprise') {
        // Enable session recording for paid users
        posthog.startSessionRecording();
      }

      // Track sign in
      posthog.capture('user_signed_in', {
        method: 'web',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Reset when user logs out
      posthog.reset();
    }
  }, [user, isInitialized]);

  // Track page views automatically for web
  useEffect(() => {
    if (!isInitialized || !posthogInitialized) return;

    // Track initial page view
    posthog.capture('$pageview');

    // Set up page view tracking for navigation
    const handleLocationChange = () => {
      posthog.capture('$pageview');
    };

    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isInitialized]);

  // Context value with methods
  const contextValue: AnalyticsContextValue = {
    isInitialized,
    
    identify: useCallback((userId: string, properties?: Record<string, any>) => {
      if (posthogInitialized) {
        posthog.identify(userId, properties);
      }
    }, []),
    
    track: useCallback((eventName: string, properties?: Record<string, any>) => {
      if (posthogInitialized) {
        // Add web-specific context to events
        const enrichedProperties = {
          ...properties,
          url: window.location.href,
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        };
        posthog.capture(eventName, enrichedProperties);
      }
    }, []),
    
    capture: useCallback((eventName: string, properties?: Record<string, any>) => {
      if (posthogInitialized) {
        const enrichedProperties = {
          ...properties,
          timestamp: new Date().toISOString(),
        };
        posthog.capture(eventName, enrichedProperties);
      }
    }, []),
    
    reset: useCallback(() => {
      if (posthogInitialized) {
        posthog.reset();
      }
    }, []),
    
    setUserProperties: useCallback((properties: Record<string, any>) => {
      if (posthogInitialized && user?._id) {
        posthog.setPersonProperties(properties);
      }
    }, [user]),
    
    trackScreen: useCallback((screenName: string, properties?: Record<string, any>) => {
      if (posthogInitialized) {
        // For web, track as page view
        posthog.capture('$pageview', {
          $current_url: screenName,
          ...properties,
        });
      }
    }, []),

    // Experiments & Feature Flags
    getFeatureFlag: useCallback(async (key: string) => {
      if (posthogInitialized) {
        // Check for overrides first
        try {
          const overrides = JSON.parse(localStorage.getItem('posthog_flag_overrides') || '{}');
          if (overrides[key] !== undefined) {
            console.log(`Using overridden feature flag ${key}:`, overrides[key]);
            return overrides[key];
          }
        } catch (e) {
          console.error('Error reading feature flag overrides:', e);
        }
        
        // Use cached flags for immediate response
        const cachedValue = featureFlags[key];
        if (cachedValue !== undefined) {
          return cachedValue;
        }
        
        // Fallback to direct API call if needed
        return posthog.getFeatureFlag(key);
      }
      return null;
    }, [featureFlags]),

    getFeatureFlagPayload: useCallback(async (key: string) => {
      if (posthogInitialized) {
        return posthog.getFeatureFlagPayload(key);
      }
      return null;
    }, []),

    getAllFlags: useCallback(async () => {
      if (posthogInitialized) {
        // Check for overrides
        try {
          const overrides = JSON.parse(localStorage.getItem('posthog_flag_overrides') || '{}');
          if (Object.keys(overrides).length > 0) {
            console.log('Applying feature flag overrides:', overrides);
            return { ...featureFlags, ...overrides };
          }
        } catch (e) {
          console.error('Error reading feature flag overrides:', e);
        }
        
        // Return cached flags for immediate response
        return featureFlags;
      }
      return {};
    }, [featureFlags]),

    reloadFeatureFlags: useCallback(() => {
      if (posthogInitialized) {
        console.log('Reloading feature flags...');
        posthog.reloadFeatureFlags();
      }
    }, []),

    overrideFeatureFlag: useCallback((key: string, value: any) => {
      if (posthogInitialized) {
        // Store override in localStorage for testing
        try {
          const overrides = JSON.parse(localStorage.getItem('posthog_flag_overrides') || '{}');
          overrides[key] = value;
          localStorage.setItem('posthog_flag_overrides', JSON.stringify(overrides));
          
          // Update local feature flags state
          setFeatureFlags(prev => ({ ...prev, [key]: value }));
          
          console.log(`Feature flag ${key} overridden to ${value}`);
        } catch (e) {
          console.error('Error setting feature flag override:', e);
        }
      }
    }, []),

    // Web-specific methods
    trackClick: useCallback((elementName: string, properties?: Record<string, any>) => {
      if (posthogInitialized) {
        posthog.capture('element_clicked', {
          element: elementName,
          ...properties,
        });
      }
    }, []),

    trackFormSubmit: useCallback((formName: string, properties?: Record<string, any>) => {
      if (posthogInitialized) {
        posthog.capture('form_submitted', {
          form: formName,
          ...properties,
        });
      }
    }, []),

    startSessionRecording: useCallback(() => {
      if (posthogInitialized) {
        posthog.startSessionRecording();
      }
    }, []),

    stopSessionRecording: useCallback(() => {
      if (posthogInitialized) {
        posthog.stopSessionRecording();
      }
    }, []),
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
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
export const usePostHog = () => posthogInitialized ? posthog : null;

export const useFeatureFlag = (key: string) => {
  const { getFeatureFlag } = useAnalytics();
  const [flag, setFlag] = useState<any>(null);
  
  useEffect(() => {
    getFeatureFlag(key).then(setFlag);
  }, [key, getFeatureFlag]);
  
  return flag;
};

export const useFeatureFlagPayload = (key: string) => {
  const { getFeatureFlagPayload } = useAnalytics();
  const [payload, setPayload] = useState<any>(null);
  
  useEffect(() => {
    getFeatureFlagPayload(key).then(setPayload);
  }, [key, getFeatureFlagPayload]);
  
  return payload;
};

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

// Web-specific utility functions
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOSName(): string {
  const platform = navigator.platform;
  if (platform.includes('Win')) return 'Windows';
  if (platform.includes('Mac')) return 'macOS';
  if (platform.includes('Linux')) return 'Linux';
  if (platform.includes('iPhone') || platform.includes('iPad')) return 'iOS';
  if (platform.includes('Android')) return 'Android';
  return 'Unknown';
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}