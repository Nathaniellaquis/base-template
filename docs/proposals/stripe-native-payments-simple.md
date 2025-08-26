# Stripe Native Payments Implementation - Simple Approach

## Executive Summary

Let's implement native payments the right way: simple, clean, and focused on what actually improves conversion. We'll add Apple Pay and Google Pay to the existing card payments, making checkout faster for 80%+ of mobile users.

## What We're Building

### Core Features Only
1. **Apple Pay** (iOS users)
2. **Google Pay** (Android users)  
3. **Enhanced Payment Sheet** (better UX for card payments)
4. **Saved Payment Methods** (returning customers)

That's it. No regional methods, no complexity.

## Implementation Plan

### Phase 1: Native Wallet Payments (1 week)

#### Simple Apple Pay/Google Pay Hook

```typescript
// hooks/useNativePayment.ts
import { usePlatformPay, useStripe } from '@stripe/stripe-react-native';

export function useNativePayment() {
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const { subscribe } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check platform pay support once
  const [isNativePaySupported, setIsNativePaySupported] = useState(false);
  
  useEffect(() => {
    isPlatformPaySupported().then(setIsNativePaySupported);
  }, []);

  const confirmNativePayment = async (
    plan: PlanType,
    period: BillingPeriod
  ): Promise<PaymentResult> => {
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

      // 2. Confirm with native payment (works for both Apple & Google Pay)
      const { error } = await confirmPlatformPayPayment(
        result.clientSecret,
        {
          applePay: {
            cartItems: [{
              label: `${plan} Plan (${period})`,
              amount: result.amount.toString(),
              paymentType: 'Recurring',
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

      if (error) {
        throw new Error(error.message);
      }

      return { 
        success: true, 
        action: 'subscribed',
        paymentMethod: Platform.OS === 'ios' ? 'apple_pay' : 'google_pay'
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isNativePaySupported,
    confirmNativePayment,
    isProcessing,
  };
}
```

#### Single Native Pay Button

```typescript
// components/features/payment/NativePayButton.tsx
import { PlatformPayButton, PlatformPay } from '@stripe/stripe-react-native';

export function NativePayButton({ plan, period, onSuccess }) {
  const { isNativePaySupported, confirmNativePayment } = useNativePayment();

  if (!isNativePaySupported) return null;

  const handlePress = async () => {
    const result = await confirmNativePayment(plan, period);
    if (result.success) {
      onSuccess();
    }
  };

  return (
    <PlatformPayButton
      type={PlatformPay.ButtonType.Subscribe}
      appearance={PlatformPay.ButtonStyle.Black}
      borderRadius={8}
      onPress={handlePress}
      style={styles.button}
    />
  );
}
```

### Phase 2: Better Payment Sheet (3 days)

#### Simplified Payment Sheet Configuration

```typescript
// hooks/usePaymentSheet.ts
export function useSimplePaymentSheet() {
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const { theme } = useTheme();

  const showPaymentSheet = async (
    clientSecret: string,
    customerId?: string,
    ephemeralKey?: string
  ) => {
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
          primary: theme.colors.primary,
          background: theme.colors.background,
          componentBackground: theme.colors.surface,
          text: theme.colors.text,
          error: theme.colors.error,
        },
        shapes: {
          borderRadius: 8,
        },
      },
      
      // Save payment method by default
      defaultBillingDetails: {
        email: user?.email,
      },
    });

    if (initError) {
      throw new Error(initError.message);
    }

    const { error } = await presentPaymentSheet();
    
    return { 
      success: !error, 
      canceled: error?.code === 'Canceled' 
    };
  };

  return { showPaymentSheet };
}
```

### Phase 3: Saved Payment Methods (3 days)

#### Simple Payment Method Management

```typescript
// hooks/useSavedPayments.ts
export function useSavedPayments() {
  const { data: paymentMethods, refetch } = trpc.payment.getPaymentMethods.useQuery();
  
  const setDefaultMethod = trpc.payment.setDefaultPaymentMethod.useMutation({
    onSuccess: () => refetch(),
  });
  
  const removeMethod = trpc.payment.removePaymentMethod.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    paymentMethods: paymentMethods || [],
    setDefault: (id: string) => setDefaultMethod.mutate({ paymentMethodId: id }),
    remove: (id: string) => removeMethod.mutate({ paymentMethodId: id }),
    isLoading: !paymentMethods,
  };
}
```

#### Clean Payment Method List

```typescript
// components/features/payment/SavedPaymentMethods.tsx
export function SavedPaymentMethods() {
  const { paymentMethods, setDefault, remove } = useSavedPayments();

  return (
    <View style={styles.container}>
      {paymentMethods.map(method => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          onSetDefault={() => setDefault(method.id)}
          onRemove={() => remove(method.id)}
        />
      ))}
      
      <Button
        title="Add Payment Method"
        onPress={showPaymentSheet}
        variant="secondary"
      />
    </View>
  );
}
```

## Simplified Payment Flow

```typescript
// components/features/payment/PaymentSelection.tsx
export function PaymentSelection({ plan, period, onSuccess }) {
  const { isNativePaySupported } = useNativePayment();
  const { showPaymentSheet } = useSimplePaymentSheet();

  return (
    <View style={styles.container}>
      {/* Native payment option (Apple/Google Pay) */}
      {isNativePaySupported && (
        <>
          <NativePayButton 
            plan={plan} 
            period={period} 
            onSuccess={onSuccess} 
          />
          
          <Text style={styles.divider}>or pay with card</Text>
        </>
      )}
      
      {/* Card payment option */}
      <Button
        title="Enter Card Details"
        onPress={async () => {
          const result = await showPaymentSheet(clientSecret);
          if (result.success) onSuccess();
        }}
      />
    </View>
  );
}
```

## Backend Changes (Minimal)

```typescript
// server/routers/payment.ts - Add to existing router
export const paymentRouter = router({
  // Existing subscribe method works fine, just ensure it returns:
  subscribe: protectedProcedure
    .input(/* existing */)
    .mutation(async ({ ctx, input }) => {
      // ... existing logic ...
      return {
        action: 'requires_payment_method',
        clientSecret: paymentIntent.client_secret,
        amount: price,
        customerId: customer.id,
        ephemeralKey: ephemeralKey.secret,
      };
    }),

  // Add these simple endpoints
  getPaymentMethods: protectedProcedure
    .query(async ({ ctx }) => {
      const methods = await stripe.paymentMethods.list({
        customer: ctx.user.stripeCustomerId,
        type: 'card',
      });
      
      return methods.data.map(pm => ({
        id: pm.id,
        type: 'card',
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        isDefault: pm.id === ctx.user.defaultPaymentMethodId,
      }));
    }),

  setDefaultPaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await stripe.customers.update(ctx.user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: input.paymentMethodId,
        },
      });
      
      // Update user record
      await updateUser(ctx.user.id, {
        defaultPaymentMethodId: input.paymentMethodId,
      });
    }),
});
```

## What We're NOT Building

❌ Regional payment methods (SEPA, iDEAL, etc.)  
❌ Buy now, pay later (Klarna, Afterpay)  
❌ Bank transfers  
❌ Cash payment methods  
❌ Complex country detection  
❌ Multiple currency support  

## Success Metrics

1. **Native Payment Adoption**: 40%+ of mobile users choose Apple/Google Pay
2. **Conversion Improvement**: 10-15% higher on mobile
3. **Payment Time**: <10 seconds with native pay vs 45+ seconds manual entry
4. **Return Customer Speed**: <5 seconds with saved payment method

## Timeline

**Week 1:**
- Day 1-2: Implement native payment hook
- Day 3-4: Add UI components  
- Day 5: Test on physical devices

**Week 2:**
- Day 1-2: Enhanced payment sheet
- Day 3: Saved payment methods
- Day 4-5: Testing & polish

Total: 2 weeks to production-ready native payments

## Testing Checklist

- [ ] Apple Pay on physical iPhone
- [ ] Google Pay on physical Android
- [ ] Payment sheet on both platforms
- [ ] Saved payment methods
- [ ] Subscription renewal with saved method
- [ ] Error handling (declined cards, network issues)
- [ ] Analytics tracking

## Conclusion

This approach gives us 80% of the value with 20% of the complexity. We're focusing on what actually matters: making it easier for users to pay. Native payments reduce friction, saved cards help retention, and the clean implementation keeps maintenance simple.

No over-engineering. Just better payments.