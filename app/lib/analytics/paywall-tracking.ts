/**
 * Paywall Analytics Tracking
 * Implements comprehensive tracking for paywall optimization
 */
import { Platform } from 'react-native';
import type { PaywallEvents } from '@/providers/analytics/types';

// Track paywall events with proper typing
export class PaywallTracker {
  private static instance: PaywallTracker;
  private analytics: any;
  private paywallViewTime: number = 0;
  private interactionCount: number = 0;
  private swipeCount: number = 0;
  private clickCount: number = 0;
  
  private constructor() {}
  
  static getInstance(): PaywallTracker {
    if (!PaywallTracker.instance) {
      PaywallTracker.instance = new PaywallTracker();
    }
    return PaywallTracker.instance;
  }
  
  setAnalytics(analytics: any) {
    this.analytics = analytics;
  }
  
  // Track paywall view
  trackPaywallView(
    stepNumber: number,
    entryPoint: PaywallEvents['paywall_viewed']['entry_point'],
    userStatus: PaywallEvents['paywall_viewed']['user_status']
  ) {
    this.paywallViewTime = Date.now();
    this.interactionCount = 0;
    this.swipeCount = 0;
    this.clickCount = 0;
    
    this.analytics?.capture('paywall_viewed', {
      step_number: stepNumber,
      entry_point: entryPoint,
      user_status: userStatus,
      platform: Platform.OS as 'web' | 'ios' | 'android',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Make analytics accessible for convenience methods
  getAnalytics() {
    return this.analytics;
  }
  
  // Track paywall dismissal
  trackPaywallDismissed(
    planViewed: string,
    dismissReason?: PaywallEvents['paywall_dismissed']['dismiss_reason']
  ) {
    const timeOnScreen = this.paywallViewTime ? Date.now() - this.paywallViewTime : 0;
    
    this.analytics?.capture('paywall_dismissed', {
      time_on_screen: Math.round(timeOnScreen / 1000), // Convert to seconds
      plan_viewed: planViewed,
      interaction_count: this.interactionCount,
      dismiss_reason: dismissReason,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track plan selection
  trackPlanSelected(
    plan: string,
    previousPlan: string,
    billingPeriod: 'monthly' | 'yearly'
  ) {
    this.interactionCount++;
    
    const properties: PaywallEvents['plan_selected'] = {
      plan,
      previous_plan: previousPlan,
      billing_period: billingPeriod,
    };
    
    // Add platform-specific interaction metrics
    if (Platform.OS === 'web') {
      this.clickCount++;
      properties.click_count = this.clickCount;
    } else {
      this.swipeCount++;
      properties.swipe_count = this.swipeCount;
    }
    
    this.analytics?.capture('plan_selected', properties);
  }
  
  // Track billing toggle
  trackBillingToggle(
    from: 'monthly' | 'yearly',
    to: 'monthly' | 'yearly',
    currentPlan: string,
    savingsShown?: number
  ) {
    this.interactionCount++;
    
    this.analytics?.capture('billing_toggle_changed', {
      from,
      to,
      current_plan: currentPlan,
      savings_shown: savingsShown,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track subscription start
  trackSubscriptionStarted(
    plan: string,
    billingPeriod: 'monthly' | 'yearly',
    price: number,
    currency: string = 'USD',
    paymentMethod?: 'card' | 'apple_pay' | 'google_pay',
    experimentVariant?: string
  ) {
    const timeToConvert = this.paywallViewTime 
      ? Math.round((Date.now() - this.paywallViewTime) / 1000)
      : 0;
    
    this.analytics?.capture('subscription_started', {
      plan,
      billing_period: billingPeriod,
      price,
      currency,
      time_to_convert: timeToConvert,
      payment_method: paymentMethod || this.detectPaymentMethod(),
      experiment_variant: experimentVariant,
      interaction_count: this.interactionCount,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
    
    // Track revenue event for financial analytics
    this.analytics?.capture('revenue', {
      amount: price,
      currency,
      product_id: `${plan}_${billingPeriod}`,
      product_name: `${plan} Plan (${billingPeriod})`,
    });
  }
  
  // Track subscription failure
  trackSubscriptionFailed(
    plan: string,
    billingPeriod: 'monthly' | 'yearly',
    errorType: string,
    errorMessage: string,
    stepFailed?: 'payment_sheet' | 'card_validation' | 'processing'
  ) {
    this.analytics?.capture('subscription_failed', {
      plan,
      billing_period: billingPeriod,
      error_type: errorType,
      error_message: errorMessage,
      step_failed: stepFailed,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track feature gate
  trackFeatureGate(
    feature: string,
    requiredPlan: string,
    currentPlan: string,
    location: string
  ) {
    this.analytics?.capture('feature_gate_shown', {
      feature,
      required_plan: requiredPlan,
      current_plan: currentPlan,
      location,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track upgrade prompt
  trackUpgradePrompt(
    trigger: string,
    currentPlan: string,
    suggestedPlan: string
  ) {
    this.analytics?.capture('upgrade_prompt_shown', {
      trigger,
      current_plan: currentPlan,
      suggested_plan: suggestedPlan,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track upgrade prompt action
  trackUpgradePromptAction(
    action: 'upgrade' | 'dismiss' | 'learn_more',
    currentPlan: string,
    suggestedPlan: string
  ) {
    this.analytics?.capture('upgrade_prompt_clicked', {
      action,
      current_plan: currentPlan,
      suggested_plan: suggestedPlan,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track plan comparison
  trackPlanComparison(plansCompared: string[], timeSpent: number) {
    this.interactionCount++;
    
    this.analytics?.capture('plan_comparison_viewed', {
      plans_compared: plansCompared,
      time_spent: Math.round(timeSpent / 1000), // Convert to seconds
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Helper method to detect payment method
  private detectPaymentMethod(): 'card' | 'apple_pay' | 'google_pay' {
    if (Platform.OS === 'ios') {
      // Could check for Apple Pay availability
      return 'apple_pay';
    } else if (Platform.OS === 'android') {
      // Could check for Google Pay availability
      return 'google_pay';
    }
    return 'card';
  }
  
  // Reset tracking state
  reset() {
    this.paywallViewTime = 0;
    this.interactionCount = 0;
    this.swipeCount = 0;
    this.clickCount = 0;
  }
}

// Export singleton instance
export const paywallTracker = PaywallTracker.getInstance();

// Convenience methods for common tracking patterns
export const trackPaywall = {
  // View paywall (from plan selection screen)
  viewPaywall: (stepNumber: number) => {
    paywallTracker.trackPaywallView(stepNumber, 'onboarding', 'new');
  },
  
  // Select a plan
  selectPlan: (plan: string, previousPlan: string, billingPeriod: 'monthly' | 'yearly') => {
    paywallTracker.trackPlanSelected(plan, previousPlan, billingPeriod);
  },
  
  // Start subscription
  startSubscription: (
    plan: string, 
    billingPeriod: 'monthly' | 'yearly', 
    price: number,
    metadata?: { experiments?: any }
  ) => {
    paywallTracker.trackSubscriptionStarted(
      plan,
      billingPeriod,
      price,
      'USD',
      undefined,
      metadata?.experiments ? JSON.stringify(metadata.experiments) : undefined
    );
  },
  
  // Subscription failed
  subscriptionFailed: (
    error: string,
    plan: string,
    billingPeriod: 'monthly' | 'yearly'
  ) => {
    paywallTracker.trackSubscriptionFailed(
      plan,
      billingPeriod,
      'payment_error',
      error
    );
  },
  
  // Initiate checkout
  initiateCheckout: (plan: string, billingPeriod: 'monthly' | 'yearly') => {
    const analytics = paywallTracker.getAnalytics();
    analytics?.capture('checkout_initiated', {
      plan,
      billing_period: billingPeriod,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Checkout canceled
  checkoutCanceled: (plan: string, billingPeriod: 'monthly' | 'yearly') => {
    paywallTracker.trackPaywallDismissed(plan, 'outside_tap');
  },
  
  // Payment attempt
  paymentAttempt: (plan: string, billingPeriod: 'monthly' | 'yearly', method: string) => {
    const analytics = paywallTracker.getAnalytics();
    analytics?.capture('payment_attempt', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Payment success
  paymentSuccess: (
    plan: string, 
    billingPeriod: 'monthly' | 'yearly', 
    method: string,
    paymentType?: string
  ) => {
    const analytics = paywallTracker.getAnalytics();
    analytics?.capture('payment_success', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      payment_type: paymentType,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Payment error
  paymentError: (
    plan: string, 
    billingPeriod: 'monthly' | 'yearly', 
    method: string,
    error: string
  ) => {
    const analytics = paywallTracker.getAnalytics();
    analytics?.capture('payment_error', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      error_message: error,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Payment canceled
  paymentCanceled: (
    plan: string, 
    billingPeriod: 'monthly' | 'yearly', 
    method: string
  ) => {
    const analytics = paywallTracker.getAnalytics();
    analytics?.capture('payment_canceled', {
      plan,
      billing_period: billingPeriod,
      payment_method: method,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  },
};