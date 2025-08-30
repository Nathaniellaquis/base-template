/**
 * Centralized Hook Exports
 * 
 * This file provides a single import point for all hooks,
 * whether they're defined here or in providers.
 */

// Provider hooks (exported from providers but accessible here for convenience)
export { useAdmin } from '@/providers/admin';
export { useAuth } from '@/providers/auth';
export { useTheme } from '@/providers/theme';

export { useAnalytics } from '@/providers/analytics';

// Onboarding hooks
export { useOnboarding } from './useOnboarding';
export { useOnboardingNavigation } from './useOnboardingNavigation';

// Navigation hooks
export { useTypedRouter } from './useTypedRouter';

// Notification hooks
export { useNotifications } from './useNotifications';

// Experiment hooks
export {
  useExperiment,
  useMultivariantExperiment
} from './useExperiment';


// Payment hook
export { usePayments } from './usePayments';

// UI hooks
export { useMediaQuery } from './useMediaQuery';
