# Deployment Guide

## Overview

This guide covers deploying INGRD to production using Expo Application Services (EAS) for the mobile app and various cloud providers for the backend. The app uses a monorepo structure requiring separate deployment processes for frontend and backend.

## Prerequisites

### Required Accounts
- [Expo Account](https://expo.dev/) - For EAS Build & Submit
- Apple Developer Account ($99/year) - For iOS deployment
- Google Play Console Account ($25 one-time) - For Android deployment
- Cloud hosting account (Vercel, Railway, AWS, etc.) - For backend
- Production MongoDB (Atlas recommended)
- Production Firebase project
- Production Stripe account

### Required Tools
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Verify installation
eas --version
```

## Backend Deployment

### 1. Prepare Production Environment

Create production environment file:
```bash
# server/.env.production
NODE_ENV=production
PORT=3001

# Production MongoDB
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/ingrd-prod

# Production Firebase
FIREBASE_PROJECT_ID=ingrd-production
FIREBASE_ADMIN_CREDENTIALS_BASE64=<base64-encoded-service-account>

# Production Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_PRICE_BASIC_MONTHLY=price_live_basic_monthly
# ... other live price IDs

# Optional production settings
LOG_LEVEL=error
CORS_ORIGINS=https://app.ingrd.com,https://ingrd.com
```

### 2. Backend Deployment Options

#### Option A: Vercel (Recommended for Serverless)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Create `vercel.json` in server directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. Deploy:
```bash
cd server
vercel --prod

# Set environment variables
vercel env add MONGODB_URI production
vercel env add STRIPE_SECRET_KEY production
# ... add all production variables
```

#### Option B: Railway (Recommended for Containers)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Create `railway.json`:
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "restartPolicyType": "always"
  }
}
```

3. Deploy:
```bash
cd server
railway login
railway link
railway up
```

#### Option C: AWS ECS/Fargate

1. Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../types ./types

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/index.js"]
```

2. Build and push to ECR:
```bash
# Build image
docker build -t ingrd-backend .

# Tag for ECR
docker tag ingrd-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/ingrd-backend:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ingrd-backend:latest
```

3. Deploy using ECS task definition with environment variables

### 3. Configure Stripe Webhooks

After deployment, set up production webhook:
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://api.yourdomain.com/webhooks/stripe`
3. Select events (same as development)
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET` env var
5. Redeploy with updated secret

### 4. Verify Backend Deployment

```bash
# Check health endpoint
curl https://api.yourdomain.com/health

# Test tRPC endpoint
curl https://api.yourdomain.com/trpc/health

# Check logs for any errors
```

## Frontend Deployment (EAS Build)

### 1. Configure EAS

Initialize EAS in your app directory:
```bash
cd app
eas build:configure
```

This creates `eas.json`. Update it for production:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.yourdomain.com"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "autoIncrement": true
      },
      "android": {
        "autoIncrement": true
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com",
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "TEAM123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 2. Set EAS Secrets

Store sensitive environment variables in EAS:

```bash
# Set production secrets
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSy..."
eas secret:create --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_..."
eas secret:create --name EXPO_PUBLIC_POSTHOG_API_KEY --value "phc_..."

# List all secrets
eas secret:list
```

Update `eas.json` to use secrets:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com",
        "EXPO_PUBLIC_FIREBASE_API_KEY": "@EXPO_PUBLIC_FIREBASE_API_KEY",
        "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"
      }
    }
  }
}
```

### 3. Configure App Credentials

#### iOS Setup

1. Create App ID in Apple Developer Portal
2. Configure capabilities:
   - Push Notifications
   - Sign In with Apple (if using)
   - Apple Pay (if using)

```bash
# Let EAS handle credentials
eas credentials

# Or manually configure
eas build --platform ios --profile production
```

#### Android Setup

1. Create app in Google Play Console
2. Generate upload key:

```bash
# Let EAS manage
eas credentials --platform android

# Or create manually
keytool -genkey -v -keystore upload-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

### 4. Update App Configuration

Update `app.json` for production:

```json
{
  "expo": {
    "name": "INGRD",
    "slug": "ingrd",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "ingrd",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.ingrd.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera for profile photos.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photos for profile pictures."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.ingrd.app",
      "versionCode": 1,
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-router",
      "@stripe/stripe-react-native",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "mode": "production"
        }
      ],
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ]
  }
}
```

### 5. Build for Production

#### iOS Build
```bash
# Production build
eas build --platform ios --profile production

# With specific version
eas build --platform ios --profile production --message "v1.0.0 release"
```

#### Android Build
```bash
# Production AAB (for Play Store)
eas build --platform android --profile production

# APK for testing
eas build --platform android --profile preview
```

#### Both Platforms
```bash
eas build --platform all --profile production
```

### 6. Submit to App Stores

#### iOS App Store
```bash
# Submit to TestFlight/App Store
eas submit --platform ios --latest

# Or with specific build
eas submit --platform ios --id=<build-id>
```

#### Google Play Store
```bash
# Submit to Play Store
eas submit --platform android --latest

# Submit to specific track
eas submit --platform android --track=internal
```

## Production Checklist

### Pre-Deployment
- [ ] All environment variables set correctly
- [ ] Production Firebase project configured
- [ ] Production MongoDB database created
- [ ] Stripe live mode activated and configured
- [ ] SSL certificates configured
- [ ] Domain names pointed to servers
- [ ] Error tracking configured (Sentry/etc)
- [ ] Analytics configured (PostHog)

### Security
- [ ] All secrets stored securely (not in code)
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Authentication properly configured
- [ ] Database user has minimal permissions
- [ ] Webhook endpoints validate signatures
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention

### Performance
- [ ] Database indexes created
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] API response caching where appropriate
- [ ] Database connection pooling

### Monitoring
- [ ] Health checks configured
- [ ] Logging aggregation setup
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Database monitoring
- [ ] Cost alerts configured

### Testing
- [ ] All tests passing
- [ ] End-to-end tests on staging
- [ ] Payment flow tested with real cards
- [ ] Push notifications tested
- [ ] Deep linking tested
- [ ] App store screenshots prepared
- [ ] Privacy policy and terms updated

## Post-Deployment

### 1. Verify Production

```bash
# Check API health
curl https://api.yourdomain.com/health

# Test authentication flow
curl -X POST https://api.yourdomain.com/trpc/user.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>"

# Monitor logs
# Vercel: vercel logs
# Railway: railway logs
# AWS: aws logs tail
```

### 2. Monitor Initial Launch

- Watch error tracking dashboard
- Monitor server resources
- Check payment webhook deliveries
- Review user signup flow
- Test push notifications

### 3. Setup Automated Deployments

#### GitHub Actions for Backend
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'server/**'
      - 'types/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

#### EAS Build Automation
```yaml
name: Build App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile production --non-interactive
```

## Rollback Procedures

### Backend Rollback
```bash
# Vercel
vercel rollback

# Railway
railway down
git checkout <previous-version>
railway up

# AWS ECS
aws ecs update-service --service ingrd-backend --task-definition ingrd-backend:previous
```

### App Rollback
- Cannot rollback app store releases
- Use phased rollouts to minimize impact
- Have hotfix process ready
- Consider CodePush for critical fixes

## Troubleshooting

### Common Issues

#### "API Connection Failed"
- Verify `EXPO_PUBLIC_API_URL` is correct
- Check CORS configuration
- Ensure SSL certificates are valid
- Test with curl from device network

#### "Build Failed on EAS"
- Check build logs: `eas build:view`
- Verify all plugins are compatible
- Clear cache: `eas build --clear-cache`
- Check native dependencies

#### "Stripe Webhooks Failing"
- Verify webhook secret matches
- Check endpoint URL (no trailing slash)
- Ensure raw body parsing
- Check Stripe dashboard for errors

#### "Push Notifications Not Working"
- Verify FCM/APNs credentials
- Check notification permissions
- Test with Expo push tool
- Review device token registration

### Debug Commands

```bash
# Check EAS build status
eas build:list --status=in-progress

# View build logs
eas build:view <build-id>

# Test push notifications
expo push:android:upload --api-key <fcm-key>
expo push:ios:upload --api-key <apns-key>

# Verify app config
expo config --type public

# Check production logs
eas logs --platform=ios --profile=production
```

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Rotate API keys quarterly
- Review error logs weekly
- Monitor performance metrics
- Update SSL certificates before expiry
- Clean up old builds on EAS
- Archive old database backups

### Version Management
```bash
# Increment version before release
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.1 -> 1.1.0
npm version major  # 1.1.0 -> 2.0.0

# Tag release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

## Cost Optimization

### EAS Build
- Use larger resource classes only when needed
- Clean up old builds regularly
- Use development builds for testing

### Backend
- Enable auto-scaling with limits
- Use caching effectively
- Optimize database queries
- Clean up old logs
- Monitor API usage

### MongoDB Atlas
- Right-size cluster for load
- Enable auto-pause for dev/staging
- Use proper indexes
- Archive old data

## Next Steps

1. Complete pre-deployment checklist
2. Deploy backend to chosen provider
3. Configure production environment
4. Build apps with EAS
5. Submit to app stores
6. Monitor initial launch
7. Set up automated deployments

For more details on specific topics:
- [Environment Configuration](./environment-configuration.md)
- [API Reference](./api-reference.md)
- [Authentication Guide](./authentication.md)