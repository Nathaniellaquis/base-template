// Main analytics exports
export { useAnalytics, AnalyticsProvider } from '@/providers/analytics';

// Event tracking
export {
  trackOnboarding,
  trackPaywall,
  trackUser,
  trackFeature,
  trackScreen,
  trackEvent,
  setAnalyticsInstance,
  getAnalyticsInstance
} from './tracking';

// Paywall-specific tracking
export { paywallTracker } from './paywall-tracking';