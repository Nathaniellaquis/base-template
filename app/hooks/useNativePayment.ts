import {
  confirmPlatformPaySetupIntent,
  PaymentType,
  usePlatformPay,
  useStripe
} from '@/config/stripe';
import { trackPaywall } from '@/lib/analytics';
import { useAuth } from '@/providers/auth';
import { usePayment } from '@/providers/payment';
import { trpc } from '@/providers/trpc';
import type { BillingPeriod, PlanType } from '@shared';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

interface PaymentResult {
  success: boolean;
  action?: string;
  error?: string;
  paymentMethod?: string;
}

export function useNativePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNativePaySupported, setIsNativePaySupported] = useState(false);

  const { subscribe } = usePayment();
  const { user } = useAuth();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Mutations for payment methods
  const createSetupIntentMutation = trpc.payment.createSetupIntent.useMutation();

  // Check platform pay support once
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = await isPlatformPaySupported();
        console.log('[useNativePayment] Platform pay support:', {
          supported,
          platform: Platform.OS,
        });
        setIsNativePaySupported(supported);
      } catch (error) {
        console.error('[useNativePayment] Error checking support:', error);
        setIsNativePaySupported(false);
      }
    };
    checkSupport();
  }, [isPlatformPaySupported]);

  // Simple native payment confirmation
  const confirmNativePayment = async (
    plan: PlanType,
    period: BillingPeriod
  ): Promise<PaymentResult> => {
    console.log('[useNativePayment] confirmNativePayment called:', {
      plan,
      period,
      isNativePaySupported,
      isProcessing,
    });

    if (!isNativePaySupported || isProcessing) {
      return { success: false, error: 'Not available' };
    }

    setIsProcessing(true);

    try {
      // 1. Get payment details from backend
      const result = await subscribe(plan, period);
      if (!result.clientSecret) {
        return { success: true, action: result.action };
      }

      // 2. Confirm with native payment - use appropriate method for intent type
      let error;

      if (result.intentType === 'setup') {
        // For trials, use confirmPlatformPaySetupIntent (SetupIntent)
        console.log('[useNativePayment] Using SetupIntent for trial subscription');
        const setupResult = await confirmPlatformPaySetupIntent(
          result.clientSecret,
          {
            applePay: {
              cartItems: [{
                label: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${period}) - 14 Day Trial`,
                amount: '0.00', // Trial is free initially
                paymentType: PaymentType.Immediate,
              }, {
                label: `Then ${result.amount ? (result.amount / 100).toFixed(2) : '0.00'} per ${period === 'monthly' ? 'month' : 'year'}`,
                amount: result.amount ? (result.amount / 100).toFixed(2) : '0.00',
                paymentType: PaymentType.Recurring,
              }],
              merchantCountryCode: 'US',
              currencyCode: 'USD',
            },
            googlePay: {
              currencyCode: 'USD',
              merchantCountryCode: 'US',
              testEnv: __DEV__,
            },
          }
        );
        error = setupResult.error;
      } else {
        // For immediate payments, use confirmPlatformPayPayment (PaymentIntent)
        console.log('[useNativePayment] Using PaymentIntent for immediate payment');
        const paymentResult = await confirmPlatformPayPayment(
          result.clientSecret,
          {
            applePay: {
              cartItems: [{
                label: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${period})`,
                amount: result.amount ? (result.amount / 100).toFixed(2) : '0.00',
                paymentType: PaymentType.Recurring,
              }],
              merchantCountryCode: 'US',
              currencyCode: 'USD',
            },
            googlePay: {
              currencyCode: 'USD',
              merchantCountryCode: 'US',
              testEnv: __DEV__,
            },
          }
        );
        error = paymentResult.error;
      }

      if (error) {
        if (error.code === 'Canceled') {
          trackPaywall.paymentCanceled(plan, period, Platform.OS === 'ios' ? 'apple_pay' : 'google_pay');
          return { success: false, error: 'canceled' };
        }
        throw new Error(error.message);
      }

      const paymentMethod = Platform.OS === 'ios' ? 'apple_pay' : 'google_pay';
      trackPaywall.paymentSuccess(plan, period, paymentMethod, paymentMethod);

      return {
        success: true,
        action: 'subscribed',
        paymentMethod
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      const paymentMethod = Platform.OS === 'ios' ? 'apple_pay' : 'google_pay';

      trackPaywall.paymentError(plan, period, paymentMethod, message);

      if (!message.includes('canceled')) {
        Alert.alert('Payment Error', message);
      }

      return {
        success: false,
        error: message
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple payment sheet presentation
  const showPaymentSheet = async (
    clientSecret: string,
    customerId?: string,
    ephemeralKey?: string
  ): Promise<PaymentResult> => {
    try {
      // Simple, clean configuration
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'INGRD',
        customerId,
        customerEphemeralKeySecret: ephemeralKey,

        // Only enable what we need
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
        },

        // Clean appearance
        appearance: {
          colors: {
            primary: '#6366F1',
            background: '#FFFFFF',
            componentBackground: '#F9FAFB',
            componentText: '#111827',
            primaryText: '#111827',
            secondaryText: '#6B7280',
            placeholderText: '#9CA3AF',
            icon: '#6B7280',
            error: '#EF4444',
          },
          shapes: {
            borderRadius: 8,
            borderWidth: 1,
          },
          primaryButton: {
            colors: {
              background: '#6366F1',
              text: '#FFFFFF',
              border: '#6366F1',
            },
          },
        },

        // Save payment method by default
        defaultBillingDetails: {
          email: user?.email,
          name: user?.displayName,
        },

        returnURL: 'ingrd://payment-complete',
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          return { success: false, error: 'canceled' };
        }
        throw new Error(error.message);
      }

      return {
        success: true,
        action: 'subscribed',
        paymentMethod: 'card'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      return {
        success: false,
        error: message
      };
    }
  };

  // Enhanced subscription confirmation that handles both native and card payments
  const confirmSubscription = async (
    plan: PlanType,
    period: BillingPeriod = 'monthly'
  ): Promise<PaymentResult> => {
    if (isProcessing) return { success: false, error: 'Already processing' };

    try {
      setIsProcessing(true);

      // Track payment attempt
      trackPaywall.paymentAttempt(plan, period, 'payment_sheet');

      // Create subscription on backend
      const result = await subscribe(plan, period);

      // Handle based on action type
      if (result.action === 'upgraded' || result.action === 'downgraded') {
        return { success: true, action: result.action };
      }

      // Present payment sheet for new subscriptions
      if (result.clientSecret) {
        const paymentResult = await showPaymentSheet(
          result.clientSecret,
          result.customerId,
          result.ephemeralKey
        );

        if (paymentResult.success) {
          trackPaywall.paymentSuccess(plan, period, 'payment_sheet', 'card');
        } else if (paymentResult.error === 'canceled') {
          trackPaywall.paymentCanceled(plan, period, 'payment_sheet');
        } else {
          trackPaywall.paymentError(plan, period, 'payment_sheet', paymentResult.error || 'Unknown error');
        }

        return paymentResult;
      }

      return { success: true, action: result.action };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      trackPaywall.paymentError(plan, period, 'payment_sheet', message);

      if (!message.includes('canceled')) {
        Alert.alert('Payment Error', message);
      }

      return { success: false, error: message };
    } finally {
      setIsProcessing(false);
    }
  };

  // Add payment method without subscription
  const addPaymentMethod = async (options?: {
    savePaymentMethod?: boolean;
    requireBillingAddress?: boolean;
  }): Promise<PaymentResult> => {
    try {
      setIsProcessing(true);

      // Create setup intent on backend
      const { setupIntentClientSecret, customerId } = await createSetupIntentMutation.mutateAsync();

      // Configure payment sheet for setup
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'INGRD',
        setupIntentClientSecret,
        customerId,
        allowsDelayedPaymentMethods: false,
        returnURL: 'ingrd://payment-method-added',
        defaultBillingDetails: {
          email: user?.email,
          name: user?.displayName,
        },
        appearance: {
          colors: {
            primary: '#6366F1',
            background: '#FFFFFF',
            componentBackground: '#F9FAFB',
            componentText: '#111827',
            primaryText: '#111827',
            secondaryText: '#6B7280',
            placeholderText: '#9CA3AF',
            icon: '#6B7280',
            error: '#EF4444',
          },
          shapes: {
            borderRadius: 8,
            borderWidth: 1,
          },
          primaryButton: {
            colors: {
              background: '#6366F1',
              text: '#FFFFFF',
              border: '#6366F1',
            },
          },
        },
      });

      if (initError) throw new Error(initError.message);

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return { success: false, error: 'canceled' };
        }
        throw new Error(presentError.message);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add payment method';
      Alert.alert('Error', message);
      return { success: false, error: message };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    // State
    isProcessing,
    isNativePaySupported,

    // Methods
    confirmNativePayment,
    confirmSubscription,
    showPaymentSheet,
    addPaymentMethod,
  };
}