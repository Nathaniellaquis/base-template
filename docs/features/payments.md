# 💳 Complete Payment System Guide

## Table of Contents
1. [Overview](#overview)
2. [Available Hooks](#available-hooks)
3. [Core Functions](#core-functions)
4. [Common Scenarios](#common-scenarios)
5. [UI Components](#ui-components)
6. [Backend Integration](#backend-integration)
7. [Testing](#testing)

---

## Overview

The payment system is built on **Stripe** with a clean, hook-based API for React Native/Expo. It handles subscriptions, plan upgrades/downgrades, and payment failures automatically.

### Key Features
- 🎯 **One-line feature gating**: `if (requirePlan('pro')) { ... }`
- 🔄 **Automatic upgrade prompts**: Modal shows when user lacks required plan
- 💰 **Smart billing**: Upgrades are immediate, downgrades at period end
- 🔒 **Edge case handling**: Past due, trials, cancellations all handled
- 📱 **Cross-platform**: Works on iOS, Android, and Web

### Plan Hierarchy
```typescript
type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';
```

---

## Available Hooks

### 🎣 Core Payment Hook

#### `usePayment()`
Access all payment functionality and subscription state.

```typescript
const {
  subscription,      // Current subscription object
  plan,             // Current plan: 'free' | 'basic' | 'pro' | 'enterprise'
  isLoading,        // Loading state
  
  // Actions
  createSubscription,    // Start new subscription
  cancelSubscription,    // Cancel (at period end by default)
  resumeSubscription,    // Resume canceled subscription
  updateSubscription,    // Change plan (upgrade/downgrade)
  openCustomerPortal,    // Open Stripe billing portal
  refreshSubscription,   // Force refresh from server
  requirePlan,          // Check plan & show upgrade modal
} = usePayment();
```

### 🔐 Plan Checking Hooks

#### `useRequirePlan()`
Returns a function to check if user has required plan. Shows upgrade modal if not.

```typescript
const requirePlan = useRequirePlan();

const handlePremiumFeature = () => {
  if (requirePlan('pro', 'Advanced Analytics')) {
    // User has pro plan, proceed
    openAnalytics();
  }
  // Modal automatically shown if they don't have pro
};
```

#### `useHasPlan(minPlan)`
Check if user has a specific plan or higher. No modal shown.

```typescript
const hasPro = useHasPlan('pro');

if (hasPro) {
  return <ProFeatures />;
} else {
  return <LockedFeature onPress={() => requirePlan('pro')} />;
}
```

### 📊 Status Hooks

#### `useSubscriptionStatus()`
Get detailed subscription status information.

```typescript
const {
  isLoading,          // Subscription data loading
  isActive,           // Has active subscription
  isTrialing,         // In trial period
  isPastDue,          // Payment failed
  isCanceling,        // Canceled but has time left
  willExpireAt,       // Cancellation date
  needsPaymentMethod, // Requires payment update
} = useSubscriptionStatus();

// Show appropriate UI based on status
if (isPastDue) {
  return <PaymentRequiredBanner />;
}
```

#### `useHasActiveSubscription()`
Simple boolean check for any active subscription.

```typescript
const hasSubscription = useHasActiveSubscription();

if (!hasSubscription) {
  return <FreeUserExperience />;
}
```

#### `useIsCanceling()`
Check if subscription is set to cancel.

```typescript
const isCanceling = useIsCanceling();

if (isCanceling) {
  return <CancelationWarning />;
}
```

### 🎯 Plan Limits Hook

#### `usePlanLimits()`
Get the limits for the current plan.

```typescript
const limits = usePlanLimits();

// limits = {
//   projects: 10,      // or -1 for unlimited
//   teamMembers: 3,
//   storage: 10,       // GB
//   analyticsRetention: 30  // days
// }

const canCreateProject = 
  limits.projects === -1 || currentProjects < limits.projects;
```

---

## Core Functions

### Creating a Subscription

```typescript
const { createSubscription } = usePayment();

const handleSubscribe = async (priceId: string) => {
  try {
    const result = await createSubscription(priceId);
    // result = { subscriptionId, clientSecret, status }
    
    // Initialize payment sheet with clientSecret
    await initPaymentSheet({ 
      paymentIntentClientSecret: result.clientSecret 
    });
    
    // Present payment UI
    await presentPaymentSheet();
    
    Alert.alert('Success', 'Subscription created!');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### Canceling a Subscription

```typescript
const { cancelSubscription } = usePayment();

// Cancel at period end (default - user keeps access)
await cancelSubscription();

// Cancel immediately (user loses access now)
await cancelSubscription(true);
```

### Resuming a Canceled Subscription

```typescript
const { resumeSubscription, subscription } = usePayment();

if (subscription.cancelAtPeriodEnd) {
  await resumeSubscription();
  Alert.alert('Success', 'Subscription resumed!');
}
```

### Changing Plans (Upgrade/Downgrade)

```typescript
const { updateSubscription } = usePayment();

// The system automatically detects if it's an upgrade or downgrade
// Upgrades: Immediate with proration
// Downgrades: Scheduled at period end

await updateSubscription('price_new_plan_id');
```

### Opening Customer Portal

```typescript
const { openCustomerPortal } = usePayment();

// Opens Stripe's customer portal where users can:
// - Update payment method
// - Download invoices  
// - Change billing address
// - View payment history
await openCustomerPortal();
```

---

## Common Scenarios

### 1. Feature Behind Paywall

```typescript
import { useRequirePlan } from '@/providers/payment-provider';

export function PremiumFeatureButton() {
  const requirePlan = useRequirePlan();
  
  const handlePress = () => {
    // This single line handles everything!
    if (requirePlan('pro', 'API Access')) {
      // User has pro plan
      navigateToAPISettings();
    }
    // Upgrade modal shown automatically if needed
  };
  
  return (
    <Button title="Configure API" onPress={handlePress} />
  );
}
```

### 2. Conditionally Rendered Content

```typescript
export function AnalyticsDashboard() {
  const hasPro = useHasPlan('pro');
  const requirePlan = useRequirePlan();
  
  if (!hasPro) {
    return (
      <LockedFeature
        title="Analytics"
        description="Upgrade to Pro for analytics"
        onUpgrade={() => requirePlan('pro', 'Analytics')}
      />
    );
  }
  
  return <FullAnalyticsDashboard />;
}
```

### 3. Enforcing Limits

```typescript
export function ProjectList() {
  const limits = usePlanLimits();
  const requirePlan = useRequirePlan();
  const [projects, setProjects] = useState([]);
  
  const createProject = () => {
    if (limits.projects !== -1 && projects.length >= limits.projects) {
      // Determine next plan tier
      const nextPlan = 
        limits.projects < 10 ? 'basic' :
        limits.projects < 50 ? 'pro' : 'enterprise';
      
      requirePlan(nextPlan, `More than ${limits.projects} projects`);
      return;
    }
    
    // Create project
    addNewProject();
  };
  
  return (
    <View>
      <Text>
        Projects ({projects.length}/{limits.projects === -1 ? '∞' : limits.projects})
      </Text>
      <Button title="New Project" onPress={createProject} />
    </View>
  );
}
```

### 4. Subscription Management Page

```typescript
export function SubscriptionSettings() {
  const {
    subscription,
    plan,
    cancelSubscription,
    resumeSubscription,
    openCustomerPortal,
  } = usePayment();
  
  const {
    isActive,
    isCanceling,
    willExpireAt,
    isPastDue,
  } = useSubscriptionStatus();
  
  if (isPastDue) {
    return (
      <Card className="bg-red-50 p-4">
        <Text className="text-red-800 font-bold">Payment Required</Text>
        <Text>Your payment method failed. Please update it.</Text>
        <Button 
          title="Update Payment Method" 
          onPress={openCustomerPortal}
        />
      </Card>
    );
  }
  
  return (
    <View>
      <Card>
        <Text>Current Plan: {plan}</Text>
        <Text>Status: {subscription.status}</Text>
        
        {isCanceling && (
          <View>
            <Text>Canceling on {new Date(willExpireAt).toLocaleDateString()}</Text>
            <Button title="Resume" onPress={resumeSubscription} />
          </View>
        )}
        
        {isActive && !isCanceling && (
          <Button 
            title="Cancel Subscription" 
            onPress={() => cancelSubscription()}
          />
        )}
        
        <Button 
          title="Manage Billing" 
          onPress={openCustomerPortal}
        />
      </Card>
    </View>
  );
}
```

### 5. Trial Banner

```typescript
export function TrialBanner() {
  const { isTrialing, willExpireAt } = useSubscriptionStatus();
  
  if (!isTrialing) return null;
  
  const daysLeft = Math.ceil(
    (new Date(willExpireAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  return (
    <Banner>
      <Text>Your trial ends in {daysLeft} days</Text>
      <Button title="Upgrade Now" onPress={() => router.push('/subscription')} />
    </Banner>
  );
}
```

---

## UI Components

### CheckoutForm
Custom checkout form with card input.

```typescript
import { CheckoutForm } from '@/components/features/payment';

<CheckoutForm
  plan="pro"
  priceId="price_pro_monthly"
  price="$29.99"
  onSuccess={() => router.push('/dashboard')}
  onCancel={() => router.back()}
/>
```

### SubscriptionManager
Complete subscription management UI.

```typescript
import { SubscriptionManager } from '@/components/features/payment';

// Full subscription management interface
<SubscriptionManager />
```

### UpgradeModal
Automatically shown by `requirePlan()`, but can be used manually.

```typescript
import { UpgradeModal } from '@/components/features/payment';

<UpgradeModal
  visible={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  currentPlan="free"
  requiredPlan="pro"
  feature="Advanced Analytics"
/>
```

---

## Backend Integration

### TRPC Endpoints

All payment operations go through TRPC:

```typescript
// Available procedures
api.payment.getSubscription()      // Get current subscription
api.payment.createSubscription()   // Start new subscription
api.payment.cancelSubscription()   // Cancel subscription
api.payment.resumeSubscription()   // Resume canceled subscription
api.payment.updateSubscription()   // Change plans
api.payment.createPortalSession()  // Get portal URL
api.payment.addPaymentMethod()     // Add new payment method
```

### Protecting Backend Routes

```typescript
// In your TRPC routers
export const protectedRouter = router({
  premiumFeature: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { user } = ctx;
      
      // Always verify on backend!
      if (!user.subscription || user.subscription.plan !== 'pro') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Pro plan required',
        });
      }
      
      // Proceed with premium feature
    }),
});
```

### Webhook Events

The system automatically handles these Stripe webhooks:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Testing

### Test Card Numbers

```typescript
// Successful payment
4242 4242 4242 4242

// Declined
4000 0000 0000 0002

// Requires authentication
4000 0025 0000 3155
```

### Test Scenarios

1. **New Subscription**
   - Start as free user
   - Click premium feature
   - Complete checkout
   - Verify access granted

2. **Cancellation Flow**
   - Cancel subscription
   - Verify "canceling" status
   - Check access retained
   - Let expire → becomes free

3. **Payment Failure**
   - Use declining card
   - Check past_due status
   - Fix payment method
   - Verify reactivation

4. **Plan Changes**
   - Upgrade → immediate
   - Downgrade → end of period
   - Multiple changes → latest wins

### Environment Variables

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...

# .env (frontend)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_STRIPE_MERCHANT_ID=merchant.com.ingrd
```

---

## Quick Reference

### Check if user can access feature
```typescript
if (requirePlan('pro', 'Feature Name')) {
  // Has access
}
```

### Check plan without modal
```typescript
const hasPro = useHasPlan('pro');
```

### Get subscription details
```typescript
const { subscription, plan } = usePayment();
```

### Cancel subscription
```typescript
await cancelSubscription(); // At period end
```

### Open billing portal
```typescript
await openCustomerPortal();
```

### Check if past due
```typescript
const { isPastDue } = useSubscriptionStatus();
```

---

## Support & Troubleshooting

### Common Issues

**User sees wrong plan**
- Check webhook logs in Stripe dashboard
- Verify `lastSyncedAt` timestamp
- Force refresh: `refreshSubscription()`

**Modal shows repeatedly**
- Ensure `requirePlan()` is in event handler, not render
- Check for infinite loops in useEffect

**Downgrade happens immediately**
- Verify backend detects downgrades correctly
- Check `proration_behavior: 'none'` is set

**Webhooks not working**
- Verify webhook secret is correct
- Check server logs for signature errors
- Use Stripe CLI to test locally

### Local Development

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhook/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```