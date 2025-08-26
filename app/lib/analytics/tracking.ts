import { Platform } from 'react-native';
import { EVENTS } from './events';
import { paywallTracker } from './paywall-tracking';

// Get the analytics instance directly for non-hook usage
let analyticsInstance: any = null;

export const setAnalyticsInstance = (instance: any) => {
  analyticsInstance = instance;
  // Also set it in the paywall tracker
  paywallTracker.setAnalytics(instance);
};

export const getAnalyticsInstance = () => {
  return analyticsInstance;
};

/**
 * Tracking utilities for specific features
 * Can be used outside of React components
 */

// Onboarding funnel tracking
export const trackOnboarding = {
  startOnboarding: () => {
    analyticsInstance?.capture(EVENTS.ONBOARDING_STARTED, {
      timestamp: Date.now(),
    });
  },

  viewWelcome: () => {
    analyticsInstance?.capture(EVENTS.ONBOARDING_WELCOME_VIEWED);
  },

  completeProfile: (displayName: string) => {
    analyticsInstance?.capture(EVENTS.ONBOARDING_PROFILE_COMPLETED, {
      has_display_name: !!displayName,
    });
  },

  viewValueRecap: () => {
    analyticsInstance?.capture(EVENTS.ONBOARDING_VALUE_VIEWED);
  },

  completeOnboarding: (selectedPlan?: string) => {
    analyticsInstance?.capture(EVENTS.ONBOARDING_COMPLETED, {
      plan_selected: selectedPlan || 'free',
    });
  },
};

// Paywall tracking - now uses the enhanced paywall tracker
export const trackPaywall = {
  viewPaywall: (step?: number, entryPoint: 'onboarding' | 'settings' | 'feature_gate' | 'upgrade_modal' = 'onboarding') => {
    paywallTracker.trackPaywallView(
      step || 0,
      entryPoint,
      'new' // This could be determined from user data
    );
  },

  selectPlan: (plan: string, previousPlan?: string, billingPeriod?: 'monthly' | 'yearly') => {
    paywallTracker.trackPlanSelected(
      plan,
      previousPlan || 'free',
      billingPeriod || 'monthly'
    );
  },

  changeBillingPeriod: (from: 'monthly' | 'yearly', to: 'monthly' | 'yearly', currentPlan: string) => {
    paywallTracker.trackBillingToggle(from, to, currentPlan);
  },

  startSubscription: async (plan: string, billing: 'monthly' | 'yearly', price: number, additionalData?: {
    paymentMethod?: 'card' | 'apple_pay' | 'google_pay';
    experiments?: Record<string, any>;
  }) => {
    // Use provided experiments or get current experiment variants
    const experiments = additionalData?.experiments || analyticsInstance?.getAllFlags?.() || {};
    const experimentVariant = experiments.paywall_optimization || experiments.pricing || 'control';

    paywallTracker.trackSubscriptionStarted(
      plan,
      billing,
      price,
      'USD',
      additionalData?.paymentMethod,
      experimentVariant
    );
  },

  subscriptionFailed: (error: string, plan: string, billing: 'monthly' | 'yearly') => {
    paywallTracker.trackSubscriptionFailed(
      plan,
      billing,
      'payment_error',
      error
    );
  },

  dismissPaywall: (planViewed: string, reason?: 'back_button' | 'close_button' | 'outside_tap' | 'navigation') => {
    paywallTracker.trackPaywallDismissed(planViewed, reason);
  },

  featureGate: (feature: string, requiredPlan: string, currentPlan: string, location: string) => {
    paywallTracker.trackFeatureGate(feature, requiredPlan, currentPlan, location);
  },

  upgradePrompt: (trigger: string, currentPlan: string, suggestedPlan: string) => {
    paywallTracker.trackUpgradePrompt(trigger, currentPlan, suggestedPlan);
  },

  upgradePromptAction: (action: 'upgrade' | 'dismiss' | 'learn_more', currentPlan: string, suggestedPlan: string) => {
    paywallTracker.trackUpgradePromptAction(action, currentPlan, suggestedPlan);
  },

  // Payment tracking
  paymentAttempt: (plan: string, billingPeriod: 'monthly' | 'yearly', method: string) => {
    analyticsInstance?.capture('payment_attempt', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },

  paymentSuccess: (plan: string, billingPeriod: 'monthly' | 'yearly', method: string, paymentType?: string) => {
    analyticsInstance?.capture('payment_success', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      payment_type: paymentType,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },

  paymentError: (plan: string, billingPeriod: 'monthly' | 'yearly', method: string, error: string) => {
    analyticsInstance?.capture('payment_error', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      error_message: error,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },

  paymentCanceled: (plan: string, billingPeriod: 'monthly' | 'yearly', method: string) => {
    analyticsInstance?.capture('payment_canceled', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },
};

// User tracking
export const trackUser = {
  login: (method: 'email' | 'phone' | 'social') => {
    analyticsInstance?.capture(EVENTS.USER_LOGGED_IN, {
      method,
      timestamp: Date.now(),
    });
  },

  logout: () => {
    analyticsInstance?.capture(EVENTS.USER_LOGGED_OUT);
  },

  signup: (method: 'email' | 'phone' | 'social') => {
    analyticsInstance?.capture(EVENTS.USER_SIGNED_UP, {
      method,
      timestamp: Date.now(),
    });
  },

  updateProfile: (fields: string[]) => {
    analyticsInstance?.capture(EVENTS.PROFILE_UPDATED, {
      fields_updated: fields,
    });
  },
};

// Feature tracking
export const trackFeature = {
  use: (featureName: string, metadata?: Record<string, any>) => {
    analyticsInstance?.capture(EVENTS.FEATURE_USED, {
      feature_name: featureName,
      metadata,
    });
  },

  error: (featureName: string, error: string) => {
    analyticsInstance?.capture(EVENTS.FEATURE_ERROR, {
      feature_name: featureName,
      error_message: error,
    });
  },
};

// Screen tracking with platform-aware implementation
export const trackScreen = (screenName: string, properties?: Record<string, any>) => {
  const enrichedProperties = {
    name: screenName,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    ...properties,
  };

  if (Platform.OS === 'web') {
    // For web, track as page view
    analyticsInstance?.capture('$pageview', {
      $current_url: screenName,
      ...enrichedProperties,
    });
  } else {
    // For native, track as screen
    analyticsInstance?.capture('$screen', enrichedProperties);
  }
};

// Helper to track generic events with platform context
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (analyticsInstance) {
    const enrichedProperties = {
      ...properties,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };
    analyticsInstance.capture(eventName, enrichedProperties);
  }
};