// This file needs to export from one of the actual files
// Metro bundler doesn't work with non-existent base files
export { 
  PaymentProvider, 
  usePayment,
  usePlanLimits,
  useRequirePlan,
  useHasPlan
} from './payment-provider.native';

// Re-export type from shared
export type { PaymentContextType } from '@shared';

