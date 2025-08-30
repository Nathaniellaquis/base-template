/**
 * Experiment Configuration and Utilities
 * Non-hook utilities for experiment management
 * For React hooks, see /hooks/useExperiment.ts
 */
import { getAnalyticsInstance } from '@/lib/analytics/tracking';

/**
 * Experiment definitions
 */
export const EXPERIMENTS = {
  PAYWALL_PRICING: 'paywall_pricing_structure',
  PAYWALL_URGENCY: 'paywall_urgency',
  PAYWALL_SOCIAL_PROOF: 'paywall_social_proof',
  NEW_ONBOARDING_FLOW: 'new_onboarding_flow',
  ADMIN_DASHBOARD: 'admin_dashboard_v2',
} as const;

/**
 * Feature flag definitions
 */
export const FEATURE_FLAGS = {
  NOTIFICATIONS: 'notifications_enabled',
  ADMIN_PANEL: 'admin_panel_enabled',

  KILL_PAYWALL: 'kill_paywall',
  KILL_ONBOARDING: 'kill_onboarding',
} as const;

/**
 * Experiment metrics tracking
 */
export const experimentMetrics = {
  /**
   * Track experiment exposure
   */
  trackExposure: (experimentKey: string, variant: string, metadata?: Record<string, any>) => {
    const analytics = getAnalyticsInstance();
    analytics?.capture('$experiment_viewed', {
      experiment: experimentKey,
      variant,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  },

  /**
   * Track experiment conversion
   */
  trackConversion: (experimentKey: string, variant: string, conversionType: string, value?: number) => {
    const analytics = getAnalyticsInstance();
    analytics?.capture('experiment_conversion', {
      experiment: experimentKey,
      variant,
      conversion_type: conversionType,
      value,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track experiment metric
   */
  trackMetric: (experimentKey: string, metricName: string, value: number | string, metadata?: Record<string, any>) => {
    const analytics = getAnalyticsInstance();
    analytics?.capture('experiment_metric', {
      experiment: experimentKey,
      metric: metricName,
      value,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  },
};

/**
 * Calculate sample size for experiments
 */
export function calculateSampleSize(
  baselineRate: number,
  minimumEffect: number,
  confidence: number = 0.95,
  power: number = 0.8
): number {
  // Z-scores for confidence and power
  const zAlpha = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.645;
  const zBeta = power === 0.8 ? 0.84 : power === 0.9 ? 1.28 : 0.84;

  // Calculate sample size
  const p1 = baselineRate;
  const p2 = baselineRate + minimumEffect;
  const pBar = (p1 + p2) / 2;

  const numerator = 2 * pBar * (1 - pBar) * Math.pow(zAlpha + zBeta, 2);
  const denominator = Math.pow(p1 - p2, 2);

  return Math.ceil(numerator / denominator);
}

/**
 * Check if experiment has reached statistical significance
 */
export function isStatisticallySignificant(
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number,
  confidence: number = 0.95
): boolean {
  const controlRate = controlConversions / controlTotal;
  const variantRate = variantConversions / variantTotal;

  // Calculate pooled probability
  const pooledProbability = (controlConversions + variantConversions) / (controlTotal + variantTotal);

  // Calculate standard error
  const standardError = Math.sqrt(
    pooledProbability * (1 - pooledProbability) * (1 / controlTotal + 1 / variantTotal)
  );

  // Calculate z-score
  const zScore = Math.abs(variantRate - controlRate) / standardError;

  // Check significance based on confidence level
  const zThreshold = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.645;

  return zScore > zThreshold;
}

/**
 * Experiment variant naming convention
 */
export const ExperimentVariants = {
  CONTROL: 'control',
  TEST: 'test',
  VARIANT_A: 'variant_a',
  VARIANT_B: 'variant_b',
  VARIANT_C: 'variant_c',
} as const;

/**
 * Experiment status types
 */
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

/**
 * Experiment configuration type
 */
export interface ExperimentConfig {
  key: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: Array<{
    key: string;
    name: string;
    weight: number; // Percentage of traffic
  }>;
  metrics: string[];
  targetAudience?: {
    properties?: Record<string, any>;
    segments?: string[];
  };
  startDate?: Date;
  endDate?: Date;
  minimumSampleSize?: number;
  confidenceLevel?: number;
}

/**
 * Mutual exclusion groups for experiments
 * Experiments in the same group cannot run simultaneously
 */
export const MUTUAL_EXCLUSION_GROUPS = [
  [EXPERIMENTS.PAYWALL_PRICING],
  [EXPERIMENTS.PAYWALL_URGENCY, EXPERIMENTS.PAYWALL_SOCIAL_PROOF],
] as const;