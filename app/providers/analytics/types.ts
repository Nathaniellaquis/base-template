/**
 * Shared types for Analytics Provider
 * These types are used by both web and native implementations
 */

import type { User } from '@shared';

// Main context type - shared between platforms
export interface AnalyticsContextValue {
  isInitialized: boolean;
  identify: (userId: string, properties?: Record<string, any>) => void;
  track: (eventName: string, properties?: Record<string, any>) => void;
  capture: (eventName: string, properties?: Record<string, any>) => void;
  reset: () => void;
  setUserProperties: (properties: Record<string, any>) => void;
  trackScreen: (screenName: string, properties?: Record<string, any>) => void;
  
  // Experiments & Feature Flags
  getFeatureFlag: (key: string) => Promise<any>;
  getFeatureFlagPayload: (key: string) => Promise<any>;
  getAllFlags: () => Promise<Record<string, any>>;
  reloadFeatureFlags: () => void;
  overrideFeatureFlag: (key: string, value: any) => void;
  
  // Optional platform-specific methods (will be undefined on other platform)
  // Web-specific
  trackClick?: (elementName: string, properties?: Record<string, any>) => void;
  trackFormSubmit?: (formName: string, properties?: Record<string, any>) => void;
  startSessionRecording?: () => void;
  stopSessionRecording?: () => void;
  
  // Native-specific  
  trackGesture?: (gestureName: string, properties?: Record<string, any>) => void;
  trackDeepLink?: (url: string, properties?: Record<string, any>) => void;
  trackPushNotification?: (action: 'received' | 'opened' | 'dismissed', properties?: Record<string, any>) => void;
  trackInAppPurchase?: (productId: string, price: number, currency: string, properties?: Record<string, any>) => void;
}

// Paywall event types from the proposal
export interface PaywallEvents {
  // Visibility & Navigation
  'paywall_viewed': {
    step_number: number;
    entry_point: 'onboarding' | 'settings' | 'feature_gate' | 'upgrade_modal';
    user_status: 'new' | 'returning';
    platform: 'web' | 'ios' | 'android';
  };
  
  'paywall_dismissed': {
    time_on_screen: number;
    plan_viewed: string;
    interaction_count: number;
    dismiss_reason?: 'back_button' | 'close_button' | 'outside_tap' | 'navigation';
  };
  
  // Plan Interactions
  'plan_selected': {
    plan: string;
    previous_plan: string;
    billing_period: 'monthly' | 'yearly';
    swipe_count?: number; // Native only
    click_count?: number; // Web only
  };
  
  'billing_toggle_changed': {
    from: 'monthly' | 'yearly';
    to: 'monthly' | 'yearly';
    current_plan: string;
    savings_shown?: number;
  };
  
  'plan_comparison_viewed': {
    plans_compared: string[];
    time_spent: number;
  };
  
  // Conversion Events
  'subscription_started': {
    plan: string;
    billing_period: 'monthly' | 'yearly';
    price: number;
    currency: string;
    time_to_convert: number;
    payment_method?: 'card' | 'apple_pay' | 'google_pay';
    experiment_variant?: string;
  };
  
  'subscription_failed': {
    plan: string;
    billing_period: 'monthly' | 'yearly';
    error_type: string;
    error_message: string;
    step_failed?: 'payment_sheet' | 'card_validation' | 'processing';
  };
  
  'subscription_cancelled': {
    plan: string;
    billing_period: 'monthly' | 'yearly';
    reason?: string;
    days_active: number;
  };
  
  // Feature Gate Events
  'feature_gate_shown': {
    feature: string;
    required_plan: string;
    current_plan: string;
    location: string;
  };
  
  'upgrade_prompt_shown': {
    trigger: string;
    current_plan: string;
    suggested_plan: string;
  };
  
  'upgrade_prompt_clicked': {
    action: 'upgrade' | 'dismiss' | 'learn_more';
    current_plan: string;
    suggested_plan: string;
  };
}

// User properties for identification
// Extends from shared User type to avoid duplication
export interface UserProperties extends Pick<User, 'email' | 'displayName' | 'onboardingCompleted'> {
  // Analytics-specific properties
  plan: string;
  subscriptionStatus?: string;
  onboardingStep?: number;
  createdAt?: string;
  isNewUser: boolean;
  daysSinceSignup: number;
  cohort: string;
  
  // Platform-specific
  platform?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  appVersion?: string;
  hasNotificationPermission?: boolean;
}

// Experiment tracking
export interface ExperimentData {
  experimentName: string;
  variant: string;
  exposedAt: Date;
  converted?: boolean;
  conversionValue?: number;
}

// Session data
export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  screenViews: number;
  events: number;
  platform: 'web' | 'ios' | 'android';
}