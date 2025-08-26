/**
 * Experiment and A/B Testing Types
 * Shared between frontend and backend
 */

// Base experiment configuration
export interface ExperimentConfig {
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  variants: ExperimentVariant[];
  defaultVariant: string;
  trafficAllocation?: TrafficAllocation;
  targetingRules?: TargetingRule[];
  startDate?: Date;
  endDate?: Date;
}

// Experiment variant
export interface ExperimentVariant {
  key: string;
  name: string;
  description?: string;
  weight?: number; // Percentage of traffic (0-100)
  payload?: any; // Variant-specific data
}

// Traffic allocation rules
export interface TrafficAllocation {
  type: 'random' | 'sticky' | 'user_attribute';
  seed?: string; // For consistent hashing
}

// Targeting rules for experiments
export interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

// User's experiment assignment
export interface ExperimentAssignment {
  experimentKey: string;
  variant: string;
  assignedAt: Date;
  converted?: boolean;
  conversionValue?: number;
}

// Experiment result/metrics
export interface ExperimentMetrics {
  experimentKey: string;
  variant: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  averageValue?: number;
  confidence?: number;
}

// Hook return types
export interface UseExperimentResult {
  variant: string;
  isLoading: boolean;
  isControl: boolean;
  payload?: any;
}

export interface UseMultivariantExperimentResult {
  variant: string;
  isLoading: boolean;
  variantIndex: number;
  payload?: any;
}

// Common experiment keys used in the app
export type KnownExperiments = 
  | 'paywall_pricing_structure'
  | 'paywall_urgency'
  | 'paywall_social_proof'
  | 'onboarding_length'
  | 'trial_duration'
  | 'feature_discovery';

// Paywall experiment variants
export type PaywallPricingVariant = 'control' | 'with_basic' | 'premium_only';
export type PaywallUrgencyVariant = 'control' | 'limited_time' | 'limited_spots' | 'price_increase';
export type PaywallSocialProofVariant = 'control' | 'with_testimonials' | 'with_stats';

// Type-safe experiment configurations
export interface TypedExperiments {
  paywall_pricing_structure: PaywallPricingVariant;
  paywall_urgency: PaywallUrgencyVariant;
  paywall_social_proof: PaywallSocialProofVariant;
  onboarding_length: 'short' | 'medium' | 'long';
  trial_duration: '7_days' | '14_days' | '30_days';
  feature_discovery: 'tooltip' | 'tour' | 'none';
}