# Stripe Architecture - Clean & Scalable

## 🏗️ Structure Overview

```
server/
├── services/
│   └── stripe/                    # ALL Stripe business logic
│       ├── index.ts              # Single export point
│       ├── stripe-client.ts      # Stripe SDK instance
│       │
│       ├── # Core Operations
│       ├── create-customer.ts
│       ├── create-subscription.ts
│       ├── update-subscription.ts
│       ├── cancel-subscription.ts
│       ├── resume-subscription.ts
│       │
│       ├── # User Sync Operations
│       ├── update-user-subscription.ts  # MongoDB updates
│       ├── ensure-customer.ts
│       │
│       ├── # Webhook Processing
│       ├── checkout-service.ts         # Checkout session logic
│       ├── subscription-service.ts     # Subscription lifecycle
│       ├── invoice-service.ts          # Payment processing
│       ├── payment-intent-service.ts   # One-time payments
│       │
│       └── # Utilities
│           ├── get-price-id.ts
│           ├── get-plan-from-price-id.ts
│           └── construct-webhook-event.ts
│
├── webhooks/
│   └── stripe/                    # ONLY routing, NO logic
│       ├── index.ts              # Main webhook router
│       ├── types.ts              # Shared types
│       └── handlers/             # Thin handlers that call services
│           ├── checkout.ts       # → processCheckoutSession()
│           ├── subscription.ts   # → processSubscriptionUpdate/Deleted()
│           ├── invoice.ts        # → processInvoicePayment*()
│           └── payment-intent.ts # → processPaymentIntent*()
│
└── routers/
    └── payment/                  # tRPC endpoints
        ├── subscribe.ts          # → createSubscription()
        ├── cancel.ts             # → cancelSubscription()
        ├── get-subscription.ts   # → getSubscription()
        └── create-portal-session.ts # → createPortalSession()
```

## 🎯 Design Principles

### 1. **Services Own ALL Business Logic**
- Webhooks are just routers that call services
- Endpoints are just validators that call services
- No direct Stripe API calls outside services
- No direct database access outside services

### 2. **Single Responsibility**
- Each file has ONE clear purpose
- Webhook handlers: Route events to services
- Service functions: Execute business logic
- No mixing of concerns

### 3. **Scalability**
- Add new webhook? Create handler → call service
- Add new feature? Create service function
- Need to change logic? Only touch service layer
- Easy to test - mock service functions

## 📝 Examples

### Webhook Handler (Super Simple)
```typescript
// webhooks/stripe/handlers/checkout.ts
export async function handleCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): Promise<WebhookHandlerResult> {
  try {
    const result = await processCheckoutSession(session.id);
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error
    };
  }
}
```

### Service Function (All Logic Here)
```typescript
// services/stripe/checkout-service.ts
export async function processCheckoutSession(sessionId: string) {
  // 1. Retrieve session from Stripe
  // 2. Find or create user association
  // 3. Update subscription in database
  // 4. Return standardized result
}
```

### tRPC Endpoint (Validation + Service Call)
```typescript
// routers/payment/subscribe.ts
export const subscribe = protectedProcedure
  .input(subscribeSchema)
  .mutation(async ({ ctx, input }) => {
    // Just call the service
    return await createSubscription(
      ctx.user,
      input.plan,
      input.period
    );
  });
```

## ✅ Benefits

1. **Clear Separation** - You always know where to look
2. **Easy Testing** - Mock services, test webhooks independently
3. **Type Safety** - Consistent return types across layers
4. **Maintainable** - Change logic in one place
5. **Scalable** - Add features without touching existing code

## 🚀 Adding New Features

### New Webhook Event?
1. Add handler in `webhooks/stripe/handlers/`
2. Create service function in `services/stripe/`
3. Add case to webhook router
4. Done!

### New Payment Feature?
1. Create service function in `services/stripe/`
2. Export from `index.ts`
3. Call from endpoint/webhook
4. Done!

This architecture ensures that Stripe integration remains clean, testable, and scalable as the application grows.