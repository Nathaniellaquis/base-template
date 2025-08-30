# RevenueCat Environment Variables Setup

## Your Current Keys (from Dashboard)

Add these to your `.env` file in the root directory:

```env
# RevenueCat Configuration
# iOS Key (YOU HAVE THIS)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_oyRDzbjwPNurhKhkzersUxZEPoy

# Android Key (CREATE IN DASHBOARD - See instructions below)
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_PENDING_CREATE_IN_DASHBOARD

# Web Key (CREATE IN DASHBOARD - See instructions below)  
EXPO_PUBLIC_REVENUECAT_WEB_KEY=rcwb_PENDING_CREATE_IN_DASHBOARD

# Secret Key (YOU HAVE THIS - Backend Only!)
REVENUECAT_SECRET_KEY=sk_WcntvDAwZUdTCUAgohPWHzZWAujWX

# Webhook Secret (OPTIONAL - Create webhook first)
# REVENUECAT_WEBHOOK_SECRET=whsec_WILL_GET_AFTER_WEBHOOK_SETUP
```

## To Get Missing Keys:

### Android Key:
1. RevenueCat Dashboard → Project Settings → Apps
2. Click "+ New" → Select "Google Play Store"
3. Package name: `com.ingrd.app`
4. Copy the `goog_xxx` key

### Web Key:
1. RevenueCat Dashboard → Project Settings → Apps
2. Click "+ New" → Select "RevenueCat Billing (Web)"
3. Name: `ingrd-web`
4. Copy the `rcwb_xxx` key

### Webhook Secret (Optional but Recommended):
1. RevenueCat Dashboard → Project Settings → Integrations → Webhooks
2. Click "Add Webhook"
3. URL: `https://your-backend-url.com/webhooks/revenuecat`
4. Copy the signing secret `whsec_xxx`

## For Testing Right Now:

You can start testing with just iOS! The Android and Web keys can be added later.

```env
# Minimum to start testing on iOS
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_oyRDzbjwPNurhKhkzersUxZEPoy
REVENUECAT_SECRET_KEY=sk_WcntvDAwZUdTCUAgohPWHzZWAujWX
```
