# Platform-Optimized Analytics Implementation Guide

## Overview

This guide explains the platform-optimized analytics implementation that provides tailored tracking for web and native platforms while maintaining a unified API.

## Architecture

### File Structure

```
providers/analytics/
├── index.tsx                       # Proxy file for platform resolution
├── analytics-provider.web.tsx      # Web-specific implementation
├── analytics-provider.native.tsx   # Native (iOS/Android) implementation
└── types.ts                        # Shared TypeScript types

lib/analytics/
├── events.ts                       # Event name constants
├── tracking.ts                     # Tracking utilities
├── paywall-tracking.ts            # Paywall-specific tracking
└── experiments.ts                  # A/B testing utilities
```

### Platform Resolution

Metro bundler automatically selects the correct implementation based on the platform:
- Web: Uses `.web.tsx` files
- iOS/Android: Uses `.native.tsx` files

## Platform-Specific Features

### Web Analytics Features

```typescript
// Web-specific configuration
- capture_pageview: true              // Automatic page view tracking
- capture_pageleave: true            // Track when users leave
- cross_subdomain_cookie: true       // Track across subdomains
- persistence: 'localStorage+cookie'  // Dual persistence
- session_recording: enabled         // Record user sessions
- capture_performance: true          // Web vitals tracking
```

**Web-Specific Methods:**
- `trackClick()` - Track button/link clicks
- `trackFormSubmit()` - Track form submissions
- `startSessionRecording()` - Start recording session
- `stopSessionRecording()` - Stop recording session

**Web Context Data:**
- Browser name and version
- Screen resolution
- Viewport size
- Connection speed
- Referrer URL
- Timezone

### Native Analytics Features

```typescript
// Native-specific configuration
- captureApplicationLifecycleEvents: true  // App state changes
- captureDeepLinks: true                  // Deep link tracking
- captureScreens: true                    // Screen navigation
- captureInAppPurchases: true            // Purchase tracking
- flushAt: 20                            // Batch for battery
- flushInterval: 30000                   // Flush every 30s
```

**Native-Specific Methods:**
- `trackGesture()` - Track swipes, taps, etc.
- `trackDeepLink()` - Track deep link opens
- `trackPushNotification()` - Track push interactions
- `trackInAppPurchase()` - Track purchases

**Native Context Data:**
- Device model and brand
- OS version
- App version and build number
- Battery level and state
- Network type and connectivity
- Screen dimensions
- Orientation changes

## Usage Examples

### Basic Usage (Works on All Platforms)

```typescript
import { useAnalytics } from '@/providers/analytics';

function MyComponent() {
  const analytics = useAnalytics();
  
  // Track an event
  analytics.track('button_clicked', {
    button_name: 'subscribe',
    location: 'paywall'
  });
  
  // Track screen view
  analytics.trackScreen('Profile', {
    user_id: userId
  });
  
  // Identify user
  analytics.identify(userId, {
    email: userEmail,
    plan: 'pro'
  });
}
```

### Platform-Specific Usage

```typescript
import { Platform } from 'react-native';
import { useAnalytics } from '@/providers/analytics';

function PaywallScreen() {
  const analytics = useAnalytics();
  
  const handleInteraction = () => {
    if (Platform.OS === 'web') {
      // Web-specific tracking
      analytics.trackClick?.('plan_card', {
        plan: 'pro',
        position: 2
      });
    } else {
      // Native-specific tracking
      analytics.trackGesture?.('swipe', {
        direction: 'left',
        screen: 'paywall'
      });
    }
  };
}
```

### Paywall Tracking

```typescript
import { paywallTracker } from '@/lib/analytics/paywall-tracking';

// Track paywall view
paywallTracker.trackPaywallView(
  3,                    // Step number
  'onboarding',        // Entry point
  'new'                // User status
);

// Track plan selection
paywallTracker.trackPlanSelected(
  'pro',               // Selected plan
  'free',              // Previous plan
  'yearly'             // Billing period
);

// Track conversion
paywallTracker.trackSubscriptionStarted(
  'pro',               // Plan
  'yearly',            // Period
  99,                  // Price
  'USD',               // Currency
  'apple_pay',         // Payment method
  'variant_a'          // Experiment variant
);
```

## Implementation Checklist

### Initial Setup
- [x] Install PostHog SDK for both web and native
- [x] Create platform-specific provider implementations
- [x] Set up environment variables for API keys
- [x] Configure platform-specific features

### Core Tracking
- [x] User identification and properties
- [x] Screen/page view tracking
- [x] Event tracking with platform context
- [x] Session management

### Paywall Optimization
- [x] Comprehensive paywall event tracking
- [x] Conversion funnel tracking
- [x] A/B testing support
- [x] Revenue tracking

### Platform Optimizations
- [x] Web: Session recording for paid users
- [x] Web: Performance metrics and web vitals
- [x] Native: App lifecycle tracking
- [x] Native: Battery-optimized batching
- [x] Native: Orientation and gesture tracking

## Performance Considerations

### Web
- Autocapture limited to essential events
- Session recording only for paid users
- Lazy loading of analytics script
- Cookie + localStorage for persistence

### Native
- Event batching (20 events or 30 seconds)
- Respect battery state
- No location tracking (privacy)
- Minimal impact on app size

## Privacy & Compliance

### Data Collection
- No PII without consent
- Respect Do Not Track
- GDPR compliant
- User opt-out support

### Platform-Specific Privacy
- Web: Secure cookies, respect DNT header
- Native: No IDFA/AAID tracking by default
- Both: Masked sensitive inputs in recordings

## Testing

### Web Testing
```bash
# Test in browser
npm run web

# Check console for analytics events
# Verify session recording works
# Check network tab for batch requests
```

### Native Testing
```bash
# iOS
npm run ios

# Android  
npm run android

# Monitor console for analytics initialization
# Test app state changes trigger events
# Verify deep links are tracked
```

## Debugging

### Enable Debug Mode

```typescript
// Web
if (process.env.NODE_ENV === 'development') {
  posthog.debug();
}

// Native
posthog.setLogLevel('debug');
```

### Common Issues

1. **Events not tracking**
   - Check initialization in console
   - Verify API key is correct
   - Check network connectivity

2. **Platform-specific method undefined**
   - These are optional methods
   - Check with optional chaining: `analytics.trackClick?.()`

3. **Session recording not working (web)**
   - Only enabled for paid users
   - Check browser compatibility
   - Verify CSP headers allow PostHog

## Migration from Old Analytics

If migrating from the previous single-platform implementation:

1. Update imports:
```typescript
// Old
import { AnalyticsProvider } from '@/providers/analytics/index.tsx';

// New (automatic platform resolution)
import { AnalyticsProvider } from '@/providers/analytics';
```

2. Update event tracking:
```typescript
// Old
posthog.capture('event_name', props);

// New
analytics.track('event_name', props);
```

3. Use enhanced paywall tracking:
```typescript
// Old
trackPaywall.viewPaywall(step);

// New (with more context)
paywallTracker.trackPaywallView(step, 'onboarding', 'new');
```

## Next Steps

1. Set up dashboards in PostHog for each platform
2. Create platform-specific conversion funnels
3. Implement A/B tests using feature flags
4. Set up alerts for key metrics
5. Review and optimize based on data

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [React Native PostHog SDK](https://posthog.com/docs/libraries/react-native)
- [PostHog Web SDK](https://posthog.com/docs/libraries/js)
- [Platform-Specific Code in React Native](https://reactnative.dev/docs/platform-specific-code)