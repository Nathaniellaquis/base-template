/**
 * Conversion Tracking System for Experiments
 * Handles conversion event tracking, attribution, and analysis
 */
import { getAnalyticsInstance } from '@/lib/analytics/tracking';
import { EXPERIMENTS, ExperimentVariants } from './index';

/**
 * Conversion event types
 */
export const ConversionEvents = {
  // Onboarding conversions
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PROFILE_CREATED: 'profile_created',
  
  // Payment conversions
  TRIAL_STARTED: 'trial_started',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  PAYMENT_COMPLETED: 'payment_completed',
  
  // Feature engagement conversions
  FEATURE_ACTIVATED: 'feature_activated',
  KEY_ACTION_COMPLETED: 'key_action_completed',
  
  // Retention conversions
  USER_RETAINED_7D: 'user_retained_7d',
  USER_RETAINED_30D: 'user_retained_30d',
  
  // Custom conversions
  CUSTOM: 'custom_conversion',
} as const;

export type ConversionEventType = typeof ConversionEvents[keyof typeof ConversionEvents];

/**
 * Conversion metadata interface
 */
export interface ConversionMetadata {
  value?: number;
  currency?: string;
  itemCount?: number;
  duration?: number;
  source?: string;
  customProperties?: Record<string, any>;
}

/**
 * Conversion tracking configuration
 */
export interface ConversionConfig {
  experimentKey: string;
  primaryMetric: ConversionEventType;
  secondaryMetrics?: ConversionEventType[];
  attributionWindow?: number; // in hours, default 24
  requiresExposure?: boolean; // default true
}

/**
 * Stored conversion event
 */
interface StoredConversion {
  eventType: ConversionEventType;
  experimentKey: string;
  variant: string;
  timestamp: string;
  metadata?: ConversionMetadata;
  userId?: string;
  sessionId?: string;
}

/**
 * Experiment exposure tracking for attribution
 */
interface ExperimentExposure {
  experimentKey: string;
  variant: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Conversion tracking class
 */
export class ConversionTracker {
  private exposures: Map<string, ExperimentExposure[]> = new Map();
  private conversions: StoredConversion[] = [];
  private configs: Map<string, ConversionConfig> = new Map();
  
  /**
   * Register a conversion configuration
   */
  registerConfig(config: ConversionConfig): void {
    this.configs.set(config.experimentKey, config);
  }
  
  /**
   * Track an experiment exposure
   */
  trackExposure(experimentKey: string, variant: string, userId?: string, sessionId?: string): void {
    const exposure: ExperimentExposure = {
      experimentKey,
      variant,
      timestamp: new Date().toISOString(),
      userId,
      sessionId,
    };
    
    const key = userId || sessionId || 'anonymous';
    const userExposures = this.exposures.get(key) || [];
    userExposures.push(exposure);
    this.exposures.set(key, userExposures);
    
    // Also track in analytics
    const analytics = getAnalyticsInstance();
    analytics?.capture('$experiment_viewed', {
      experiment: experimentKey,
      variant,
      timestamp: exposure.timestamp,
      user_id: userId,
      session_id: sessionId,
    });
  }
  
  /**
   * Track a conversion event
   */
  trackConversion(
    eventType: ConversionEventType,
    metadata?: ConversionMetadata,
    userId?: string,
    sessionId?: string
  ): void {
    const key = userId || sessionId || 'anonymous';
    const userExposures = this.exposures.get(key) || [];
    
    // Find all applicable experiments for this conversion
    const applicableExperiments = this.findApplicableExperiments(eventType, userExposures);
    
    // Track conversion for each applicable experiment
    applicableExperiments.forEach(({ experiment, exposure }) => {
      const conversion: StoredConversion = {
        eventType,
        experimentKey: experiment.experimentKey,
        variant: exposure.variant,
        timestamp: new Date().toISOString(),
        metadata,
        userId,
        sessionId,
      };
      
      this.conversions.push(conversion);
      
      // Track in analytics
      const analytics = getAnalyticsInstance();
      analytics?.capture('experiment_conversion', {
        experiment: experiment.experimentKey,
        variant: exposure.variant,
        conversion_type: eventType,
        value: metadata?.value,
        currency: metadata?.currency,
        attribution_time: this.calculateAttributionTime(exposure.timestamp),
        timestamp: conversion.timestamp,
        user_id: userId,
        session_id: sessionId,
        ...metadata?.customProperties,
      });
    });
    
    // Also track general conversion event
    const analytics = getAnalyticsInstance();
    analytics?.capture(`conversion_${eventType}`, {
      value: metadata?.value,
      currency: metadata?.currency,
      timestamp: new Date().toISOString(),
      user_id: userId,
      session_id: sessionId,
      ...metadata?.customProperties,
    });
  }
  
  /**
   * Find experiments that should be attributed with this conversion
   */
  private findApplicableExperiments(
    eventType: ConversionEventType,
    exposures: ExperimentExposure[]
  ): Array<{ experiment: ConversionConfig; exposure: ExperimentExposure }> {
    const applicable: Array<{ experiment: ConversionConfig; exposure: ExperimentExposure }> = [];
    
    this.configs.forEach((config) => {
      // Check if this event type is tracked by this experiment
      const tracksEvent = 
        config.primaryMetric === eventType ||
        config.secondaryMetrics?.includes(eventType);
      
      if (!tracksEvent) return;
      
      // Find most recent exposure within attribution window
      const relevantExposure = this.findRelevantExposure(
        exposures,
        config.experimentKey,
        config.attributionWindow || 24
      );
      
      if (relevantExposure && (!config.requiresExposure || relevantExposure)) {
        applicable.push({ experiment: config, exposure: relevantExposure });
      }
    });
    
    return applicable;
  }
  
  /**
   * Find the most recent exposure within attribution window
   */
  private findRelevantExposure(
    exposures: ExperimentExposure[],
    experimentKey: string,
    attributionWindowHours: number
  ): ExperimentExposure | null {
    const now = new Date();
    const windowStart = new Date(now.getTime() - attributionWindowHours * 60 * 60 * 1000);
    
    // Filter exposures for this experiment within window
    const relevantExposures = exposures
      .filter(exp => 
        exp.experimentKey === experimentKey &&
        new Date(exp.timestamp) >= windowStart
      )
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    
    return relevantExposures[0] || null;
  }
  
  /**
   * Calculate time between exposure and conversion
   */
  private calculateAttributionTime(exposureTimestamp: string): number {
    const exposure = new Date(exposureTimestamp);
    const now = new Date();
    return Math.round((now.getTime() - exposure.getTime()) / 1000); // in seconds
  }
  
  /**
   * Get conversion rate for an experiment
   */
  getConversionRate(
    experimentKey: string,
    variant: string,
    eventType: ConversionEventType
  ): number {
    const variantConversions = this.conversions.filter(
      c => c.experimentKey === experimentKey && 
           c.variant === variant && 
           c.eventType === eventType
    );
    
    const variantExposures = Array.from(this.exposures.values())
      .flat()
      .filter(e => e.experimentKey === experimentKey && e.variant === variant);
    
    if (variantExposures.length === 0) return 0;
    
    return variantConversions.length / variantExposures.length;
  }
  
  /**
   * Get conversion value for an experiment
   */
  getConversionValue(
    experimentKey: string,
    variant: string,
    eventType: ConversionEventType
  ): number {
    const variantConversions = this.conversions.filter(
      c => c.experimentKey === experimentKey && 
           c.variant === variant && 
           c.eventType === eventType &&
           c.metadata?.value !== undefined
    );
    
    return variantConversions.reduce((sum, c) => sum + (c.metadata?.value || 0), 0);
  }
  
  /**
   * Clear old data outside retention window
   */
  clearOldData(retentionDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = cutoffDate.toISOString();
    
    // Clear old exposures
    this.exposures.forEach((exposures, key) => {
      const filtered = exposures.filter(e => e.timestamp > cutoffTimestamp);
      if (filtered.length === 0) {
        this.exposures.delete(key);
      } else {
        this.exposures.set(key, filtered);
      }
    });
    
    // Clear old conversions
    this.conversions = this.conversions.filter(c => c.timestamp > cutoffTimestamp);
  }
}

/**
 * Singleton instance
 */
export const conversionTracker = new ConversionTracker();

/**
 * Conversion tracking utilities
 */
export const trackConversion = {
  /**
   * Track a generic conversion
   */
  track: (
    eventType: ConversionEventType,
    metadata?: ConversionMetadata,
    userId?: string,
    sessionId?: string
  ) => {
    conversionTracker.trackConversion(eventType, metadata, userId, sessionId);
  },
  
  /**
   * Track subscription conversion
   */
  subscription: (
    plan: string,
    value: number,
    currency: string = 'USD',
    userId?: string
  ) => {
    conversionTracker.trackConversion(
      ConversionEvents.SUBSCRIPTION_STARTED,
      {
        value,
        currency,
        customProperties: { plan },
      },
      userId
    );
  },
  
  /**
   * Track trial conversion
   */
  trial: (plan: string, userId?: string) => {
    conversionTracker.trackConversion(
      ConversionEvents.TRIAL_STARTED,
      {
        customProperties: { plan },
      },
      userId
    );
  },
  
  /**
   * Track feature activation
   */
  featureActivation: (featureName: string, userId?: string) => {
    conversionTracker.trackConversion(
      ConversionEvents.FEATURE_ACTIVATED,
      {
        customProperties: { feature: featureName },
      },
      userId
    );
  },
  
  /**
   * Track custom conversion
   */
  custom: (
    eventName: string,
    metadata?: ConversionMetadata,
    userId?: string
  ) => {
    conversionTracker.trackConversion(
      ConversionEvents.CUSTOM,
      {
        ...metadata,
        customProperties: {
          ...metadata?.customProperties,
          event_name: eventName,
        },
      },
      userId
    );
  },
};

/**
 * Pre-configured experiment conversion configs
 */
export const experimentConfigs: ConversionConfig[] = [
  {
    experimentKey: EXPERIMENTS.PAYWALL_PRICING,
    primaryMetric: ConversionEvents.SUBSCRIPTION_STARTED,
    secondaryMetrics: [ConversionEvents.TRIAL_STARTED, ConversionEvents.PAYMENT_COMPLETED],
    attributionWindow: 24,
  },
  {
    experimentKey: EXPERIMENTS.PAYWALL_URGENCY,
    primaryMetric: ConversionEvents.SUBSCRIPTION_STARTED,
    attributionWindow: 12,
  },
  {
    experimentKey: EXPERIMENTS.PAYWALL_SOCIAL_PROOF,
    primaryMetric: ConversionEvents.SUBSCRIPTION_STARTED,
    attributionWindow: 24,
  },
  {
    experimentKey: EXPERIMENTS.NEW_ONBOARDING_FLOW,
    primaryMetric: ConversionEvents.ONBOARDING_COMPLETED,
    secondaryMetrics: [ConversionEvents.PROFILE_CREATED, ConversionEvents.SUBSCRIPTION_STARTED],
    attributionWindow: 48,
  },
];

// Register default configs
experimentConfigs.forEach(config => conversionTracker.registerConfig(config));