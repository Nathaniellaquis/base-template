# PostHog Experiments Implementation Guide

## Overview

This guide documents the implementation of PostHog experiments and A/B testing infrastructure in the application, following the proposal in `/docs/proposals/posthog-experiments-implementation.md`.

## Implementation Status ✅

### Completed Components

1. **useExperiment Hook** (`/app/hooks/useExperiment.ts`)
   - Single and multi-variant experiment support
   - Automatic exposure tracking
   - Feature rollout capabilities
   - Kill switch functionality
   - Test mode for QA

2. **Analytics Provider Updates**
   - Web implementation: `/app/providers/analytics/analytics-provider.web.tsx`
   - Native implementation: `/app/providers/analytics/analytics-provider.native.tsx`
   - Added experiment methods to context types
   - Feature flag support integrated

3. **Paywall Experiments** (`/app/app/(onboarding)/plan-selection/index.tsx`)
   - Pricing structure test (control, with_basic, no_free)
   - Urgency messaging variants
   - Social proof experiments
   - Experiment tracking in conversion events

4. **Experiment Utilities** (`/app/lib/experiments/`)
   - Metrics tracking functions
   - Sample size calculator
   - Statistical significance testing
   - Mutual exclusion groups

5. **Feature Rollout System** (`/app/lib/experiments/rollout.ts`)
   - Progressive rollout manager
   - Multiple rollout strategies (gradual, canary, blue-green, ring)
   - Kill switch functionality
   - User overrides for testing

## Usage Examples

### Basic Experiment

```typescript
import { useExperiment } from '@/hooks/useExperiment';

function MyComponent() {
  const { variant, isLoading } = useExperiment('my_experiment');
  
  if (isLoading) return <LoadingSpinner />;
  
  if (variant === 'test') {
    return <NewFeature />;
  }
  
  return <ExistingFeature />;
}
```

### Multi-Variant Experiment

```typescript
import { useMultivariantExperiment } from '@/hooks/useExperiment';

function PaywallComponent() {
  const urgencyTest = useMultivariantExperiment('paywall_urgency', [
    'control', 'limited_time', 'limited_spots', 'price_increase'
  ]);
  
  switch(urgencyTest.variant) {
    case 'limited_time':
      return <Text>🔥 48 hours left!</Text>;
    case 'limited_spots':
      return <Text>⚡ Only 10 spots remaining</Text>;
    case 'price_increase':
      return <Text>📈 Prices increasing soon</Text>;
    default:
      return null;
  }
}
```

### Feature Rollout

```typescript
import { useFeatureRollout } from '@/hooks/useExperiment';

function FeatureGate() {
  const { isEnabled, isLoading } = useFeatureRollout('new_feature');
  
  if (!isEnabled || isLoading) {
    return <OldImplementation />;
  }
  
  return <NewImplementation />;
}
```

### Kill Switch

```typescript
import { useKillSwitch } from '@/hooks/useExperiment';

function RiskyFeature() {
  const { killed, enabled } = useKillSwitch('risky_feature');
  
  if (killed || !enabled) {
    return <FallbackComponent />;
  }
  
  return <RiskyFeatureComponent />;
}
```

## Experiment Configuration

### Creating Experiments in PostHog

1. Navigate to PostHog Dashboard > Experiments
2. Click "New Experiment"
3. Configure:
   - **Key**: Use consistent naming (e.g., `paywall_pricing_structure`)
   - **Variants**: Define control and test variants
   - **Rollout**: Set percentage of users
   - **Targeting**: Configure user segments
   - **Metrics**: Select success metrics

### Example Experiment Configurations

#### Pricing Structure Test
```javascript
{
  key: "paywall_pricing_structure",
  variants: [
    { key: "control", weight: 33.33 },
    { key: "with_basic", weight: 33.33 },
    { key: "no_free", weight: 33.34 }
  ],
  metrics: ["subscription_started", "revenue_per_user"]
}
```

#### Urgency Messaging
```javascript
{
  key: "paywall_urgency",
  variants: [
    { key: "control", weight: 25 },
    { key: "limited_time", weight: 25 },
    { key: "limited_spots", weight: 25 },
    { key: "price_increase", weight: 25 }
  ]
}
```

## Metrics Tracking

### Automatic Tracking

The implementation automatically tracks:
- Experiment exposure when variant is loaded
- Conversion events with experiment context
- User properties for segmentation

### Manual Tracking

```typescript
import { experimentMetrics } from '@/lib/experiments';

// Track custom conversion
experimentMetrics.trackConversion(
  'paywall_pricing_structure',
  'with_basic',
  'subscription_started',
  29.99
);

// Track custom metric
experimentMetrics.trackMetric(
  'paywall_urgency',
  'time_on_screen',
  45.2,
  { dismissed: false }
);
```

## Statistical Analysis

### Sample Size Calculation

```typescript
import { calculateSampleSize } from '@/lib/experiments';

const sampleSize = calculateSampleSize(
  0.02,  // 2% baseline conversion rate
  0.005, // 0.5% minimum detectable effect
  0.95,  // 95% confidence level
  0.8    // 80% power
);
// Returns: ~15,000 users per variant
```

### Significance Testing

```typescript
import { isStatisticallySignificant } from '@/lib/experiments';

const isSignificant = isStatisticallySignificant(
  200,   // control conversions
  10000, // control total
  250,   // variant conversions
  10000, // variant total
  0.95   // confidence level
);
```

## Platform Differences

### Web
- Uses localStorage for flag override storage
- Tracks page views automatically
- Session recording for paid users
- Browser and OS detection

### Native (iOS/Android)
- App lifecycle tracking
- Orientation change tracking
- Push notification experiment support
- In-app purchase tracking

## Testing & QA

### Force Variants for Testing

```typescript
import { useTestMode } from '@/hooks/useExperiment';

function TestComponent() {
  const { isTestMode, forceVariant } = useTestMode();
  
  useEffect(() => {
    if (isTestMode) {
      forceVariant('paywall_pricing_structure', 'with_basic');
    }
  }, []);
}
```

### URL Parameters (Web)
```
https://app.example.com/?variant=with_basic
```

### Environment Variable
```bash
EXPO_PUBLIC_TEST_MODE=true npm start
```

## Best Practices

### 1. Naming Convention
```typescript
// Format: [area]_[element]_[test_type]
'paywall_pricing_structure'
'onboarding_welcome_copy'
'home_cta_button_color'
```

### 2. Mutual Exclusion
```typescript
// Prevent conflicting experiments
const MUTUAL_EXCLUSION_GROUPS = [
  ['paywall_pricing_v1', 'paywall_pricing_v2'],
  ['onboarding_flow_a', 'onboarding_flow_b']
];
```

### 3. Experiment Duration
- Minimum: 1 week (capture weekly patterns)
- Recommended: 2 weeks
- Maximum: 4 weeks (avoid drift)

### 4. Progressive Rollout
```typescript
Week 1: 10% of users
Week 2: 25% of users
Week 3: 50% of users
Week 4: 100% rollout
```

## Monitoring & Alerts

### Key Metrics to Monitor
- Experiment exposure rate
- Conversion rates by variant
- Sample ratio mismatch
- Error rates by variant

### Alert Thresholds
- Sample ratio mismatch > 5%
- Error rate increase > 10%
- Conversion drop > 20%

## Rollback Procedures

### Kill Switch Activation
```typescript
import { rolloutManager } from '@/lib/experiments/rollout';

// Emergency disable
rolloutManager.killSwitch('problematic_feature');
```

### Gradual Rollback
```typescript
// Reduce traffic progressively
rolloutManager.decreaseRollout('feature_key', 50); // 50%
rolloutManager.decreaseRollout('feature_key', 10); // 10%
rolloutManager.killSwitch('feature_key');           // 0%
```

## Cost Optimization

PostHog experiments are included in your existing plan:
- First 1M events/month: FREE
- No additional cost for experiments
- Feature flags included
- All analytics in one platform

Compared to alternatives:
- Optimizely: $50,000+/year
- LaunchDarkly: $900+/month
- Split.io: $100+/month
- **PostHog: $0 additional cost**

## Troubleshooting

### Feature Flags Not Loading
```typescript
// Check flag status
posthog.onFeatureFlags(() => {
  console.log('Flags loaded:', posthog.getAllFlags());
});
```

### Inconsistent Variants
```typescript
// Ensure stable user ID
const userId = await AsyncStorage.getItem('userId') || uuid();
posthog.identify(userId);
```

### Slow Flag Loading
```typescript
// Preload critical flags
posthog.bootstrap({
  featureFlags: {
    'paywall_pricing_structure': 'control'
  }
});
```

## Next Steps

1. **Configure experiments in PostHog dashboard**
2. **Set up monitoring dashboards**
3. **Train team on experiment process**
4. **Launch first experiment to 10% of users**
5. **Document learnings and iterate**

## Resources

- [PostHog Experiments Docs](https://posthog.com/docs/experiments)
- [PostHog React Native SDK](https://posthog.com/docs/libraries/react-native)
- [Statistical Significance Calculator](https://www.evanmiller.org/ab-testing/sample-size.html)
- Internal Proposal: `/docs/proposals/posthog-experiments-implementation.md`