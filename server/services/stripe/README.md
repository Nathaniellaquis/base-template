# Stripe Services - Organized Structure

This folder contains all Stripe-related business logic, organized into clear, logical groups.

## 📁 Folder Structure

```
stripe/
├── index.ts                 # Single export point for all Stripe functionality
├── stripe-client.ts         # Stripe SDK instance
│
├── core-operations/         # Core Stripe API operations
│   ├── create-customer.ts
│   ├── create-subscription.ts
│   ├── update-subscription.ts
│   ├── cancel-subscription.ts
│   ├── resume-subscription.ts
│   ├── get-active-subscription.ts
│   ├── get-subscription.ts
│   ├── create-setup-intent.ts
│   ├── create-portal-session.ts
│   ├── get-payment-methods.ts
│   └── index.ts
│
├── user-sync/              # Database synchronization with Stripe
│   ├── update-user-subscription.ts  # MongoDB update operations
│   ├── ensure-customer.ts           # Get or create customer
│   └── index.ts
│
├── (webhook handlers moved to /server/webhooks/stripe/handlers/)
│
└── utilities/              # Helper functions
    ├── get-price-id.ts
    ├── get-plan-from-price-id.ts
    ├── get-plan-from-subscription.ts
    ├── construct-webhook-event.ts
    ├── lookup-user.ts              # User lookup by customer ID
    ├── webhook-response.ts         # Standard webhook responses
    ├── extract-subscription-id.ts  # Extract ID from various formats
    └── index.ts
```

## 🎯 Usage Examples

### Import from the main index:
```typescript
import { 
  createSubscription,      // from core-operations
  updateUserSubscription,  // from user-sync
  processCheckoutSession,  // from webhook-processing
  getPriceId              // from utilities
} from '@/services/stripe';
```

### Core Operations
Direct Stripe API calls for managing customers, subscriptions, and payments.

```typescript
// Create a new subscription
const subscription = await createSubscription(customerId, priceId);

// Cancel at period end
await cancelSubscription(subscriptionId);
```

### User Sync
Keep MongoDB in sync with Stripe data.

```typescript
// Update user's subscription in database
await updateUserSubscription(userId, stripeSubscription);

// Find user by Stripe customer ID
const user = await findUserByStripeCustomerId(customerId);
```

### Webhook Processing
Handle Stripe webhook events with clean, focused functions.

```typescript
// Process a successful checkout
const result = await processCheckoutSession(sessionId);

// Handle payment failure
await processInvoicePaymentFailed(invoice);
```

### Utilities
Helper functions for common operations.

```typescript
// Get price ID for a plan
const priceId = getPriceId('pro', 'monthly');

// Extract plan from subscription
const plan = getPlanFromSubscription(subscription);
```

## 🔒 Security Notes

- Never expose the Stripe secret key
- Always verify webhook signatures
- Use webhook endpoints, not polling
- Keep customer data in sync

## 📝 Adding New Features

1. **New API Operation?** → Add to `core-operations/`
2. **New Database Sync?** → Add to `user-sync/`
3. **New Webhook Handler?** → Add to `webhook-processing/`
4. **New Helper Function?** → Add to `utilities/`

Always export from the appropriate `index.ts` file!