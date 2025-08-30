# Complete Payment User Flows Documentation (RevenueCat)

## Overview
This document details every payment flow in the INGRD app using RevenueCat for subscription management across iOS, Android, and Web platforms.

## 📱 New User Subscription Flows

### Mobile Flow (iOS/Android)
```
User Journey:
1. Free user → Settings → Subscription Section
2. Tap "Upgrade to Pro" → Shows plan selector
3. Select plan (Basic/Pro/Enterprise) & period (Monthly/Yearly)
4. Native payment sheet appears (Apple Pay/Google Pay)
5. Confirm payment → Success!

Technical Flow:
- Frontend: usePayments hook → purchaseSubscription()
- SDK: RevenueCat SDK handles native payment
- Backend: RevenueCat creates subscription with 14-day trial
- Returns: CustomerInfo with entitlements
- Payment: Card authorized but NOT charged (trial starts)
- Webhook: Updates user state to 'trialing'
```

### Web Flow
```
User Journey:
1. Free user → Settings → Subscription Section
2. Click "Upgrade to Pro" → Shows plan selector
3. Select plan & period
4. RevenueCat Web Billing opens in modal
5. Enter payment details → Subscribe
6. Returns to app with active subscription

Technical Flow:
- Frontend: usePayments hook → purchaseSubscription()
- SDK: RevenueCat Web SDK initiates checkout
- Payment: Handled by RevenueCat Web Billing (Stripe-powered)
- Webhook: Syncs subscription state
```

### When Are Users Charged?
- **New subscriptions**: After 14-day trial ends
- **NO immediate charge** for new users
- Card is authorized but not charged during signup
- RevenueCat handles all billing logic

## 💳 Existing Subscriber Flows

### Upgrading Plans (e.g., Basic → Pro)
```
User Journey:
1. Go to Settings → Subscription
2. Tap "Change Plan"
3. Select higher plan
4. Confirm upgrade
5. Immediate upgrade!

Billing (RevenueCat handles automatically):
- Charged immediately (prorated)
- Example: If 15 days left in month on Basic ($4.99/mo)
  - Credit: $2.50 (half month of Basic)
  - Charge: $5.00 (half month of Pro at $9.99/mo)
  - Net charge: $2.50 immediately
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
- RevenueCat handles all proration
```

#### Yearly → Monthly
```
Billing:
- Switches at year end
- NO refund for unused yearly time
- Continues yearly access until expiry
- RevenueCat manages the transition
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
- Status shows "Canceling" (willRenew: false)
- Automatic downgrade to free at expiry
- RevenueCat handles the grace period
```

### Resuming Cancelled Subscription
```
If Before Expiry:
1. Tap "Resume Subscription"
2. RevenueCat restores subscription
3. NO new charge
4. Original schedule continues

If After Expiry:
1. Must subscribe again as new user
2. Goes through full payment flow
3. New 14-day trial (if eligible)
```

## 🎯 Special Cases

### Trial Period Behavior
```
Duration: 14 days (configured in RevenueCat)
Access: Full plan features (via entitlements)
Status: Shows "trialing" 
Cancellation: Can cancel anytime, never charged
End of trial: Automatic charge, becomes 'active'
RevenueCat: Manages trial eligibility automatically
```

### Grace Period (Failed Payment)
```
What Happens:
1. Payment fails at renewal
2. RevenueCat enables grace period (3-7 days)
3. Status → 'isInGracePeriod: true'
4. Access → Maintains full access during grace
5. RevenueCat retries payment automatically

User Experience:
- Sees payment warning banner
- Can update payment method
- If grace period expires → subscription canceled
```

### Restore Purchases
```
Mobile Only Feature:
- User taps "Restore Purchases"
- RevenueCat checks App Store/Play Store
- Restores all valid subscriptions
- Updates entitlements immediately
```

### Family Sharing (iOS)
```
Supported: Yes (via RevenueCat)
Setup: Automatic with iOS Family Sharing
Access: Family members get entitlements
Management: Primary subscriber only
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
| Grace period recovery | When payment succeeds | Original amount |

### Current Pricing (RevenueCat Products)
```
Basic Plan:
- Monthly: $4.99/month
- Yearly: $49.99/year (save ~17%)

Pro Plan:
- Monthly: $9.99/month
- Yearly: $99.99/year (save ~17%)

Enterprise Plan:
- Monthly: $19.99/month
- Yearly: $199.99/year (save ~17%)
```

## 🔧 Technical Details

### RevenueCat Webhook Events Flow
```
New Subscription:
1. INITIAL_PURCHASE → Create/update user subscription
2. TRIAL_STARTED → Set trial status
3. TRIAL_CONVERTED → Activate paid subscription

Plan Change:
1. PRODUCT_CHANGE → Update user plan/entitlements

Cancellation:
1. CANCELLATION → Mark as canceling
2. EXPIRATION → Downgrade to free

Billing Issues:
1. BILLING_ISSUE → Enable grace period
2. RENEWAL (if recovered) → Restore active status
```

### State Management
```
Frontend State (usePayments hook):
- Real-time subscription data from RevenueCat SDK
- Auto-refreshes on app foreground
- Caches CustomerInfo locally
- Platform-aware (iOS/Android/Web)

Backend Sync:
- Webhooks → Primary update mechanism
- Database → Caches RevenueCat data
- User sync → On login and periodic refresh
- Source of truth → Always RevenueCat
```

### Entitlements System
```
Plan Mapping:
- free → No entitlements
- basic → 'basic' entitlement
- pro → 'pro' entitlement  
- enterprise → 'enterprise' entitlement

Feature Access:
- Check via: canAccessPlan(planType)
- Hierarchical: Enterprise > Pro > Basic > Free
- Real-time: Updates immediately on purchase
```

### Platform Differences
```
iOS:
- Payment: Apple In-App Purchase
- Management: App Store subscriptions
- Restore: Via App Store account

Android:
- Payment: Google Play Billing
- Management: Play Store subscriptions
- Restore: Via Google account

Web:
- Payment: RevenueCat Web Billing
- Management: Customer portal
- Restore: Not applicable (login-based)
```

## 🎨 UI/UX Details

### Status Indicators
- **Active**: Green badge, full access
- **Trialing**: Blue badge, shows days left
- **Grace Period**: Yellow warning, payment issue
- **Canceling**: Orange, shows end date
- **Free**: No badge, upgrade prompts

### Payment Methods
- **iOS**: Apple Pay, Credit/Debit cards
- **Android**: Google Pay, Credit/Debit cards
- **Web**: Credit/Debit cards via RevenueCat

### Customer Support
- **Billing Portal**: Web users via openBillingPortal()
- **Mobile Management**: Native OS subscription settings
- **Restore**: Mobile-only restore purchases button

## 🔐 Security & Compliance

### App Store Compliance
- Uses native IAP for iOS
- No external payment links
- Follows Apple's guidelines
- 30% commission handled by Apple

### Play Store Compliance
- Uses Google Play Billing
- Follows Google's policies
- Commission handled by Google

### Web Payments
- PCI compliance via RevenueCat/Stripe
- Secure checkout flow
- No card data stored locally

## 📊 Analytics Integration

### Events Tracked
```javascript
// Via trackPaywall in analytics
- viewPaywall(plan, period)
- paymentAttempt(plan, period, 'revenuecat')
- paymentSuccess(plan, period)
- paymentError(plan, error)
- paymentCanceled(plan)
- dismissPaywall(plan, reason)
- purchasesRestored()
```

### RevenueCat Dashboard
- Real-time metrics
- Cohort analysis
- Churn tracking
- Revenue reporting
- A/B testing support

This comprehensive flow leverages RevenueCat's powerful subscription infrastructure while maintaining a seamless user experience across all platforms.