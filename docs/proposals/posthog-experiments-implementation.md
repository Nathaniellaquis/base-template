# PostHog Experiments Implementation Plan

## Executive Summary
Leverage PostHog's built-in experimentation features for A/B testing across web and mobile platforms, utilizing the existing PostHog integration for a cost-effective and unified analytics/testing solution.

## Why PostHog Experiments?

### Advantages
- **Already Integrated**: PostHog is already set up for analytics
- **Zero Additional Cost**: Included in your current plan
- **Single Dashboard**: Analytics and experiments in one place
- **Cross-Platform**: Same SDK works on web & mobile
- **Feature Flags Included**: Progressive rollouts built-in
- **Simple Setup**: Can launch first test today

### Current Limitations (Acceptable for MVP)
- Less sophisticated than specialized tools
- Basic statistical engine (frequentist)
- Limited visual editing
- Fewer targeting options

## Implementation Plan

### Phase 1: Enable Experiments (Day 1)

#### 1.1 Enable Feature Flags & Experiments
```typescript
// app/lib/posthog-config.ts
import PostHog from 'posthog-react-native';

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  {
    host: 'https://app.posthog.com',
    // Enable feature flags & experiments
    bootstrap: {
      featureFlags: true,
      distinctId: getDeviceId()
    },
    // Persist flags locally
    persistence: 'localStorage',
    // Load flags on init
    preloadFeatureFlags: true
  }
);
```

#### 1.2 Update Provider with Experiments
```typescript
// app/providers/posthog-provider.tsx
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-react-native';

export function PostHogProvider({ children }) {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Identify user for consistent experiments
      posthog.identify(user._id, {
        email: user.email,
        phone: user.phoneNumber,
        plan: user.subscription?.plan || 'free',
        platform: Platform.OS,
        appVersion: Constants.expoConfig.version,
        onboardingStep: user.onboardingStep,
        createdAt: user.createdAt,
        // Custom properties for targeting
        isNewUser: isWithinDays(user.createdAt, 7),
        daysSinceSignup: daysSince(user.createdAt),
        country: user.country || 'unknown',
        cohort: getWeeklyCohort(user.createdAt)
      });
      
      // Reload feature flags on user change
      posthog.reloadFeatureFlags();
    }
  }, [user]);
  
  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}
```

### Phase 2: Create Experiments Hook (Day 1)

#### 2.1 Custom Hook for Experiments
```typescript
// app/hooks/useExperiment.ts
import { useFeatureFlag, usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';

export function useExperiment(
  experimentKey: string,
  options?: {
    sendExposureEvent?: boolean;
    fallbackValue?: any;
  }
) {
  const posthog = usePostHog();
  const variant = useFeatureFlag(experimentKey);
  
  useEffect(() => {
    // Track experiment exposure
    if (variant !== undefined && options?.sendExposureEvent !== false) {
      posthog.capture('$experiment_viewed', {
        experiment: experimentKey,
        variant: variant,
        timestamp: new Date().toISOString()
      });
    }
  }, [variant, experimentKey]);
  
  return {
    variant: variant || options?.fallbackValue || 'control',
    isLoading: variant === undefined,
    isControl: variant === 'control' || !variant,
    isTest: variant !== 'control' && variant !== undefined
  };
}

// Multi-variant experiments
export function useMultivariantExperiment(
  experimentKey: string,
  variants: string[]
) {
  const { variant } = useExperiment(experimentKey);
  
  return {
    variant,
    isVariant: (v: string) => variant === v,
    variantIndex: variants.indexOf(variant),
    isLoading: variant === undefined
  };
}
```

### Phase 3: Paywall Experiments Setup (Day 2)

#### 3.1 Create Experiments in PostHog Dashboard

**Experiment 1: Pricing Structure Test**
```javascript
// In PostHog Dashboard > Experiments
{
  name: "paywall_pricing_structure",
  key: "paywall_pricing_structure",
  description: "Test different pricing structures",
  variants: [
    { key: "control", name: "Current (Free, Pro, Enterprise)" },
    { key: "with_basic", name: "Add Basic tier as decoy" },
    { key: "no_free", name: "Remove free tier" }
  ],
  rollout_percentage: 100,
  targeting: {
    // Only new users in onboarding
    properties: [
      { key: "onboardingStep", operator: "exact", value: 3 },
      { key: "isNewUser", operator: "exact", value: true }
    ]
  },
  metrics: [
    "paywall_conversion_rate",
    "revenue_per_user",
    "plan_selection_distribution"
  ]
}
```

**Experiment 2: Urgency Messaging**
```javascript
{
  name: "paywall_urgency_test",
  key: "paywall_urgency",
  variants: [
    { key: "control", name: "No urgency" },
    { key: "limited_time", name: "48 hour offer" },
    { key: "limited_spots", name: "Only 10 spots left" },
    { key: "price_increase", name: "Price increasing soon" }
  ]
}
```

**Experiment 3: Social Proof**
```javascript
{
  name: "paywall_social_proof",
  key: "paywall_social_proof",
  variants: [
    { key: "control", name: "No social proof" },
    { key: "user_count", name: "2,847 teams joined" },
    { key: "logos", name: "Customer logos" },
    { key: "testimonials", name: "User testimonials" }
  ]
}
```

#### 3.2 Implement in Plan Selection Component
```typescript
// app/app/(onboarding)/plan-selection/index.tsx
import { useExperiment, useMultivariantExperiment } from '@/hooks/useExperiment';

export default function PlanSelection() {
  // Load experiments
  const pricingTest = useExperiment('paywall_pricing_structure');
  const urgencyTest = useMultivariantExperiment('paywall_urgency', [
    'control', 'limited_time', 'limited_spots', 'price_increase'
  ]);
  const socialProof = useExperiment('paywall_social_proof');
  
  // Get plans based on variant
  const getPlansForVariant = () => {
    switch(pricingTest.variant) {
      case 'with_basic':
        return [
          { type: 'free', price: 0, name: 'Free' },
          { type: 'basic', price: 19, name: 'Basic' }, // Decoy
          { type: 'pro', price: 29, name: 'Pro', popular: true },
          { type: 'enterprise', price: 79, name: 'Enterprise' }
        ];
      case 'no_free':
        return [
          { type: 'basic', price: 9, name: 'Starter' },
          { type: 'pro', price: 29, name: 'Pro', popular: true },
          { type: 'enterprise', price: 79, name: 'Enterprise' }
        ];
      default:
        return defaultPlans;
    }
  };
  
  // Urgency messaging
  const getUrgencyMessage = () => {
    switch(urgencyTest.variant) {
      case 'limited_time':
        return (
          <View style={styles.urgencyBadge}>
            <Text>🔥 Lock in founder pricing - 48 hours left</Text>
          </View>
        );
      case 'limited_spots':
        return (
          <View style={styles.urgencyBadge}>
            <Text>⚡ Only 10 spots remaining at this price</Text>
          </View>
        );
      case 'price_increase':
        return (
          <View style={styles.urgencyBadge}>
            <Text>📈 Prices increasing next week - save 30%</Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  // Social proof
  const getSocialProof = () => {
    switch(socialProof.variant) {
      case 'user_count':
        return <Text style={styles.socialProof}>Join 2,847 teams this week</Text>;
      case 'logos':
        return <CustomerLogos />;
      case 'testimonials':
        return <MiniTestimonials />;
      default:
        return null;
    }
  };
  
  const plans = getPlansForVariant();
  
  return (
    <OnboardingLayout>
      <ScrollView>
        <Text variant="h2">Choose Your Plan</Text>
        {getSocialProof()}
        {getUrgencyMessage()}
        
        {/* Render plans based on experiment */}
        {plans.map(plan => (
          <PlanCard key={plan.type} plan={plan} />
        ))}
      </ScrollView>
    </OnboardingLayout>
  );
}
```

### Phase 4: Feature Flags for Rollout (Day 2)

#### 4.1 Progressive Feature Rollout
```typescript
// app/hooks/useFeatureFlag.ts
export function useFeatureRollout(flagKey: string) {
  const flag = useFeatureFlag(flagKey);
  const posthog = usePostHog();
  
  return {
    isEnabled: flag === true || flag === 'true',
    variant: flag,
    // Check if user is in rollout percentage
    isInRollout: () => {
      const percentage = posthog.getFeatureFlagPayload(flagKey);
      return percentage?.rollout_percentage > Math.random() * 100;
    }
  };
}

// Usage
const newOnboarding = useFeatureRollout('new_onboarding_flow');
if (newOnboarding.isEnabled) {
  return <NewOnboardingFlow />;
}
```

#### 4.2 Kill Switches
```typescript
// Emergency feature disable
const useKillSwitch = (feature: string) => {
  const flag = useFeatureFlag(`kill_${feature}`);
  
  if (flag === true) {
    // Log and disable feature
    console.error(`Feature ${feature} killed via flag`);
    return { killed: true, enabled: false };
  }
  
  return { killed: false, enabled: true };
};
```

### Phase 5: Metrics & Tracking (Day 3)

#### 5.1 Define Success Metrics
```typescript
// app/lib/posthog-metrics.ts
export const trackPaywallMetrics = {
  viewPaywall: (plan?: string) => {
    posthog.capture('paywall_viewed', {
      plan_shown: plan,
      entry_point: 'onboarding',
      timestamp: Date.now()
    });
  },
  
  selectPlan: (plan: string, previousPlan?: string) => {
    posthog.capture('plan_selected', {
      plan,
      previous_plan: previousPlan,
      selection_time: Date.now()
    });
  },
  
  startSubscription: (plan: string, billing: string, price: number) => {
    posthog.capture('subscription_started', {
      plan,
      billing_period: billing,
      price,
      currency: 'USD',
      // Include experiment variants for analysis
      experiments: {
        pricing: posthog.getFeatureFlag('paywall_pricing_structure'),
        urgency: posthog.getFeatureFlag('paywall_urgency'),
        social: posthog.getFeatureFlag('paywall_social_proof')
      }
    });
  },
  
  subscriptionFailed: (error: string, plan: string) => {
    posthog.capture('subscription_failed', {
      error_message: error,
      plan_attempted: plan
    });
  }
};
```

#### 5.2 Conversion Funnel
```typescript
// Track complete funnel
export const trackOnboardingFunnel = {
  step1_welcome: () => posthog.capture('onboarding_welcome_viewed'),
  step2_profile: () => posthog.capture('onboarding_profile_viewed'),
  step3_value: () => posthog.capture('onboarding_value_viewed'),
  step4_paywall: () => posthog.capture('onboarding_paywall_viewed'),
  step5_complete: () => posthog.capture('onboarding_completed')
};
```

### Phase 6: Dashboard & Analysis (Day 3)

#### 6.1 Create PostHog Dashboard

**Key Metrics to Track:**
```sql
-- Paywall Conversion Rate by Experiment
SELECT 
  properties.experiments.pricing as pricing_variant,
  COUNT(DISTINCT CASE WHEN event = 'subscription_started' THEN distinct_id END) * 100.0 / 
  COUNT(DISTINCT CASE WHEN event = 'paywall_viewed' THEN distinct_id END) as conversion_rate
FROM events
WHERE event IN ('paywall_viewed', 'subscription_started')
  AND timestamp > now() - interval '7 days'
GROUP BY pricing_variant;

-- Revenue Impact
SELECT
  properties.experiments.pricing as variant,
  AVG(properties.price) as avg_revenue_per_user,
  COUNT(DISTINCT distinct_id) as users
FROM events
WHERE event = 'subscription_started'
GROUP BY variant;
```

#### 6.2 Real-time Monitoring Component
```typescript
// app/components/admin/ExperimentMonitor.tsx
export function ExperimentMonitor() {
  const [metrics, setMetrics] = useState({});
  
  useEffect(() => {
    // Fetch experiment metrics from PostHog API
    const fetchMetrics = async () => {
      const response = await fetch('/api/posthog/experiments/metrics');
      const data = await response.json();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={styles.dashboard}>
      <Text variant="h3">Live Experiments</Text>
      
      {/* Pricing Test Results */}
      <ExperimentCard
        name="Pricing Structure"
        control={metrics.pricing?.control}
        variants={metrics.pricing?.variants}
        winner={metrics.pricing?.winner}
        confidence={metrics.pricing?.confidence}
      />
      
      {/* Urgency Test Results */}
      <ExperimentCard
        name="Urgency Messaging"
        control={metrics.urgency?.control}
        variants={metrics.urgency?.variants}
      />
    </View>
  );
}
```

### Phase 7: Testing Workflow (Day 4)

#### 7.1 QA Testing Mode
```typescript
// Force specific variants for testing
export function useTestMode() {
  const isTestMode = __DEV__ || process.env.EXPO_PUBLIC_TEST_MODE === 'true';
  
  if (isTestMode) {
    // Override variants from URL params or env
    const params = new URLSearchParams(window.location.search);
    const forcedVariant = params.get('variant');
    
    if (forcedVariant) {
      posthog.overrideFeatureFlag('paywall_pricing_structure', forcedVariant);
    }
  }
}
```

#### 7.2 Experiment Preview
```typescript
// app/app/(admin)/experiments/preview.tsx
export function ExperimentPreview() {
  const [selectedVariant, setSelectedVariant] = useState('control');
  
  // Override for preview
  useEffect(() => {
    posthog.overrideFeatureFlag('paywall_pricing_structure', selectedVariant);
  }, [selectedVariant]);
  
  return (
    <View>
      <Picker
        selectedValue={selectedVariant}
        onValueChange={setSelectedVariant}
      >
        <Picker.Item label="Control" value="control" />
        <Picker.Item label="With Basic" value="with_basic" />
        <Picker.Item label="No Free" value="no_free" />
      </Picker>
      
      <PlanSelection />
    </View>
  );
}
```

## Implementation Checklist

### Day 1: Setup
- [ ] Update PostHog initialization with experiments
- [ ] Create useExperiment hook
- [ ] Set up user properties for targeting
- [ ] Test feature flag loading

### Day 2: First Experiments
- [ ] Create pricing experiment in PostHog
- [ ] Implement in plan-selection component
- [ ] Add urgency messaging test
- [ ] Deploy to 10% of users

### Day 3: Metrics & Monitoring
- [ ] Set up conversion tracking
- [ ] Create experiment dashboard
- [ ] Configure alerts for anomalies
- [ ] Document experiment process

### Day 4: Team Training
- [ ] Train team on PostHog experiments
- [ ] Create experiment templates
- [ ] Set up QA testing workflow
- [ ] Launch second experiment

## Best Practices

### 1. Experiment Naming Convention
```typescript
// Format: [area]_[element]_[test_type]
'paywall_pricing_structure'
'onboarding_welcome_copy'
'home_cta_button_color'
```

### 2. Minimum Sample Size
```typescript
// Calculate required sample size
const calculateSampleSize = (
  baselineRate: number,
  minimumEffect: number,
  confidence = 0.95
) => {
  // Use PostHog's built-in calculator
  return posthog.calculateSampleSize({
    baselineRate,
    minimumEffect,
    confidence
  });
};
```

### 3. Test Duration
- Minimum: 1 full week (capture weekly patterns)
- Recommended: 2 weeks
- Maximum: 4 weeks (avoid drift)

### 4. Mutual Exclusion
```typescript
// Prevent users from multiple pricing tests
const experiments = {
  mutuallyExclusive: [
    ['paywall_pricing_structure', 'paywall_pricing_v2'],
    ['onboarding_flow_a', 'onboarding_flow_b']
  ]
};
```

## Rollout Strategy

### Week 1: Foundation
- Set up PostHog experiments
- Create first test (pricing)
- Monitor for issues

### Week 2: Scale
- Launch 2-3 more tests
- Increase traffic allocation
- Analyze initial results

### Week 3: Optimize
- Kill losing variants
- Scale winners
- Launch follow-up tests

### Week 4: Systematize
- Document learnings
- Create playbooks
- Train broader team

## Cost Analysis

**PostHog Pricing for Experiments:**
- First 1M events/month: FREE
- Feature flags: Included
- Experiments: Included
- No additional cost for your usage

**Compared to alternatives:**
- GrowthBook: $20/month
- Statsig: $0-150/month
- Split.io: $100/month
- LaunchDarkly: $75/month

**You save: $75-150/month using PostHog**

## Success Metrics

Target improvements after 1 month:
- Paywall conversion: +25% (from 2% to 2.5%)
- Revenue per user: +30%
- Experiment velocity: 3-4 tests/month
- Decision speed: <2 weeks per test

## Troubleshooting

### Common Issues & Solutions

**Feature flags not loading:**
```typescript
// Check flag status
posthog.onFeatureFlags(() => {
  console.log('Flags loaded:', posthog.getAllFlags());
});
```

**Inconsistent variants:**
```typescript
// Ensure user ID is stable
const userId = await AsyncStorage.getItem('userId') || uuid();
posthog.identify(userId);
```

**Slow flag loading:**
```typescript
// Preload critical flags
posthog.bootstrap({
  featureFlags: {
    'paywall_pricing_structure': 'control'
  }
});
```

## Next Steps

1. **Today**: Update PostHog initialization
2. **Tomorrow**: Create first experiment
3. **This Week**: Launch to 10% of users
4. **Next Week**: Analyze and iterate

---

**Bottom Line**: PostHog Experiments gives you everything needed for effective A/B testing at zero additional cost. Start simple, iterate quickly, and scale what works.