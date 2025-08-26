/**
 * Centralized Hook Exports
 * 
 * This file provides a single import point for all hooks,
 * whether they're defined here or in providers.
 */

// Provider hooks (exported from providers but accessible here for convenience)
export { useAuth } from '@/providers/auth';
export { useAdmin } from '@/providers/admin';
export { useTheme } from '@/providers/theme';
export { usePayment } from '@/providers/payment';
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

// Payment hooks
export { usePaymentConfirmation } from './usePaymentConfirmation';

// UI hooks
export { useMediaQuery } from './useMediaQuery';