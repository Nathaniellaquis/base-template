/**
 * PostHog Experiments Hook
 * Provides A/B testing functionality with automatic exposure tracking
 */
import { useEffect, useState, useCallback } from 'react';
import { useAnalytics } from '@/providers/analytics';
import { useAuth } from '@/providers/auth';
import { conversionTracker } from '@/lib/experiments/conversion';
import type { 
  UseExperimentResult, 
  UseMultivariantExperimentResult,
  KnownExperiments,
  TypedExperiments
} from '@shared';

export interface ExperimentOptions {
  sendExposureEvent?: boolean;
  fallbackValue?: any;
  reloadOnUserChange?: boolean;
}

/**
 * Hook for single A/B test experiments
 */
export function useExperiment(
  experimentKey: string,
  options: ExperimentOptions = {}
): UseExperimentResult {
  const { getFeatureFlag, capture, reloadFeatureFlags } = useAnalytics();
  const { user } = useAuth();
  const [variant, setVariant] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const loadVariant = useCallback(async () => {
    setIsLoading(true);
    try {
      const flag = await getFeatureFlag(experimentKey);
      setVariant(flag || options.fallbackValue || 'control');
    } catch (error) {
      console.error(`Failed to load experiment ${experimentKey}:`, error);
      setVariant(options.fallbackValue || 'control');
    } finally {
      setIsLoading(false);
    }
  }, [experimentKey, getFeatureFlag, options.fallbackValue]);

  useEffect(() => {
    loadVariant();
  }, [loadVariant]);

  // Track experiment exposure
  useEffect(() => {
    if (variant !== undefined && options.sendExposureEvent !== false && !isLoading) {
      // Track with PostHog
      capture('$experiment_viewed', {
        experiment: experimentKey,
        variant: variant,
        timestamp: new Date().toISOString(),
      });
      
      // Also track with ConversionTracker for attribution
      conversionTracker.trackExposure(
        experimentKey,
        variant,
        user?.uid,
        // Generate a session ID from timestamp - in production you'd use a proper session ID
        `session_${Date.now()}`
      );
    }
  }, [variant, experimentKey, isLoading, capture, user?.uid, options.sendExposureEvent]);

  const reload = useCallback(() => {
    reloadFeatureFlags();
    loadVariant();
  }, [reloadFeatureFlags, loadVariant]);

  return {
    variant: variant || 'control',
    isLoading,
    isControl: variant === 'control' || !variant,
    payload: undefined, // Add missing payload property
  };
}

/**
 * Hook for multi-variant experiments
 */
export function useMultivariantExperiment(
  experimentKey: string,
  variants: string[],
  options: ExperimentOptions = {}
): UseMultivariantExperimentResult {
  const result = useExperiment(experimentKey, options);

  return {
    variant: result.variant,
    isLoading: result.isLoading,
    variantIndex: variants.indexOf(result.variant),
    payload: result.payload,
  };
}

