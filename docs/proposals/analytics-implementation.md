# Analytics Implementation for Paywall Optimization

## Overview
Comprehensive analytics setup using PostHog to track, measure, and optimize paywall performance.

## PostHog Setup

### Installation
```bash
# Already installed in package.json
npm install posthog-react-native
```

### Configuration
```typescript
// app/config/posthog.ts
import PostHog from 'posthog-react-native';

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_xxx',
  {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    captureApplicationLifecycleEvents: true,
    captureDeepLinks: true,
    captureScreens: true,
  }
);

// app/lib/analytics.ts
import { posthog } from '@/config/posthog';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// Initialize in app/_layout.tsx
useEffect(() => {
  posthog.identify(user?._id, {
    email: user?.email,
    plan: user?.subscription?.plan || 'free',
    onboardingCompleted: user?.onboardingCompleted,
  });
}, [user]);
```

## Event Tracking Schema

### Core Paywall Events

```typescript
// types/analytics.ts
export interface PaywallEvents {
  // Visibility & Navigation
  'paywall_viewed': {
    step_number: number;
    entry_point: 'onboarding' | 'settings' | 'feature_gate';
    user_status: 'new' | 'returning';
  };
  
  'paywall_dismissed': {
    time_on_screen: number;
    plan_viewed: PlanType;
    interaction_count: number;
  };
  
  // Plan Interactions
  'plan_selected': {
    plan: PlanType;
    previous_plan: PlanType;
    billing_period: BillingPeriod;
    swipe_count: number;
  };
  
  'billing_toggle_changed': {
    from: BillingPeriod;
    to: BillingPeriod;
    current_plan: PlanType;
  };
  
  // Conversion Events
  'subscription_started': {
    plan: PlanType;
    billing_period: BillingPeriod;
    price: number;
    time_to_convert: number;
    experiment_variant?: string;
  };
  
  'subscription_failed': {
    plan: PlanType;
    error_type: string;
    error_message: string;
  };
}
```

### Implementation in Components

```typescript
// app/(onboarding)/plan-selection/index.tsx
import { trackEvent } from '@/lib/analytics';

// Track paywall view
useEffect(() => {
  const startTime = Date.now();
  
  trackEvent('paywall_viewed', {
    step_number: currentStep,
    entry_point: 'onboarding',
    user_status: 'new'
  });
  
  return () => {
    // Track when leaving screen
    trackEvent('paywall_dismissed', {
      time_on_screen: Date.now() - startTime,
      plan_viewed: selectedPlan,
      interaction_count: interactionCount
    });
  };
}, []);

// Track plan selection
const handleScroll = (event: any) => {
  const offsetX = event.nativeEvent.contentOffset.x;
  const index = Math.round(offsetX / SCREEN_WIDTH);
  const plans: PlanType[] = ['free', 'pro', 'enterprise'];
  
  if (plans[index] && plans[index] !== selectedPlan) {
    trackEvent('plan_selected', {
      plan: plans[index],
      previous_plan: selectedPlan,
      billing_period: billingPeriod,
      swipe_count: swipeCount + 1
    });
    
    setSelectedPlan(plans[index]);
    setSwipeCount(prev => prev + 1);
  }
};

// Track conversion
const handleContinue = async () => {
  const conversionStartTime = Date.now();
  
  try {
    const result = await subscribe(selectedPlan, billingPeriod);
    
    if (result) {
      trackEvent('subscription_started', {
        plan: selectedPlan,
        billing_period: billingPeriod,
        price: getPrice(selectedPlan),
        time_to_convert: Date.now() - paywallViewTime,
        experiment_variant: experimentVariant
      });
    }
  } catch (error) {
    trackEvent('subscription_failed', {
      plan: selectedPlan,
      error_type: error.code,
      error_message: error.message
    });
  }
};
```

## Key Metrics & Dashboards

### Primary KPIs Dashboard

```sql
-- PostHog SQL for key metrics

-- 1. Paywall Conversion Rate
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'subscription_started' THEN distinct_id END) * 100.0 / 
  COUNT(DISTINCT CASE WHEN event = 'paywall_viewed' THEN distinct_id END) as conversion_rate,
  DATE(timestamp) as date
FROM events
WHERE event IN ('paywall_viewed', 'subscription_started')
GROUP BY date
ORDER BY date DESC;

-- 2. Revenue Per Install
SELECT 
  SUM(CASE WHEN event = 'subscription_started' THEN properties.price ELSE 0 END) / 
  COUNT(DISTINCT distinct_id) as revenue_per_install,
  DATE(timestamp) as date
FROM events
WHERE event IN ('app_install', 'subscription_started')
GROUP BY date;

-- 3. Plan Distribution
SELECT 
  properties.plan as plan_type,
  COUNT(*) as selections,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM events
WHERE event = 'subscription_started'
GROUP BY plan_type;
```

### Funnel Analysis

```typescript
// PostHog Funnel Configuration
const paywallFunnel = {
  name: 'Paywall Conversion Funnel',
  steps: [
    { event: 'onboarding_started' },
    { event: 'paywall_viewed' },
    { event: 'plan_selected', properties: { plan: '!= free' } },
    { event: 'billing_toggle_changed' },
    { event: 'subscription_started' }
  ],
  filters: {
    date_from: '-7d',
    date_to: 'now',
    breakdown: 'properties.experiment_variant'
  }
};
```

### Cohort Analysis

```typescript
// Track cohorts by acquisition date and plan
const cohortDefinitions = {
  'Week_1_Pro_Users': {
    filters: [
      { property: 'subscription_started', operator: 'performed' },
      { property: 'plan', operator: 'equals', value: 'pro' },
      { property: 'timestamp', operator: 'in_last', value: '7d' }
    ]
  },
  'High_Value_Users': {
    filters: [
      { property: 'billing_period', operator: 'equals', value: 'yearly' },
      { property: 'plan', operator: 'in', value: ['pro', 'enterprise'] }
    ]
  }
};
```

## Real-time Monitoring

### Alert Configuration

```typescript
// alerts/paywall-alerts.ts
export const paywallAlerts = [
  {
    name: 'Conversion Rate Drop',
    condition: 'conversion_rate < 1.5%',
    window: '1h',
    severity: 'critical',
    notify: ['slack:#alerts', 'email:team@company.com']
  },
  {
    name: 'High Error Rate',
    condition: 'error_rate > 5%',
    window: '15m',
    severity: 'warning',
    notify: ['slack:#engineering']
  },
  {
    name: 'Unusual Plan Distribution',
    condition: 'free_plan_selection > 70%',
    window: '1d',
    severity: 'info',
    notify: ['slack:#product']
  }
];
```

### Live Dashboard Components

```typescript
// components/analytics/PaywallMetrics.tsx
export function PaywallMetrics() {
  const [metrics, setMetrics] = useState<Metrics>();
  
  useEffect(() => {
    // Real-time subscription
    const subscription = posthog.subscribe('paywall_metrics', (data) => {
      setMetrics({
        conversionRate: data.conversion_rate,
        avgTimeToConvert: data.avg_time_to_convert,
        activeUsers: data.active_users,
        revenueToday: data.revenue_today
      });
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <View style={styles.dashboard}>
      <MetricCard 
        title="Conversion Rate" 
        value={`${metrics?.conversionRate}%`}
        trend={metrics?.conversionTrend}
      />
      <MetricCard 
        title="Avg Time to Convert" 
        value={`${metrics?.avgTimeToConvert}s`}
      />
      <MetricCard 
        title="Revenue Today" 
        value={`$${metrics?.revenueToday}`}
      />
    </View>
  );
}
```

## User Journey Tracking

### Session Recording Setup

```typescript
// Enable session recording for paywall interactions
posthog.startSessionRecording({
  maskAllTextInputs: true,
  maskAllImages: false,
  capturePaywallInteractions: true
});

// Custom properties for journey analysis
posthog.capture('user_journey_milestone', {
  milestone: 'viewed_paywall',
  session_duration: sessionDuration,
  screens_viewed: screenCount,
  features_used: featuresArray,
  subscription_status: user?.subscription?.status
});
```

## Reporting & Insights

### Weekly Report Template

```typescript
interface WeeklyPaywallReport {
  period: { start: Date; end: Date };
  
  // Core Metrics
  metrics: {
    views: number;
    conversions: number;
    conversionRate: number;
    revenueGenerated: number;
    avgOrderValue: number;
  };
  
  // Comparisons
  comparison: {
    previousWeek: MetricChange;
    previousMonth: MetricChange;
    target: MetricProgress;
  };
  
  // Insights
  insights: {
    topPerformingPlan: PlanType;
    bestConvertingHour: number;
    dropOffPoint: string;
    recommendations: string[];
  };
  
  // Experiments
  experiments: {
    active: ExperimentResult[];
    completed: ExperimentResult[];
    planned: string[];
  };
}

// Auto-generate weekly reports
async function generateWeeklyReport(): Promise<WeeklyPaywallReport> {
  const data = await posthog.query({
    // Query configuration
  });
  
  return processReportData(data);
}
```

## Implementation Checklist

### Phase 4 Setup Tasks

- [ ] Configure PostHog project
- [ ] Add API keys to environment
- [ ] Implement base tracking in app
- [ ] Set up core events
- [ ] Create dashboards
- [ ] Configure alerts
- [ ] Set up session recording
- [ ] Create first reports
- [ ] Train team on dashboard
- [ ] Document tracking plan

## Privacy & Compliance

### Data Collection Policy

```typescript
// Only collect necessary data
const privacyConfig = {
  // Personal data - require consent
  collectEmail: false,
  collectName: false,
  collectPhone: false,
  
  // Anonymous data - no consent needed
  collectDeviceId: true,
  collectSessionId: true,
  collectPlanSelection: true,
  
  // Respect user preferences
  respectDoNotTrack: true,
  allowOptOut: true
};
```

### GDPR Compliance

- User consent on first launch
- Data deletion requests honored
- Export user data capability
- Clear privacy policy

## Next Steps

1. **Week 1**: Install PostHog SDK
2. **Week 2**: Implement core events
3. **Week 3**: Build dashboards
4. **Week 4**: Start monitoring
5. **Ongoing**: Iterate based on insights

---

**Resources**:
- [PostHog Documentation](https://posthog.com/docs)
- [Event Tracking Best Practices](https://posthog.com/tutorials)
- [Privacy Guidelines](https://posthog.com/privacy)