/**
 * Stripe Native Configuration
 * iOS and Android specific Stripe setup
 */

import { StripeProvider } from '@stripe/stripe-react-native';

// Re-export native Stripe components
export {
  CardField,
  CardFieldInput, confirmPlatformPayPayment,
  confirmPlatformPaySetupIntent, PaymentSheet, PlatformPay,
  PlatformPayButton, useConfirmPayment,
  usePlatformPay, useStripe
} from '@stripe/stripe-react-native';

// Export types
export type {
  BillingDetails,
  PlatformPayError
} from '@stripe/stripe-react-native';

// Export enums
export { PaymentType } from '@stripe/stripe-react-native';

// Export configured StripeProvider
export { StripeProvider };

// Export factory functions for configuration
export {
  createPaymentSheetConfig, createStripeConfig, validateStripeConfig,
  type StripeConfig,
  type StripeConfigOptions
} from './config';

// Helper to check if platform pay is available
export const isPlatformPayAvailable = async () => {
  try {
    const { isPlatformPaySupported } = await import('@stripe/stripe-react-native');
    return await isPlatformPaySupported();
  } catch {
    return false;
  }
};