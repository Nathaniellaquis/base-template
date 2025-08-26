import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/auth';
import { trpc } from '@/providers/trpc';
import { UpgradeModal } from '@/components/features/payment/UpgradeModal';
import { config } from '@/config';
import {
  type User,
  type Subscription,
  type PlanType,
  type BillingPeriod,
  type PaymentContextType,
  type SubscribeResult,
  PLAN_LIMITS,
  PRICING,
} from '@shared';
import { ConversionEvents, conversionTracker } from '@/lib/experiments/conversion';
import { trackFeature, trackPaywall } from '@/lib/analytics';

// Native-specific Stripe imports
import { StripeProvider as StripeNativeProvider } from '@/config/stripe';

const PaymentContext = createContext<PaymentContextType | null>(null);

// Inner provider that contains the payment logic
function PaymentProviderInner({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const utils = trpc.useContext();
  const router = useRouter();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    requiredPlan: PlanType;
    feature?: string;
  }>({ visible: false, requiredPlan: 'basic' });
  
  // Fetch subscription data
  const { 
    data: subscriptionData, 
    isLoading: isSubscriptionLoading,
    refetch,
  } = trpc.payment.getSubscription.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      refetchOnWindowFocus: true,
    }
  );
  
  // Get the actual subscription object
  const subscription = subscriptionData?.subscription || {
    status: 'none' as const,
    plan: 'free' as PlanType,
    period: 'monthly' as BillingPeriod,
    cancelAtPeriodEnd: false,
  };
  
  // Determine current plan based on subscription status
  const getCurrentPlan = (): PlanType => {
    // If no subscription data yet, assume free
    if (!subscriptionData) return 'free';
    
    // Check subscription status
    const { status, plan: subPlan, cancelAtPeriodEnd, currentPeriodEnd } = subscription;
    
    switch (status) {
      case 'active':
      case 'trialing':
        // Active or trial = full access to plan
        return subPlan || 'free';
        
      case 'canceled':
        // If canceled but still has time left, keep access
        if (cancelAtPeriodEnd && currentPeriodEnd && new Date(currentPeriodEnd) > new Date()) {
          return subPlan || 'free';
        }
        return 'free';
        
      case 'past_due':
        // Past due = downgrade to free (or you could keep access with a warning)
        return 'free';
        
      case 'none':
      default:
        return 'free';
    }
  };
  
  const plan = getCurrentPlan();
  const period = subscription.period || 'monthly';
  
  // Check if user has required plan, show modal if not
  const requirePlan = useCallback((requiredPlan: PlanType, feature?: string): boolean => {
    // Edge case: If subscription is loading, don't show modal yet
    if (isSubscriptionLoading) return false;
    
    // Edge case: If user is not authenticated
    if (!user) {
      router.push('/(auth)/login');
      return false;
    }
    
    const planHierarchy: PlanType[] = ['free', 'basic', 'pro', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(plan);
    const requiredIndex = planHierarchy.indexOf(requiredPlan);
    
    // Edge case: Invalid plan names
    if (currentIndex === -1 || requiredIndex === -1) {
      console.error('Invalid plan name provided to requirePlan');
      return false;
    }
    
    // Check if user has access
    const hasAccess = currentIndex >= requiredIndex;
    
    // Special case: User is past_due - show payment issue modal instead
    if (subscription.status === 'past_due' && !hasAccess) {
      // You might want a different modal for payment issues
      setUpgradeModal({
        visible: true,
        requiredPlan: requiredPlan,
        feature: feature ? `${feature} (Payment Required)` : 'Payment Required',
      });
      return false;
    }
    
    // Special case: User canceled but still has access
    if (subscription.cancelAtPeriodEnd && hasAccess) {
      // User has access now but will lose it - maybe show a warning
      // For now, just allow access
      return true;
    }
    
    if (!hasAccess) {
      setUpgradeModal({
        visible: true,
        requiredPlan: requiredPlan,
        feature,
      });
      
      // Track upgrade modal shown
      conversionTracker.trackConversion(
        ConversionEvents.CUSTOM,
        {
          customProperties: {
            eventName: 'upgrade_modal_shown',
            currentPlan: plan,
            requiredPlan,
            feature,
          }
        },
        user?.uid
      );
      
      trackFeature.use('upgrade_modal_shown', {
        currentPlan: plan,
        requiredPlan,
        feature,
      });
    }
    
    return hasAccess;
  }, [plan, subscription.status, subscription.cancelAtPeriodEnd, isSubscriptionLoading, user, router]);
  
  // Simple mutations with auto-update
  const subscribeMutation = trpc.payment.subscribe.useMutation({
    onSuccess: (data: { user?: User }) => {
      if (data.user) {
        // Update auth provider with returned user data
        setUser(data.user);
        // Also update React Query cache
        utils.user.get.setData(undefined, data.user);
      }
    }
  });
  const cancelMutation = trpc.payment.cancel.useMutation({
    onSuccess: (data: { user?: User }) => {
      if (data.user) {
        // Update auth provider with returned user data
        setUser(data.user);
        // Also update React Query cache
        utils.user.get.setData(undefined, data.user);
      }
    }
  });
  const portalMutation = trpc.payment.createPortalSession.useMutation();
  
  // Subscribe to a plan
  const subscribe = useCallback(async (targetPlan: PlanType, billingPeriod: BillingPeriod = 'monthly') => {
    // Free plan doesn't go through Stripe
    if (targetPlan === 'free') {
      // Just update local state, no backend call needed
      await refetch();
      return { action: 'downgraded', plan: 'free' as PlanType, period: billingPeriod };
    }
    
    try {
      const subscriptionResponse = await subscribeMutation.mutateAsync({ 
        plan: targetPlan,
        period: billingPeriod,
      });
      await refetch();
      
      // Track subscription conversion
      const price = targetPlan !== 'enterprise' 
        ? PRICING[targetPlan as 'basic' | 'pro'][billingPeriod]
        : 0;
      
      if (subscriptionResponse.action === 'trial_started') {
        conversionTracker.trackConversion(
          ConversionEvents.TRIAL_STARTED,
          {
            customProperties: {
              plan: targetPlan,
              period: billingPeriod,
              previousPlan: plan,
            }
          },
          user?.uid
        );
      } else if (subscriptionResponse.action === 'subscribed') {
        conversionTracker.trackConversion(
          ConversionEvents.SUBSCRIPTION_STARTED,
          {
            value: price,
            currency: 'USD',
            customProperties: {
              plan: targetPlan,
              period: billingPeriod,
              previousPlan: plan,
            }
          },
          user?.uid
        );
        
        // Track upgrade if moving to higher plan
        const planHierarchy: PlanType[] = ['free', 'basic', 'pro', 'enterprise'];
        const previousIndex = planHierarchy.indexOf(plan);
        const newIndex = planHierarchy.indexOf(targetPlan);
        
        if (newIndex > previousIndex) {
          conversionTracker.trackConversion(
            ConversionEvents.SUBSCRIPTION_UPGRADED,
            {
              value: price,
              currency: 'USD',
              customProperties: {
                fromPlan: plan,
                toPlan: targetPlan,
                period: billingPeriod,
              }
            },
            user?.uid
          );
        }
        
        // Track payment if immediate
        if (price > 0) {
          conversionTracker.trackConversion(
            ConversionEvents.PAYMENT_COMPLETED,
            {
              value: price,
              currency: 'USD',
              customProperties: {
                plan: targetPlan,
                period: billingPeriod,
              }
            },
            user?.uid
          );
        }
      }
      
      trackPaywall.startSubscription(
        targetPlan,
        billingPeriod,
        price
      );
      
      // User data is automatically updated via onSuccess
      return subscriptionResponse;
    } catch (error) {
      console.error('Subscription failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Subscription failed');
    }
  }, [subscribeMutation, refetch]);
  
  // Cancel subscription (always at period end)
  const cancel = useCallback(async () => {
    try {
      await cancelMutation.mutateAsync();
      await refetch();
      
      // Track cancellation
      conversionTracker.trackConversion(
        ConversionEvents.CUSTOM,
        {
          customProperties: {
            eventName: 'subscription_canceled',
            plan: plan,
          }
        },
        user?.uid
      );
      
      trackFeature.use('subscription_canceled', {
        plan: plan,
      });
      
      // User data is automatically updated via onSuccess
    } catch (error) {
      console.error('Cancel failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Cancel failed');
    }
  }, [cancelMutation, refetch]);
  
  // Open billing portal
  const openBilling = useCallback(async () => {
    try {
      // Get the current URL for return
      const returnUrl = Platform.OS === 'web' 
        ? window.location.href 
        : 'ingrd://settings'; // Deep link for mobile
        
      const { url } = await portalMutation.mutateAsync({ returnUrl });
      
      // Track billing portal opened
      conversionTracker.trackConversion(
        ConversionEvents.CUSTOM,
        {
          customProperties: {
            eventName: 'billing_portal_opened',
            plan: plan,
          }
        },
        user?.uid
      );
      
      trackFeature.use('billing_portal_opened', {
        plan: plan,
      });
      
      if (Platform.OS === 'web') {
        // @ts-ignore - window exists on web
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to open billing portal');
    }
  }, [portalMutation]);
  
  const contextValue: PaymentContextType = {
    plan,
    period,
    isSubscriptionLoading,
    subscribe,
    cancel,
    openBilling,
    requirePlan,
  };
  
  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
      <UpgradeModal
        visible={upgradeModal.visible}
        onClose={() => setUpgradeModal(prev => ({ ...prev, visible: false }))}
        currentPlan={plan}
        requiredPlan={upgradeModal.requiredPlan}
        feature={upgradeModal.feature}
      />
    </PaymentContext.Provider>
  );
}

// Hook to use payment context
export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
}


// Hook to get plan limits
export function usePlanLimits() {
  const { plan } = usePayment();
  return PLAN_LIMITS[plan];
}

// Hook to require a specific plan - returns a function to check access
export function useRequirePlan() {
  const { requirePlan } = usePayment();
  return requirePlan;
}

// Hook to check if user has a specific plan or higher
export function useHasPlan(minPlan: PlanType): boolean {
  const { plan } = usePayment();
  
  // Note: We don't have access to subscription status here
  // If we need to check past_due status, we'd need to expose it from the context
  
  const planHierarchy: PlanType[] = ['free', 'basic', 'pro', 'enterprise'];
  const currentIndex = planHierarchy.indexOf(plan);
  const requiredIndex = planHierarchy.indexOf(minPlan);
  
  // Handle invalid plan names
  if (currentIndex === -1 || requiredIndex === -1) {
    console.warn(`Invalid plan comparison: ${plan} vs ${minPlan}`);
    return false;
  }
  
  return currentIndex >= requiredIndex;
}

// Main PaymentProvider for Native - wraps with Stripe Native Provider
export function PaymentProvider({ children }: { children: React.ReactNode }) {
  return (
    <StripeNativeProvider
      publishableKey={config.stripe.publishableKey}
      merchantIdentifier={config.stripe.merchantId}
      urlScheme="ingrd"
    >
      <PaymentProviderInner>{children}</PaymentProviderInner>
    </StripeNativeProvider>
  );
}