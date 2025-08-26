# Complete Payment User Flows Documentation

## Overview
This document details every payment flow in the INGRD app, including charging logic, timing, and edge cases.

## 📱 New User Subscription Flows

### Mobile Flow
```
User Journey:
1. Free user → Settings → Subscription Section
2. Tap "Upgrade to Pro" → Shows plan selector
3. Select plan (Basic/Pro/Enterprise) & period (Monthly/Yearly)
4. Payment modal appears → Enter card details
5. Tap "Subscribe" → Native payment sheet appears
6. Confirm payment → Success!

Technical Flow:
- Frontend: PaymentForm → usePaymentConfirmation → subscribe()
- Backend: Creates Stripe subscription with 14-day trial
- Returns: clientSecret for payment confirmation
- Payment: Card authorized but NOT charged (trial starts)
- Webhook: Updates user state to 'trialing'
```

### Web Flow
```
Same as mobile except:
- Step 5: Inline card confirmation (no popup)
- Uses Stripe Elements instead of native UI
- Everything else identical
```

### When Are Users Charged?
- **New subscriptions**: After 14-day trial ends
- **NO immediate charge** for new users
- Card is authorized but not charged during signup

## 💳 Existing Subscriber Flows

### Upgrading Plans (e.g., Basic → Pro)
```
User Journey:
1. Go to Settings → Subscription
2. Tap "Change Plan"
3. Select higher plan
4. Confirm (no payment form needed)
5. Immediate upgrade!

Billing:
- Charged immediately (prorated)
- Example: If 15 days left in month on Basic ($10/mo)
  - Credit: $5 (half month of Basic)
  - Charge: $10 (half month of Pro at $20/mo)
  - Net charge: $5 immediately
```

### Downgrading Plans (e.g., Pro → Basic)
```
User Journey:
1. Same as upgrade flow
2. Sees "Downgrade will take effect at period end"
3. Confirms downgrade

Billing:
- NO immediate charge
- Keeps Pro until current period ends
- Automatically switches to Basic at renewal
- Next charge will be Basic price
```

### Switching Billing Period

#### Monthly → Yearly
```
Billing:
- Immediate switch
- Prorated credit for unused monthly time
- Charged full annual price
- Saves ~17% (2 months free)
```

#### Yearly → Monthly
```
Billing:
- Switches at year end
- NO refund for unused yearly time
- Continues yearly access until expiry
```

## 🚫 Cancellation Flows

### Standard Cancellation
```
User Journey:
1. Settings → Subscription → "Cancel Subscription"
2. Confirmation dialog appears
3. Confirms cancellation
4. Sees "Subscription ends on [date]"

What Happens:
- Access continues until period end
- Can still use all features
- Status shows "Canceling"
- Automatic downgrade to free at expiry
```

### Resuming Cancelled Subscription
```
If Before Expiry:
1. Tap "Resume Subscription"
2. Instantly reactivated
3. NO new charge
4. Original schedule continues

If After Expiry:
1. Must subscribe again as new user
2. Goes through full payment flow
3. New 14-day trial
```

## 🎯 Special Cases

### Trial Period Behavior
```
Duration: 14 days
Access: Full plan features
Status: Shows "trialing"
Cancellation: Can cancel anytime, never charged
End of trial: Automatic charge, becomes 'active'
```

### Past Due (Failed Payment)
```
What Happens:
1. Payment fails at renewal
2. Status → 'past_due'
3. Access → Downgraded to free immediately
4. Retry attempts by Stripe (3x over ~2 weeks)

User Experience:
- Sees payment warning banner
- Can update payment method via portal
- If all retries fail → subscription canceled
```

### Changing Plans During Trial
```
Allowed? Yes!
Effect: Immediate plan change
Trial: Continues on new plan
Charge: For new plan price at trial end
```

## 💰 Billing & Charge Summary

### When Charges Happen
| Scenario | When Charged | Amount |
|----------|--------------|---------|
| New subscription | After 14-day trial | Full price |
| Monthly renewal | Start of each month | Monthly price |
| Yearly renewal | Start of each year | Annual price |
| Upgrade plan | Immediately | Prorated difference |
| Downgrade plan | Next renewal | New (lower) price |
| Cancel | Never | N/A |
| Resume (before expiry) | No new charge | Continues original |
| Failed payment retry | When retry succeeds | Original amount |

### Proration Examples
```
Upgrade Mid-Month:
- Day 15 of 30-day month
- Basic ($10) → Pro ($20)
- Unused Basic: $5 credit
- Remaining Pro: $10 charge
- Immediate charge: $5

Downgrade Mid-Month:
- Day 15 of 30-day month  
- Pro ($20) → Basic ($10)
- No immediate charge/refund
- Continues Pro until day 30
- Next charge: $10 (Basic)
```

## 🔧 Technical Details

### Webhook Events Flow
```
New Subscription:
1. checkout.session.completed → Activate trial
2. customer.subscription.created → Sync state
3. invoice.payment_succeeded (after trial) → Confirm active

Plan Change:
1. customer.subscription.updated → Sync new plan
2. invoice.payment_succeeded (if upgrade) → Confirm charge

Cancellation:
1. customer.subscription.updated → Mark canceling
2. customer.subscription.deleted → Downgrade to free

Failed Payment:
1. invoice.payment_failed → Mark past_due
2. invoice.payment_succeeded (retry) → Restore active
3. customer.subscription.deleted (final) → Free plan
```

### State Management
```
Frontend State:
- payment-provider → Real-time subscription data
- Refetches every 5 min + on window focus
- Shows loading states during updates

Backend Sync:
- Webhooks → Primary update mechanism
- Database → Caches Stripe data
- Source of truth → Always Stripe
```

### Error Handling
```
Payment Failures:
- User sees alert with specific error
- Analytics tracks failure reason
- Webhook updates state to past_due

Network Errors:
- Frontend retries with exponential backoff
- Offline changes queued (mobile)
- Webhooks ensure eventual consistency
```

## 🎨 UI/UX Details

### Status Indicators
- **Active**: Green badge, full access
- **Trialing**: Blue badge, shows days left
- **Past Due**: Red warning banner
- **Canceling**: Orange, shows end date
- **Free**: No badge, upgrade prompts

### Payment Methods
- **Mobile**: Cards, Apple Pay, Google Pay
- **Web**: Cards only (via Stripe Elements)
- **Management**: Via Stripe Customer Portal

### Merchant Details
- **Name**: "INGRD" (shown on statements)
- **Descriptor**: "INGRD Subscription"
- **Support**: Via customer portal

This comprehensive flow ensures users always understand their subscription state, when they'll be charged, and what actions they can take.