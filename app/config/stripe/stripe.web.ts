/**
 * Stripe Web Configuration
 * Web-specific Stripe setup
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Factory function to create Stripe.js instance
export function createStripePromise(publishableKey: string): Promise<Stripe | null> {
  return loadStripe(publishableKey);
}

// Re-export web Stripe components
export {
  Elements,
  CardElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Export factory functions for configuration
export { 
  createStripeConfig, 
  createPaymentSheetConfig, 
  validateStripeConfig,
  type StripeConfig,
  type StripeConfigOptions 
} from './config';

// Web doesn't support platform pay
export const isPlatformPayAvailable = async () => false;

// Export types for compatibility
export type PaymentSheet = any;
export type BillingDetails = any;
export type PlatformPayError = any;

// Stub for platform pay confirmation
export const confirmPlatformPayPayment = async () => ({ 
  error: { message: 'Platform pay not supported on web' } 
});

// Stub native-only functions for web
export const usePlatformPay = () => ({
  isPlatformPaySupported: false,
  confirmPlatformPayPayment: async () => ({ error: { message: 'Not supported on web' } }),
});

export const useApplePay = () => ({
  isApplePaySupported: false,
  presentApplePay: async () => ({ error: { message: 'Use native app for Apple Pay' } }),
});

export const useGooglePay = () => ({
  isGooglePaySupported: false,
  presentGooglePay: async () => ({ error: { message: 'Use native app for Google Pay' } }),
});