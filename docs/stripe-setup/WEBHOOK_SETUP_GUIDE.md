# ⚡ Stripe Webhook Setup Guide

## 🚨 CRITICAL: Webhooks Must Be Configured!

Without webhooks, your app won't know when:
- Subscriptions are created/updated/cancelled
- Payments succeed or fail
- Users need to update their payment method
- Trial periods end

## 📍 Your Webhook Endpoint

Your app expects webhooks at:
```
Development: http://localhost:3001/webhook/stripe
Production: https://your-domain.com/webhook/stripe
```

## 🎯 Required Webhook Events

Your backend handles these 9 events:

### Subscription Events
✅ `customer.subscription.created` - New subscription starts
✅ `customer.subscription.updated` - Plan changes, renewals
✅ `customer.subscription.deleted` - Subscription cancelled

### Payment Events
✅ `invoice.payment_succeeded` - Payment went through
✅ `invoice.payment_failed` - Payment failed
✅ `invoice.payment_action_required` - Needs 3D Secure/authentication

### Checkout Events
✅ `checkout.session.completed` - Checkout flow finished

### Payment Intent Events (Optional)
✅ `payment_intent.succeeded` - One-time payment succeeded
✅ `payment_intent.payment_failed` - One-time payment failed

## 🛠️ Step-by-Step Setup

### Step 1: Go to Stripe Dashboard

1. Login to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to: **Developers → Webhooks**
3. Click **"Add endpoint"**

### Step 2: Configure Endpoint

Fill in these details:

**Endpoint URL:**
- Development: `http://localhost:3001/webhook/stripe`
- Production: `https://api.yourdomain.com/webhook/stripe`

> ⚠️ For local development, use [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.github.io/www/) to expose your local server

### Step 3: Select Events

Click **"Select events"** and add:

**Customer events:**
- [x] customer.subscription.created
- [x] customer.subscription.deleted
- [x] customer.subscription.updated

**Invoice events:**
- [x] invoice.payment_action_required
- [x] invoice.payment_failed
- [x] invoice.payment_succeeded

**Checkout events:**
- [x] checkout.session.completed

**Payment intent events:**
- [x] payment_intent.payment_failed
- [x] payment_intent.succeeded

### Step 4: Save and Get Signing Secret

1. Click **"Add endpoint"**
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add to your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🧪 Testing Webhooks Locally

### Option 1: Using Stripe CLI (Recommended)

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3001/webhook/stripe
```

4. In another terminal, trigger test events:
```bash
# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded
```

### Option 2: Using ngrok

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start your backend:
```bash
cd server
npm run dev
```

3. Expose your local server:
```bash
ngrok http 3001
```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Add webhook in Stripe Dashboard:
   - URL: `https://abc123.ngrok.io/webhook/stripe`
   - Select all required events
   - Save endpoint

## ✅ Verifying Webhook Setup

### 1. Check Webhook Logs

In Stripe Dashboard:
1. Go to **Developers → Webhooks**
2. Click on your endpoint
3. View **"Webhook attempts"**
4. Look for successful (200) responses

### 2. Check Server Logs

Your server should log webhook events:
```
[StripeWebhook] Processing webhook: customer.subscription.created
[StripeWebhook] Subscription created for user: 507f1f77bcf86cd799439011
```

### 3. Test a Real Payment

1. Create a test subscription in your app
2. Check Stripe Dashboard → Webhooks → Webhook attempts
3. Verify user subscription status updated in database

## 🔴 Common Issues & Solutions

### Issue: "No signature" error
**Solution:** Webhook endpoint is being called but missing Stripe signature header. Check that Stripe is sending to the correct URL.

### Issue: "Webhook signature verification failed"
**Solutions:**
1. Wrong webhook secret in `.env`
2. Body parser middleware interfering - make sure raw body is used:
```javascript
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handler);
```

### Issue: 404 Not Found
**Solution:** Wrong endpoint URL. Should be `/webhook/stripe` (singular, not `/webhooks/stripe`)

### Issue: Timeout errors
**Solution:** Your handler is taking too long. Stripe expects response within 20 seconds.

### Issue: No events received
**Solutions:**
1. Check endpoint URL is correct
2. Verify events are selected in Stripe Dashboard
3. Check firewall/security rules aren't blocking Stripe IPs

## 🏭 Production Checklist

Before going live:

- [ ] Use HTTPS endpoint (required for production)
- [ ] Add production webhook endpoint in Stripe Dashboard
- [ ] Copy production webhook secret to production `.env`
- [ ] Test with live mode test card
- [ ] Monitor webhook logs for first 24 hours
- [ ] Set up alerting for webhook failures

## 📊 Webhook Event Flow

```
1. User subscribes in app
   ↓
2. Stripe creates subscription
   ↓
3. Stripe sends webhook event
   ↓
4. Your server receives at /webhook/stripe
   ↓
5. Server verifies signature
   ↓
6. Server updates user in database
   ↓
7. User sees updated subscription
```

## 🔒 Security Best Practices

1. **Always verify webhook signatures** ✅ (Your code does this)
2. **Use HTTPS in production** (HTTP only for local dev)
3. **Respond quickly** (< 20 seconds)
4. **Idempotent handling** (handle duplicate events gracefully)
5. **Log everything** for debugging

## 📝 Quick Test Checklist

After setup, verify these work:

- [ ] Create subscription → `customer.subscription.created` received
- [ ] Cancel subscription → `customer.subscription.deleted` received  
- [ ] Payment succeeds → `invoice.payment_succeeded` received
- [ ] Card declined → `invoice.payment_failed` received

## 💻 Your Current Implementation

Your webhook handler (`server/webhooks/stripe/index.ts`) is well-structured:
- ✅ Signature verification
- ✅ Modular event handlers
- ✅ Proper error handling
- ✅ Comprehensive logging
- ✅ All critical events handled

## 🚀 Next Steps

1. **Now:** Add webhook endpoint to Stripe Dashboard
2. **Now:** Copy webhook secret to `.env`
3. **Test:** Use Stripe CLI to test locally
4. **Deploy:** Add production webhook when ready

---

**Need Help?**
- Check webhook attempts in Stripe Dashboard
- Review server logs for errors
- Test with Stripe CLI for immediate feedback

Your webhook implementation is solid - you just need to configure the endpoint in Stripe! 🎯
