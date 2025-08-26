# Experiments/A-B Testing Completion Gameplan

## Overview
This document outlines the complete implementation plan for finishing the experiments/A-B testing infrastructure. While the foundation is solid, several critical pieces need implementation to make the system production-ready.

## Current State Summary

### ✅ Implemented
- Core experiment hooks (useExperiment, useMultivariantExperiment, etc.)
- Type definitions and experiment configurations
- Basic PostHog integration (native only)
- Rollout management system
- Experiment usage in plan selection component

### ❌ Missing/Broken
- PostHog web SDK integration (using stub)
- Feature flag persistence
- Admin dashboard and monitoring
- Proper conversion tracking
- Testing infrastructure

## Implementation Plan

### Phase 1: Fix Core Integration (Priority: Critical)

#### 1.1 Fix PostHog Web Integration
```bash
# Install PostHog JS SDK
npm install posthog-js @types/posthog-js
```

**File Structure Following Codebase Patterns:**
```
app/providers/analytics/
├── index.tsx                      # Export barrel file
├── analytics-provider.native.tsx  # Native implementation (existing)
├── analytics-provider.web.tsx     # Web implementation (to fix)
└── analytics-context.ts          # Shared context (if needed)
```

**Implementation Following Provider Pattern:**
```typescript
// app/providers/analytics/analytics-provider.web.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import posthog from 'posthog-js';
import type { AnalyticsContextValue, FeatureFlags } from '@shared/types/analytics';

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({});
  
  useEffect(() => {
    // Initialize PostHog following app patterns
    posthog.init(process.env.EXPO_PUBLIC_POSTHOG_API_KEY!, {
      api_host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
      persistence: 'localStorage',
      loaded: (posthog) => {
        posthog.feature_flags.setReloadOnDecision(true);
        setIsReady(true);
        
        // Load initial feature flags
        const flags = posthog.getAllFlags();
        setFeatureFlags(flags);
      }
    });
    
    // Subscribe to feature flag changes
    posthog.onFeatureFlags((flags) => {
      setFeatureFlags(flags);
    });
  }, []);
  
  const contextValue: AnalyticsContextValue = {
    isReady,
    identify: (userId: string, traits?: Record<string, any>) => {
      posthog.identify(userId, traits);
    },
    track: (event: string, properties?: Record<string, any>) => {
      posthog.capture(event, properties);
    },
    getFeatureFlag: (key: string) => featureFlags[key],
    getAllFlags: () => featureFlags,
    reset: () => posthog.reset(),
  };
  
  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};
```

#### 1.2 Fix Native Feature Flag Methods
**Tasks:**
- [ ] Implement getAllFlags() properly in native provider
- [ ] Add feature flag caching mechanism
- [ ] Ensure payload support works correctly
- [ ] Add retry logic for failed flag fetches

### Phase 2: Implement Missing Features (Priority: High)

#### 2.1 Admin Experiment Dashboard
**Location:** `/app/app/(admin)/experiments/`

**File Structure Following App Patterns:**
```
(admin)/experiments/
├── _layout.tsx                    # Stack navigator
├── index.tsx                      # Experiments list screen
├── [id].tsx                       # Experiment details screen
└── index.styles.ts               # Shared styles
```

**Components Should Be Local to Screen:**
Since these components are specific to the experiments dashboard and not reused across multiple features, they should be kept local to the screen rather than in the shared components library.

**Implementation Following Screen Pattern:**
```typescript
// app/app/(admin)/experiments/index.tsx
import React from 'react';
import { SafeAreaView, ScrollView, View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemedStyles } from '@/styles';
import { createExperimentsStyles } from './index.styles';
import { Card, Text, LoadingScreen } from '@/components';
import { trpc } from '@/lib/api';

export default function ExperimentsScreen() {
  const styles = useThemedStyles(createExperimentsStyles);
  const router = useRouter();
  const { data: experiments, isLoading } = trpc.experiments.list.useQuery();
  
  if (isLoading) {
    return <LoadingScreen message="Loading experiments..." />;
  }
  
  // Local component for experiment items
  const renderExperiment = ({ item }) => (
    <Card 
      style={styles.experimentCard}
      onPress={() => router.push(`/experiments/${item._id}`)}
    >
      <View style={styles.experimentHeader}>
        <Text variant="h3">{item.name}</Text>
        <View style={[styles.statusBadge, styles[item.status]]}>
          <Text variant="caption" color="white">
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text variant="body" color="secondary" style={styles.description}>
        {item.description}
      </Text>
      
      <View style={styles.metrics}>
        <View style={styles.metricItem}>
          <Text variant="caption" color="secondary">Conversion</Text>
          <Text variant="h4">{item.metrics.conversionRate}%</Text>
        </View>
        <View style={styles.metricItem}>
          <Text variant="caption" color="secondary">Participants</Text>
          <Text variant="h4">{item.metrics.participants}</Text>
        </View>
      </View>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={experiments || []}
        renderItem={renderExperiment}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="h3">No experiments yet</Text>
            <Text variant="body" color="secondary">
              Create your first experiment to start testing
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
```

**Style Pattern:**
```typescript
// app/app/(admin)/experiments/index.styles.ts
// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createExperimentsStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
});
```

#### 2.2 Conversion Tracking System
**Following Library Pattern:**

```
app/lib/experiments/
├── index.ts                      # Existing exports
├── conversion.ts                 # Conversion tracking
├── attribution.ts               # Attribution logic
└── analytics.ts                 # Analytics helpers
```

**Implementation Following Codebase Patterns:**
```typescript
// app/lib/experiments/conversion.ts
import { getAnalyticsInstance } from '@/lib/analytics';
import { useExperiments } from '@/hooks';
import type { ExperimentKey, ConversionEvent } from '@shared/types/experiments';

// Following existing pattern from experimentMetrics
export const conversionTracking = {
  /**
   * Track a conversion event with experiment attribution
   */
  trackConversion: (
    eventName: ConversionEvent,
    properties?: Record<string, any>
  ) => {
    const analytics = getAnalyticsInstance();
    const activeExperiments = getActiveExperiments();
    
    // Add experiment context to conversion
    const enrichedProperties = {
      ...properties,
      experiments: activeExperiments,
      timestamp: new Date().toISOString(),
    };
    
    analytics.track(`conversion_${eventName}`, enrichedProperties);
  },
  
  /**
   * Track funnel step completion
   */
  trackFunnelStep: (
    funnelName: string,
    stepIndex: number,
    stepName: string,
    properties?: Record<string, any>
  ) => {
    const analytics = getAnalyticsInstance();
    
    analytics.track('funnel_step_completed', {
      funnel_name: funnelName,
      step_index: stepIndex,
      step_name: stepName,
      ...properties,
    });
  },
  
  /**
   * Create conversion attribution
   */
  attributeConversion: (
    conversionEvent: ConversionEvent,
    experimentKey: ExperimentKey,
    variant: string
  ) => {
    const analytics = getAnalyticsInstance();
    
    analytics.track('experiment_conversion', {
      event: conversionEvent,
      experiment: experimentKey,
      variant,
      attributed_at: new Date().toISOString(),
    });
  },
};

// Helper to get active experiments from storage
function getActiveExperiments(): Record<string, string> {
  // Following existing pattern from useExperiment
  try {
    const stored = localStorage.getItem('active_experiments');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Export following existing pattern
export { conversionTracking };
```

#### 2.3 Experiment Configuration Management
**Following Router Organization Pattern:**

```
server/routers/experiments/
├── index.ts                      # Router definition
├── list-experiments.ts           # List all experiments
├── get-experiment.ts            # Get single experiment
├── create-experiment.ts         # Create new experiment
├── update-experiment.ts         # Update experiment
├── get-results.ts              # Get experiment results
└── kill-experiment.ts          # Kill switch
```

**Router Implementation:**
```typescript
// server/routers/experiments/index.ts
import { router } from '@/trpc/trpc';
import { listExperiments } from './list-experiments';
import { getExperiment } from './get-experiment';
import { createExperiment } from './create-experiment';
import { updateExperiment } from './update-experiment';
import { getResults } from './get-results';
import { killExperiment } from './kill-experiment';

export const experimentsRouter = router({
  list: listExperiments,
  get: getExperiment,
  create: createExperiment,
  update: updateExperiment,
  getResults: getResults,
  kill: killExperiment,
});
```

**Procedure Pattern Example:**
```typescript
// server/routers/experiments/create-experiment.ts
import { adminProcedure } from '@/trpc/trpc';
import { z } from 'zod';
import { getExperimentsCollection } from '@/db';
import { errors } from '@/utils/errors';

const createExperimentSchema = z.object({
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  variants: z.array(z.object({
    key: z.string(),
    name: z.string(),
    weight: z.number().min(0).max(100),
  })),
  targetingRules: z.object({
    percentage: z.number().min(0).max(100),
    filters: z.array(z.any()).optional(),
  }),
});

export const createExperiment = adminProcedure
  .input(createExperimentSchema)
  .mutation(async ({ ctx, input }) => {
    const experimentsCollection = getExperimentsCollection();
    
    // Check if experiment key already exists
    const existing = await experimentsCollection.findOne({ key: input.key });
    if (existing) {
      throw errors.conflict('Experiment with this key already exists');
    }
    
    // Create experiment document
    const experiment = {
      ...input,
      status: 'draft' as const,
      createdBy: ctx.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: {
        impressions: 0,
        conversions: 0,
        variantMetrics: {},
      },
    };
    
    const result = await experimentsCollection.insertOne(experiment);
    
    // Return complete experiment following pattern
    return {
      ...experiment,
      _id: result.insertedId.toString(),
    };
  });
```

**Add to App Router:**
```typescript
// server/trpc/app.ts
import { experimentsRouter } from '@/routers/experiments';

export const appRouter = router({
  user: userRouter,
  onboarding: onboardingRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
  payment: paymentRouter,
  experiments: experimentsRouter, // Add new router
});
```

### Phase 3: Testing Infrastructure (Priority: Medium)

#### 3.1 Unit Tests
**Location:** `/app/hooks/__tests__/`

**Test Coverage:**
- [ ] useExperiment hook variations
- [ ] Rollout manager logic
- [ ] Statistical utilities
- [ ] Conversion tracking

#### 3.2 Integration Tests
**Location:** `/app/lib/experiments/__tests__/`

**Test Scenarios:**
- [ ] Full experiment lifecycle
- [ ] Multi-variant assignment
- [ ] Mutual exclusion groups
- [ ] Kill switch functionality
- [ ] Rollout strategies

#### 3.3 QA Testing Tools
**Location:** `/app/components/features/experiments/QATools.tsx`

**Features:**
- [ ] URL parameter variant forcing
- [ ] Experiment state inspector
- [ ] Clear experiment cache
- [ ] Mock experiment results

### Phase 4: Documentation & Training (Priority: Medium)

#### 4.1 Update Documentation
- [ ] Add troubleshooting guide
- [ ] Create experiment playbook
- [ ] Document PostHog setup
- [ ] Add code examples

#### 4.2 Create Training Materials
- [ ] How to create an experiment
- [ ] Analyzing experiment results
- [ ] Best practices guide
- [ ] Common pitfalls

### Phase 5: Production Readiness (Priority: High)

#### 5.1 Monitoring & Alerts
- [ ] Set up PostHog alerts for experiment issues
- [ ] Create Slack notifications for significant results
- [ ] Add experiment health dashboard
- [ ] Implement error tracking

#### 5.2 Performance Optimization
- [ ] Implement feature flag caching
- [ ] Optimize experiment assignment logic
- [ ] Add CDN support for flag delivery
- [ ] Reduce PostHog API calls

## Technical Requirements

### Environment Variables
```env
# Required for production
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_xxx # For admin API

# Optional
EXPERIMENT_OVERRIDE_ENABLED=true # Enable URL overrides
EXPERIMENT_CACHE_TTL=300 # Cache TTL in seconds
```

### Dependencies
```json
{
  "posthog-js": "^1.96.1",
  "@types/posthog-js": "^1.96.1",
  "react-native-posthog": "^1.1.0"
}
```

### PostHog Configuration
1. Create experiments in PostHog dashboard
2. Set up success metrics
3. Configure feature flags
4. Enable session recording for experiments
5. Set up cohorts for targeting

## Implementation Timeline

### Week 1-2: Core Integration
- Fix PostHog web integration
- Fix native feature flag methods
- Add proper error handling
- Test basic functionality

### Week 3-4: Admin Tools
- Build experiment dashboard
- Implement preview functionality
- Add results visualization
- Create management API

### Week 5-6: Testing & Optimization
- Write comprehensive tests
- Optimize performance
- Fix identified issues
- Document everything

### Week 7-8: Production Rollout
- Deploy to staging
- Run test experiments
- Train team
- Monitor and iterate

## Success Metrics

1. **Technical Metrics**
   - 100% test coverage for experiment hooks
   - < 100ms experiment assignment time
   - Zero PostHog integration errors
   - Feature flag cache hit rate > 90%

2. **Business Metrics**
   - Run 5+ experiments simultaneously
   - Achieve statistical significance in < 2 weeks
   - Increase conversion rate by 10%
   - Reduce experiment setup time to < 30 minutes

## Risk Mitigation

1. **PostHog Downtime**
   - Implement local fallbacks
   - Cache feature flags
   - Default to control variants

2. **Performance Impact**
   - Lazy load experiment code
   - Use CDN for flag delivery
   - Implement request batching

3. **Bad Experiments**
   - Automated kill switches
   - Real-time monitoring
   - Rollback procedures

## Next Steps

1. **Immediate Actions**
   - Install PostHog JS SDK
   - Fix web provider implementation
   - Test end-to-end flow

2. **This Week**
   - Complete Phase 1
   - Start admin dashboard design
   - Set up PostHog experiments

3. **This Month**
   - Complete all phases
   - Run first production experiment
   - Train team on usage

## Conclusion

The experiments infrastructure has a solid foundation but needs critical integration work to be production-ready. The main priority is fixing the PostHog web integration, followed by building admin tools and testing infrastructure. With focused effort, this can be completed in 6-8 weeks.