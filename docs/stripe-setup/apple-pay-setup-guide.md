# 🍎 Apple Pay Setup Guide for INGRD

## Overview
This guide walks you through setting up Apple Pay for native payments in your iOS app. Apple Pay provides a seamless checkout experience with 2-3x higher conversion rates than manual card entry.

## Prerequisites

- [ ] Apple Developer Account (paid)
- [ ] Stripe Account (verified)
- [ ] Access to Stripe Dashboard
- [ ] Physical iOS device for testing (Apple Pay doesn't work in simulator)

## Step 1: Create Apple Merchant ID

1. **Go to Apple Developer Portal**
   - Navigate to: https://developer.apple.com/account
   - Sign in with your Apple ID

2. **Create Merchant Identifier**
   - Go to: Certificates, Identifiers & Profiles → Identifiers
   - Click the "+" button
   - Select "Merchant IDs" and click Continue
   - Enter:
     - **Description**: INGRD Payments
     - **Identifier**: merchant.com.ingrd (you already have this configured!)
   - Click Continue → Register

## Step 2: Generate Apple Pay Certificate in Stripe

1. **Access Stripe Dashboard**
   - Go to: https://dashboard.stripe.com
   - Navigate to: Settings → Payment methods → Apple Pay & Google Pay

2. **Add Apple Merchant ID**
   - Click "Add new domain" if needed
   - Enter your domain (e.g., ingrd.com)
   - Click "Add"

3. **Download Certificate Signing Request (CSR)**
   - Click on your merchant ID
   - Click "Download certificate signing request"
   - Save the `.certSigningRequest` file

## Step 3: Create Payment Processing Certificate

1. **Return to Apple Developer Portal**
   - Go to: Certificates, Identifiers & Profiles → Identifiers
   - Select your Merchant ID (merchant.com.ingrd)
   - Under "Merchant Certificates", click "Create Certificate"

2. **Create Payment Processing Certificate**
   - Select "Payment Processing Certificate"
   - Click Continue
   - Choose the CSR file you downloaded from Stripe
   - Click Continue → Download
   - Save the `.cer` certificate file

## Step 4: Upload Certificate to Stripe

1. **Back to Stripe Dashboard**
   - Return to: Settings → Payment methods → Apple Pay & Google Pay
   - Click on your merchant ID
   - Click "Upload certificate"
   - Select the `.cer` file from Apple
   - Click "Upload"

✅ **Success!** Apple Pay is now configured in Stripe!

## Step 5: Verify Domain (Web Payments Only)

If you plan to accept Apple Pay on web:

1. **Add Domain in Stripe**
   - In Apple Pay settings, add your website domain
   - Download the domain verification file
   - Upload to: `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`
   - Click "Verify"

## Step 6: Update Your App

Your app is already configured correctly! You have:

✅ **iOS Entitlements** (`app/ios/INGRD/INGRD.entitlements`):
```xml
<key>com.apple.developer.in-app-payments</key>
<array>
    <string>merchant.com.ingrd</string>
</array>
```

✅ **App Config** (`app/app.config.js`):
```javascript
"merchantIdentifier": "merchant.com.ingrd"
```

✅ **Environment Variable**:
```bash
EXPO_PUBLIC_STRIPE_MERCHANT_ID=merchant.com.ingrd
```

## Step 7: Testing Apple Pay

### Test Cards for Sandbox

Use these test cards in Stripe TEST mode:
- `4242 4242 4242 4242` - Visa (any CVC, any future date)
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - Amex

### Testing on Device

1. **Add Test Card to Wallet**
   - Open Wallet app on test device
   - Add a test card (use Stripe test cards)
   
2. **Enable Sandbox Testing**
   - Settings → Wallet & Apple Pay → Enable "Sandbox Testing"

3. **Run Your App**
   ```bash
   cd app
   npx expo run:ios --device
   ```

4. **Test Payment Flow**
   - Open your app
   - Go to subscription/payment screen
   - Apple Pay button should appear
   - Tap to initiate payment
   - Authenticate with Face ID/Touch ID

## Troubleshooting

### Apple Pay Button Not Showing

1. **Check Device Support**
   ```typescript
   // Add debug logging in useNativePayment.ts
   const checkSupport = async () => {
     const supported = await isPlatformPaySupported();
     console.log('Apple Pay supported:', supported);
     console.log('Platform:', Platform.OS);
     console.log('Device:', DeviceInfo.getModel());
   };
   ```

2. **Verify Merchant ID**
   - Ensure merchant ID matches everywhere:
     - Apple Developer Portal
     - Stripe Dashboard
     - App entitlements
     - Environment variables

3. **Check Stripe Initialization**
   ```typescript
   // In PaymentProvider
   console.log('Stripe config:', {
     publishableKey: config.stripe.publishableKey,
     merchantId: config.stripe.merchantId,
   });
   ```

### Payment Fails

1. **Check Console Logs**
   - Look for Stripe error codes
   - Common issues:
     - `merchant_id_mismatch`: Merchant IDs don't match
     - `invalid_certificate`: Certificate not properly uploaded
     - `domain_not_verified`: For web payments

2. **Verify Backend**
   - Ensure price IDs are correct in `.env`
   - Check webhook is receiving events
   - Verify customer creation succeeds

## Production Checklist

Before going live:

- [ ] Switch from Stripe TEST to LIVE keys
- [ ] Create production products/prices in Stripe
- [ ] Update production `.env` with live price IDs
- [ ] Test with real payment method
- [ ] Enable production Apple Pay entitlement
- [ ] Submit app for App Store review

## Best Practices

1. **Show Apple Pay Prominently**
   - Display as primary payment option
   - Use official Apple Pay button styling
   - Don't hide behind "More options"

2. **Handle Errors Gracefully**
   - Provide clear error messages
   - Offer alternative payment methods
   - Log errors for debugging

3. **Optimize for Conversion**
   - Minimize steps to payment
   - Show price clearly
   - Include trust badges

## Support Resources

- [Apple Pay on the Web](https://developer.apple.com/apple-pay/)
- [Stripe Apple Pay Docs](https://stripe.com/docs/apple-pay)
- [React Native Stripe SDK](https://github.com/stripe/stripe-react-native)

## Next Steps

1. ✅ Products and prices created in Stripe
2. ⏳ Complete Apple Pay certificate setup (follow steps above)
3. 🔄 Test payment flow on physical device
4. 🚀 Deploy to TestFlight for beta testing

---

**Need Help?** 
- Check Stripe Dashboard logs for detailed error messages
- Use Stripe's support chat for certificate issues
- Test in sandbox mode before going live
