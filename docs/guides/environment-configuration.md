# Environment Configuration Guide

## Overview

This guide covers all environment variables required to run INGRD in development and production. The project uses a monorepo structure with separate configurations for the React Native app and Node.js backend.

## Environment Files Structure

```
ingrd/
├── .env                    # Root environment variables (both frontend & backend)
├── .env.local             # Local overrides (gitignored)
├── .env.development       # Development environment
├── .env.production        # Production environment
└── .env.example           # Template with all required variables
```

## Frontend Environment Variables

All frontend environment variables **MUST** be prefixed with `EXPO_PUBLIC_` to be accessible in the React Native app.

### API Configuration

```bash
# API endpoint
# Development: http://localhost:3001
# Production: https://api.yourdomain.com
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Firebase Configuration

Get these values from [Firebase Console](https://console.firebase.google.com/) > Project Settings > Your apps > Web app

```bash
# Firebase Web App Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD_example_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### Stripe Configuration (Frontend)

```bash
# Stripe Publishable Key
# Get from: Stripe Dashboard > Developers > API keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Example...

# Stripe Merchant ID for Apple Pay
# Required for Apple Pay on iOS
# Format: merchant.com.yourdomain
EXPO_PUBLIC_STRIPE_MERCHANT_ID=merchant.com.ingrd
```

### Analytics Configuration

```bash
# PostHog API Key
# Get from: PostHog > Project Settings > API Keys
EXPO_PUBLIC_POSTHOG_API_KEY=phc_example_key

# PostHog Host
# Options:
# - US Cloud: https://us.i.posthog.com
# - EU Cloud: https://eu.i.posthog.com
# - Self-hosted: https://your-posthog-instance.com
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Backend Environment Variables

### Server Configuration

```bash
# Node environment
# Options: development, production, test
NODE_ENV=development

# Server port
# Default: 3001
PORT=3001
```

### Database Configuration

```bash
# MongoDB Connection String
# Local: mongodb://localhost:27017/database-name
# Atlas: mongodb+srv://username:password@cluster.mongodb.net/database-name
MONGODB_URI=mongodb://localhost:27017/ingrd-dev

# MongoDB Database Name (optional if included in URI)
MONGODB_DB_NAME=ingrd-dev
```

### Firebase Admin SDK

```bash
# Firebase Project ID
FIREBASE_PROJECT_ID=your-project-id

# Firebase Admin Credentials (choose one method):

# Option 1: Path to service account JSON file (recommended for development)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Option 2: Base64 encoded service account (recommended for production)
# Convert your service account JSON to base64:
# base64 -i serviceAccountKey.json -o serviceAccountKey.base64
FIREBASE_ADMIN_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIs...

# Option 3: Inline JSON (not recommended, hard to manage)
# FIREBASE_ADMIN_CREDENTIALS='{"type":"service_account",...}'
```

### Stripe Configuration (Backend)

```bash
# Stripe Secret Key
# Get from: Stripe Dashboard > Developers > API keys
STRIPE_SECRET_KEY=sk_test_51Example...

# Stripe Webhook Secret
# Get from: Stripe Dashboard > Developers > Webhooks > Your endpoint
STRIPE_WEBHOOK_SECRET=whsec_example_secret

# Stripe Price IDs
# Create products in: Stripe Dashboard > Products
# Then copy the price IDs for each plan/period combination
STRIPE_PRICE_BASIC_MONTHLY=price_1Example123
STRIPE_PRICE_BASIC_YEARLY=price_1Example456
STRIPE_PRICE_PRO_MONTHLY=price_1Example789
STRIPE_PRICE_PRO_YEARLY=price_1Example012
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1Example345
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1Example678

# Stripe Portal Configuration (optional)
STRIPE_PORTAL_RETURN_URL=https://app.yourdomain.com/settings
STRIPE_SUCCESS_URL=https://app.yourdomain.com/payment/success
STRIPE_CANCEL_URL=https://app.yourdomain.com/payment/cancel
```

### Optional Backend Variables

```bash
# Logging Level
# Options: error, warn, info, debug
LOG_LEVEL=info

# CORS Origins (comma-separated)
# Default: * (all origins in development)
CORS_ORIGINS=http://localhost:19006,http://localhost:8081

# Session Secret (for web sessions if implemented)
SESSION_SECRET=your-random-session-secret

# Rate Limiting (requests per minute)
RATE_LIMIT_MAX=100
```

## Setting Up Environment Variables

### 1. Development Setup

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Authentication > Sign-in method > Email/Password
4. (Optional) Enable Firestore or Realtime Database

#### Get Web App Configuration
1. Project Settings > Your apps > Add app > Web
2. Copy the configuration values to your `.env` file

#### Get Service Account Key
1. Project Settings > Service accounts
2. Generate new private key
3. Save as `serviceAccountKey.json` in root directory
4. Add to `.gitignore`

#### Convert Service Account to Environment Variable
```javascript
// convert-firebase-key.js
const fs = require('fs');
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json'));
const envValue = JSON.stringify(serviceAccount);
console.log(`FIREBASE_ADMIN_CREDENTIALS='${envValue}'`);
```

### 3. MongoDB Setup

#### Local MongoDB
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Connection string
MONGODB_URI=mongodb://localhost:27017/ingrd-dev
```

#### MongoDB Atlas (Cloud)
1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create cluster (free tier available)
3. Security > Database Access > Add database user
4. Security > Network Access > Add IP address (0.0.0.0/0 for development)
5. Databases > Connect > Get connection string

### 4. Stripe Setup

#### Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Use test mode for development

#### Get API Keys
1. Dashboard > Developers > API keys
2. Copy both publishable and secret keys

#### Create Products and Prices
1. Dashboard > Products > Add product
2. Create three products:
   - **Basic Plan**
     - Monthly: $9.99
     - Yearly: $99.99 (save ~17%)
   - **Pro Plan**
     - Monthly: $29.99
     - Yearly: $299.99 (save ~17%)
   - **Enterprise Plan**
     - Monthly: $99.99
     - Yearly: $999.99 (save ~17%)
3. Copy price IDs to environment variables

#### Setup Webhook
1. Dashboard > Developers > Webhooks
2. Add endpoint:
   - Development: `http://localhost:3001/webhooks/stripe`
   - Production: `https://api.yourdomain.com/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret

### 5. PostHog Setup (Optional)

1. Sign up at [posthog.com](https://posthog.com)
2. Create project
3. Project Settings > API Keys > Copy project API key

## Environment-Specific Configurations

### Development
```bash
# .env.development
NODE_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/ingrd-dev
# Use test Stripe keys
STRIPE_SECRET_KEY=sk_test_...
```

### Staging
```bash
# .env.staging
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://api-staging.yourdomain.com
MONGODB_URI=mongodb+srv://...staging-cluster...
# Still use test Stripe keys
STRIPE_SECRET_KEY=sk_test_...
```

### Production
```bash
# .env.production
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
MONGODB_URI=mongodb+srv://...production-cluster...
# Use live Stripe keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Security Best Practices

### Do's ✅
- Use `.env.local` for sensitive overrides
- Store production secrets in secure services (AWS Secrets Manager, etc.)
- Rotate keys regularly
- Use different Firebase projects for dev/staging/prod
- Use Stripe test mode for non-production environments
- Use strong, unique passwords for database users
- Limit database user permissions to minimum required

### Don'ts ❌
- Never commit `.env` files with real values
- Don't use production keys in development
- Don't expose backend variables to frontend
- Don't store credentials in code
- Don't share service account keys via email/chat
- Don't use the same database for dev and production

## Validating Configuration

### Backend Validation Script

Create `server/validate-env.js`:
```javascript
const required = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

// Validate Firebase credentials
try {
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  }
} catch (error) {
  console.error('❌ Invalid FIREBASE_ADMIN_CREDENTIALS JSON');
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

### Frontend Validation

In `app/config/index.ts`:
```typescript
const requiredVars = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

requiredVars.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

## Troubleshooting

### Common Issues

#### "Missing Firebase credentials"
- Ensure service account key path is correct
- Check file permissions (should be readable)
- Verify JSON is valid with `jq . serviceAccountKey.json`

#### "Cannot connect to MongoDB"
- Check MongoDB is running: `brew services list`
- Verify connection string format
- For Atlas, check IP whitelist and user credentials
- Test connection: `mongosh "$MONGODB_URI"`

#### "Stripe webhook signature verification failed"
- Ensure webhook secret matches dashboard
- Check you're using raw body (not parsed JSON)
- Verify endpoint URL is exactly correct
- Check for trailing slashes in URLs

#### "EXPO_PUBLIC_ variables not working"
- Clear Expo cache: `expo start -c`
- Restart Metro bundler
- Check variable naming (must start with EXPO_PUBLIC_)
- Ensure `.env` is in root directory

### Debug Commands

```bash
# Check environment variables
printenv | grep EXPO
printenv | grep STRIPE

# Test MongoDB connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# Test Firebase auth
node -e "const admin = require('firebase-admin'); admin.initializeApp(); console.log('Firebase OK');"

# Test Stripe connection
curl https://api.stripe.com/v1/charges \
  -u "$STRIPE_SECRET_KEY:" \
  -d amount=100 \
  -d currency=usd \
  -d source=tok_visa

# Check port availability
lsof -i :3001
```

## Production Deployment

### Using Environment Variables in Production

#### Vercel
```bash
vercel env add STRIPE_SECRET_KEY production
vercel env add MONGODB_URI production
# ... add all variables
```

#### Heroku
```bash
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set MONGODB_URI=mongodb+srv://...
# ... set all variables
```

#### AWS ECS/Fargate
Use AWS Systems Manager Parameter Store or Secrets Manager

#### Docker
```dockerfile
# Use build args for build-time variables
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Use runtime environment for secrets
# Pass via docker run -e or docker-compose.yml
```

### EAS Build (Expo)
```bash
# Set secrets in EAS
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://api.yourdomain.com"
eas secret:create --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_..."
# ... repeat for all EXPO_PUBLIC_ variables

# Reference in eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "@EXPO_PUBLIC_API_URL",
        "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"
      }
    }
  }
}
```

## Environment Variable Checklist

### Required for Development
- [ ] `NODE_ENV=development`
- [ ] `PORT=3001`
- [ ] `MONGODB_URI` (local or Atlas)
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_PATH`
- [ ] `EXPO_PUBLIC_API_URL`
- [ ] `EXPO_PUBLIC_FIREBASE_*` (6 variables)
- [ ] `STRIPE_SECRET_KEY` (test key)
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test key)

### Required for Production
- [ ] All development variables
- [ ] `NODE_ENV=production`
- [ ] Production MongoDB URI
- [ ] Production API URL
- [ ] Live Stripe keys
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] All Stripe price IDs
- [ ] `EXPO_PUBLIC_STRIPE_MERCHANT_ID` (for Apple Pay)

### Optional but Recommended
- [ ] `EXPO_PUBLIC_POSTHOG_API_KEY`
- [ ] `EXPO_PUBLIC_POSTHOG_HOST`
- [ ] `LOG_LEVEL`
- [ ] `CORS_ORIGINS`
- [ ] Portal/redirect URLs

## Next Steps

1. Copy `.env.example` to `.env`
2. Fill in all required values
3. Run validation script: `node server/validate-env.js`
4. Test each service connection
5. Set up environment-specific files if needed
6. Configure CI/CD with secure variable storage

For deployment instructions, see [Deployment Guide](./deployment.md).