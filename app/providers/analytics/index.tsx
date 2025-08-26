/**
 * Analytics Provider Index
 * This file needs to export from one of the actual files
 * Metro bundler will automatically resolve to .web or .native based on platform
 */

// Export from the native file (Metro will resolve to .web on web platform)
export { 
  AnalyticsProvider,
  useAnalytics,
  usePostHog,
  useFeatureFlag,
  useFeatureFlagPayload
} from './analytics-provider.native';

// Export types
export type { 
  AnalyticsContextValue,
  PaywallEvents,
  UserProperties,
  ExperimentData,
  SessionData
} from './types';