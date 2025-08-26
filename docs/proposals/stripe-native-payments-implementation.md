# Stripe Native Payments Implementation Proposal

## Executive Summary

This proposal outlines the implementation of Stripe's native payment capabilities in the INGRD mobile application. Our current implementation only utilizes ~20% of available native payment features. This document provides a comprehensive plan to integrate Apple Pay, Google Pay, and other native payment methods to improve conversion rates and user experience.

## Current State Analysis

### What We Have
1. **Basic Payment Sheet** - Functional but limited configuration
2. **Stripe Provider** - Properly initialized with publishable key
3. **Payment Hooks** - `useNativePayment` with placeholder implementations
4. **UI Components** - ApplePayButton and GooglePayButton (non-functional)

### What's Missing
1. **Platform Pay Integration** - Apple Pay and Google Pay are stubbed but not implemented
2. **Alternative Payment Methods** - Only card payments are supported
3. **Saved Payment Methods** - No customer payment method management
4. **Regional Payment Options** - No support for local payment methods

## Technical Implementation Plan

### Phase 1: Platform Pay Integration (Week 1-2)

#### 1.1 Apple Pay Implementation

```typescript
// hooks/useNativePayment.ts - Apple Pay implementation
import { usePlatformPay } from '@stripe/stripe-react-native';

export function useNativePayment() {
  const {
    isPlatformPaySupported,
    confirmPlatformPayPayment,
    createPlatformPayPaymentMethod,
  } = usePlatformPay();

  const confirmApplePaySubscription = async (
    plan: PlanType,
    period: BillingPeriod
  ) => {
    // 1. Check Apple Pay support
    if (!await isPlatformPaySupported()) {
      return { success: false, error: 'Apple Pay not supported' };
    }

    // 2. Create payment intent via backend
    const { clientSecret, amount } = await createSubscriptionIntent(plan, period);

    // 3. Confirm payment with Apple Pay
    const { error } = await confirmPlatformPayPayment(
      clientSecret,
      {
        applePay: {
          cartItems: [{
            label: `${plan} Plan (${period})`,
            amount: amount.toString(),
            paymentType: PlatformPay.PaymentType.Recurring,
          }],
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          requiredBillingContactFields: [
            PlatformPay.ContactField.EmailAddress,
            PlatformPay.ContactField.Name,
          ],
        },
      }
    );

    if (!error) {
      return { success: true, paymentMethod: 'apple_pay' };
    }
    return { success: false, error: error.message };
  };
}
```

#### 1.2 Google Pay Implementation

```typescript
// Same API as Apple Pay, with googlePay config
const confirmGooglePaySubscription = async (
  plan: PlanType,
  period: BillingPeriod
) => {
  const { error } = await confirmPlatformPayPayment(
    clientSecret,
    {
      googlePay: {
        testEnv: __DEV__,
        merchantName: 'INGRD',
        merchantCountryCode: 'US',
        currencyCode: 'USD',
        billingAddressConfig: {
          format: PlatformPay.BillingAddressFormat.Full,
          isPhoneNumberRequired: false,
          isRequired: true,
        },
      },
    }
  );
};
```

#### 1.3 Platform Pay Button Component

```typescript
// components/features/payment/PlatformPayButton.tsx
import { PlatformPayButton } from '@stripe/stripe-react-native';

export function NativePlatformPayButton({ plan, period, onSuccess }) {
  const { isPlatformPaySupported } = usePlatformPay();
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    isPlatformPaySupported().then(setSupported);
  }, []);

  if (!supported) return null;

  return (
    <PlatformPayButton
      type={PlatformPay.ButtonType.Subscribe}
      appearance={PlatformPay.ButtonStyle.Black}
      borderRadius={8}
      onPress={() => handlePayment(plan, period)}
      style={styles.button}
    />
  );
}
```

### Phase 2: Enhanced Payment Sheet (Week 2-3)

#### 2.1 Configure Additional Payment Methods

```typescript
// hooks/useEnhancedPaymentSheet.ts
export function useEnhancedPaymentSheet() {
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  const configurePaymentSheet = async (
    clientSecret: string,
    customerId: string,
    ephemeralKey: string
  ) => {
    await initPaymentSheet({
      merchantDisplayName: 'INGRD',
      paymentIntentClientSecret: clientSecret,
      customerId,
      customerEphemeralKeySecret: ephemeralKey,
      
      // Enable additional payment methods
      paymentMethodTypes: [
        'card',
        'us_bank_account',
        'afterpay_clearpay',
        'klarna',
        'cashapp',
      ],
      
      // Appearance customization
      appearance: {
        colors: {
          primary: '#6366F1',
          background: '#FFFFFF',
          componentBackground: '#F9FAFB',
          componentBorder: '#E5E7EB',
          componentDivider: '#E5E7EB',
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
          shapes: {
            borderRadius: 8,
          },
        },
      },
      
      // Default billing details
      defaultBillingDetails: {
        email: user?.email,
        name: user?.displayName,
      },
      
      // Return URL for redirect-based payment methods
      returnURL: 'ingrd://stripe-redirect',
      
      // Allow delayed payment methods
      allowsDelayedPaymentMethods: true,
    });
  };
}
```

#### 2.2 Bank Account Payments

```typescript
// hooks/useBankPayment.ts
import { collectBankAccountForPayment } from '@stripe/stripe-react-native';

export function useBankPayment() {
  const collectBankAccount = async (
    clientSecret: string,
    billingDetails: BillingDetails
  ) => {
    const { paymentIntent, error } = await collectBankAccountForPayment(
      clientSecret,
      {
        paymentMethodType: 'USBankAccount',
        paymentMethodData: {
          billingDetails,
        },
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    // Handle microdeposit verification if needed
    if (paymentIntent?.status === 'requires_action') {
      // Show verification UI
    }

    return { success: true, paymentIntent };
  };
}
```

### Phase 3: Saved Payment Methods (Week 3-4)

#### 3.1 Customer Sheet Implementation

```typescript
// hooks/useCustomerSheet.ts
import { useCustomerSheet } from '@stripe/stripe-react-native';

export function useCustomerPaymentMethods() {
  const {
    initCustomerSheet,
    presentCustomerSheet,
    retrievePaymentOptionSelection,
  } = useCustomerSheet();

  const initializeCustomerSheet = async () => {
    const { customerId, ephemeralKey, paymentMethods } = 
      await trpc.payment.getCustomerData.query();

    await initCustomerSheet({
      merchantDisplayName: 'INGRD',
      customerId,
      customerEphemeralKeySecret: ephemeralKey,
      setupIntentClientSecret: setupIntentSecret,
      // Optional: pre-select a payment method
      defaultPaymentOption: paymentMethods[0]?.id,
      appearance: appearanceParams,
    });
  };

  const showPaymentMethodSelector = async () => {
    const { paymentOption, error } = await presentCustomerSheet();
    
    if (!error && paymentOption) {
      // Update selected payment method
      await updateDefaultPaymentMethod(paymentOption.id);
    }
  };
}
```

#### 3.2 Add to Wallet Feature

```typescript
// components/features/payment/AddToWalletButton.tsx
import { AddToWalletButton } from '@stripe/stripe-react-native';

export function PaymentMethodWalletButton({ paymentMethod }) {
  const [canAddToWallet, setCanAddToWallet] = useState(false);

  useEffect(() => {
    checkIfCanAddToWallet(paymentMethod).then(setCanAddToWallet);
  }, [paymentMethod]);

  if (!canAddToWallet) return null;

  return (
    <AddToWalletButton
      testEnv={__DEV__}
      style={styles.walletButton}
      cardDetails={{
        primaryAccountIdentifier: paymentMethod.wallet?.id,
        name: paymentMethod.billing_details.name,
        lastFour: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
      }}
      onComplete={(result) => {
        if (result.error) {
          Alert.alert('Error', result.error.message);
        }
      }}
    />
  );
}
```

### Phase 4: Regional Payment Methods (Week 4-5)

#### 4.1 SEPA Direct Debit (Europe)

```typescript
// hooks/useSepaPayment.ts
export function useSepaPayment() {
  const { confirmSepaDebitPayment } = useStripe();

  const collectSepaDetails = async (
    clientSecret: string,
    iban: string,
    email: string,
    name: string
  ) => {
    const { error } = await confirmSepaDebitPayment(clientSecret, {
      paymentMethodType: 'SepaDebit',
      paymentMethodData: {
        billingDetails: { email, name },
        sepaDebit: { iban },
      },
    });

    return { success: !error, error: error?.message };
  };
}
```

#### 4.2 Dynamic Payment Method Selection

```typescript
// utils/payment-methods.ts
export const getAvailablePaymentMethods = (country: string): PaymentMethodType[] => {
  const baseMethod = ['card'];
  
  const regionalMethods: Record<string, PaymentMethodType[]> = {
    US: ['us_bank_account', 'cashapp', 'afterpay_clearpay'],
    GB: ['bacs_debit', 'afterpay_clearpay'],
    EU: ['sepa_debit', 'ideal', 'bancontact', 'giropay', 'klarna'],
    NL: ['ideal', 'sepa_debit'],
    DE: ['giropay', 'sepa_debit', 'klarna'],
    AU: ['au_becs_debit', 'afterpay_clearpay'],
    JP: ['konbini', 'paypay'],
    MX: ['oxxo'],
    BR: ['boleto'],
    IN: ['upi'],
    MY: ['fpx', 'grabpay'],
    SG: ['grabpay', 'paynow'],
  };

  return [...baseMethod, ...(regionalMethods[country] || [])];
};
```

## Backend Requirements

### API Endpoints Needed

```typescript
// server/routers/payment/native-payments.ts
export const nativePaymentRouter = router({
  // Create payment intent with native payment support
  createPaymentIntent: protectedProcedure
    .input(z.object({
      plan: z.enum(['basic', 'pro', 'enterprise']),
      period: z.enum(['monthly', 'yearly']),
      paymentMethodTypes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const amount = PRICING[input.plan][input.period] * 100;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: ctx.user.stripeCustomerId,
        payment_method_types: input.paymentMethodTypes || ['card'],
        setup_future_usage: 'off_session',
        metadata: {
          userId: ctx.user.id,
          plan: input.plan,
          period: input.period,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount / 100,
      };
    }),

  // Get customer payment data
  getCustomerData: protectedProcedure
    .query(async ({ ctx }) => {
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: ctx.user.stripeCustomerId },
        { apiVersion: '2023-10-16' }
      );

      const paymentMethods = await stripe.paymentMethods.list({
        customer: ctx.user.stripeCustomerId,
        type: 'card',
      });

      return {
        customerId: ctx.user.stripeCustomerId,
        ephemeralKey: ephemeralKey.secret,
        paymentMethods: paymentMethods.data,
      };
    }),
});
```

## Implementation Timeline

### Week 1-2: Platform Pay
- [ ] Implement Apple Pay flow
- [ ] Implement Google Pay flow
- [ ] Update UI components
- [ ] Add analytics tracking
- [ ] Test on physical devices

### Week 2-3: Enhanced Payment Sheet
- [ ] Enable additional payment methods
- [ ] Implement bank account payments
- [ ] Add redirect flow handling
- [ ] Update payment confirmation UI
- [ ] A/B test payment methods

### Week 3-4: Saved Payment Methods
- [ ] Implement Customer Sheet
- [ ] Add payment method management UI
- [ ] Implement Add to Wallet
- [ ] Create settings screen for payment methods
- [ ] Test subscription updates

### Week 4-5: Regional Methods
- [ ] Implement SEPA for EU
- [ ] Add regional payment detection
- [ ] Create dynamic payment UI
- [ ] Add localization
- [ ] Regional testing

## Success Metrics

1. **Conversion Rate**
   - Target: 15-20% improvement with native payments
   - Measure: Payment completion rate by method

2. **Payment Method Adoption**
   - Target: 30% of users use native payment methods
   - Measure: Payment method distribution

3. **Failed Payment Reduction**
   - Target: 25% reduction in payment failures
   - Measure: Error rate by payment method

4. **Regional Performance**
   - Target: 2x conversion in supported regions
   - Measure: Conversion by country/payment method

## Risk Mitigation

1. **Platform Compatibility**
   - Test on iOS 13+ and Android 5+
   - Graceful fallback to card payments
   - Clear error messaging

2. **Regulatory Compliance**
   - SCA compliance for EU payments
   - PSD2 requirements
   - Data residency considerations

3. **Testing Strategy**
   - Use Stripe test mode
   - Physical device testing required
   - Regional beta testing
   - Gradual rollout with feature flags

## Cost Analysis

1. **Stripe Fees**
   - Card: 2.9% + $0.30
   - Apple/Google Pay: Same as card
   - ACH: 0.8% (capped at $5)
   - SEPA: 0.8% + €0.25
   - Klarna/Afterpay: 2.9% + $0.30

2. **Development Cost**
   - 5 weeks of development
   - Testing and QA
   - Monitoring setup

## Conclusion

Implementing native payments will significantly improve the payment experience for INGRD users, leading to higher conversion rates and reduced payment friction. The phased approach ensures we can validate each implementation before moving to the next, minimizing risk while maximizing user benefit.

## Appendix: Code Examples

### Complete Apple Pay Flow Example

```typescript
// Full implementation example
export function ApplePaySubscription({ plan, period, onSuccess, onError }) {
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkApplePaySupport();
  }, []);

  const checkApplePaySupport = async () => {
    const supported = await isPlatformPaySupported();
    setIsSupported(supported && Platform.OS === 'ios');
  };

  const handleApplePay = async () => {
    try {
      setIsProcessing(true);
      
      // 1. Create payment intent
      const { clientSecret, amount } = await trpc.payment.createPaymentIntent.mutate({
        plan,
        period,
        paymentMethodTypes: ['card'],
      });

      // 2. Configure Apple Pay
      const { error, paymentIntent } = await confirmPlatformPayPayment(
        clientSecret,
        {
          applePay: {
            cartItems: [{
              label: `INGRD ${plan} Plan`,
              amount: amount.toString(),
              paymentType: PlatformPay.PaymentType.Recurring,
            }],
            merchantCountryCode: 'US',
            currencyCode: 'USD',
            requiredShippingContactFields: [],
            requiredBillingContactFields: [
              PlatformPay.ContactField.EmailAddress,
              PlatformPay.ContactField.Name,
              PlatformPay.ContactField.PhoneNumber,
            ],
            shippingMethods: [],
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // 3. Handle success
      await trackPaywall.paymentSuccess(plan, period, 'apple_pay');
      onSuccess(paymentIntent);
      
    } catch (error) {
      await trackPaywall.paymentError(plan, period, 'apple_pay', error.message);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) return null;

  return (
    <PlatformPayButton
      type={PlatformPay.ButtonType.Subscribe}
      appearance={PlatformPay.ButtonStyle.Black}
      borderRadius={8}
      onPress={handleApplePay}
      disabled={isProcessing}
      style={styles.applePayButton}
    />
  );
}
```