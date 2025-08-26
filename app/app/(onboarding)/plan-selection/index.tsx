import { ResponsiveModal } from '@/components/common/Modal';
import { OnboardingLayout } from '@/components/features';
import { PaymentSelection } from '@/components/features/payment/PaymentSelection';
import { PlanSelectionPayment } from '@/components/features/payment/PlanSelectionPayment';
import { Text } from '@/components/ui';
import { useNativePayment } from '@/hooks/useNativePayment';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { trackPaywall } from '@/lib/analytics/tracking';
import { usePayment } from '@/providers/payment';
import { useThemedStyles } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import type { BillingPeriod, PlanType } from '@shared/payment';
import { PRICING } from '@shared/payment';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import { createStyles } from './index.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlanSelection() {
  const { isSubscriptionLoading, plan: currentPlan } = usePayment();
  const { completeAndNavigate } = useOnboardingNavigation();
  const { currentStep } = useOnboarding();
  const styles = useThemedStyles(createStyles);
  const {
    confirmNativePayment,
    isNativePaySupported,
    isProcessing: isNativeProcessing
  } = useNativePayment();

  // Track paywall view
  useEffect(() => {
    trackPaywall.viewPaywall(currentStep);
  }, [currentStep]);

  // Default to Pro plan (recommended)
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>('pro');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWebPaymentModal, setShowWebPaymentModal] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<PlanType | null>(null);

  React.useEffect(() => {
    if (currentPlan && currentPlan !== 'free') {
      completeAndNavigate();
    }
  }, [currentPlan, completeAndNavigate]);

  // Log native payment support status
  useEffect(() => {
    console.log('[PlanSelection] Native payment supported:', isNativePaySupported);
  }, [isNativePaySupported]);

  // Animation values for card selection
  const scaleAnimations = useRef({
    basic: new Animated.Value(1),
    pro: new Animated.Value(1.02), // Pro starts slightly larger
    enterprise: new Animated.Value(1),
  }).current;

  const handleContinue = async () => {
    if (!selectedPlan) {
      // No plan selected, continue with free
      await completeAndNavigate();
      return;
    }

    // Track plan selection when starting checkout
    trackPaywall.selectPlan(selectedPlan, 'free', billingPeriod);

    // On mobile with native payment support, directly trigger Apple Pay/Google Pay
    if (Platform.OS !== 'web' && isNativePaySupported && selectedPlan !== 'free') {
      console.log('[PlanSelection] Triggering native payment directly');
      const result = await confirmNativePayment(selectedPlan, billingPeriod);

      if (result.success) {
        const price = getPrice(selectedPlan);
        await trackPaywall.startSubscription(selectedPlan, billingPeriod, price);
        await completeAndNavigate();
      } else if (result.error === 'canceled') {
        // User canceled, do nothing
        console.log('[PlanSelection] User canceled native payment');
      } else if (result.error) {
        // If native payment fails for other reasons, fall back to modal
        console.log('[PlanSelection] Native payment failed, showing modal:', result.error);
        setShowPaymentModal(true);
      }
    } else if (Platform.OS === 'web') {
      // On web, show modal with inline payment
      console.log('[PlanSelection] Showing web payment modal');
      setShowWebPaymentModal(true);
    } else {
      // On mobile when native payment isn't available, show the modal
      console.log('[PlanSelection] Showing payment modal (no native support)');
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setShowWebPaymentModal(false);
    if (!selectedPlan || selectedPlan === 'free') return;

    const price = getPrice(selectedPlan);

    // Track successful subscription
    await trackPaywall.startSubscription(selectedPlan, billingPeriod, price);

    await completeAndNavigate();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setShowWebPaymentModal(false);
    if (selectedPlan && selectedPlan !== 'free') {
      trackPaywall.dismissPaywall(selectedPlan, 'close_button');
    }
  };

  const handlePlanSelect = (plan: PlanType) => {
    const previousPlan = selectedPlan;
    // Toggle selection - if same plan clicked, deselect
    const newPlan = selectedPlan === plan ? null : plan;
    setSelectedPlan(newPlan);

    // Track plan selection
    if (newPlan) {
      trackPaywall.selectPlan(newPlan, previousPlan || 'free', billingPeriod);
    }

    // Animate card selection
    Object.entries(scaleAnimations).forEach(([key, anim]) => {
      Animated.spring(anim, {
        toValue: key === newPlan ? 1.02 : 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    });
  };

  const toggleBenefits = (plan: PlanType) => {
    setExpandedPlan(expandedPlan === plan ? null : plan);
  };

  const getPrice = (plan: PlanType) => {
    if (plan === 'free') return 0;
    const pricing = PRICING[plan as keyof typeof PRICING];
    return billingPeriod === 'monthly' ? pricing.monthly : pricing.yearly;
  };



  const getFullFeatures = (plan: PlanType) => {
    switch (plan) {
      case 'basic':
        return ['10 projects', '3 team members', '10GB storage', 'Email support', 'Basic analytics'];
      case 'pro':
        return ['Unlimited projects', '10 team members', '100GB storage', 'Priority support', 'Advanced analytics', 'API access'];
      case 'enterprise':
        return ['Everything in Pro', 'Unlimited team members', 'Unlimited storage', 'Dedicated support', 'Custom integrations', 'SLA guarantee'];
      default:
        return [];
    }
  };

  const plans: Array<{
    type: Exclude<PlanType, 'free'>;
    name: string;
    price: number;
    recommended?: boolean;
    badge?: string;
  }> = [
      {
        type: 'basic',
        name: 'Starter',
        price: getPrice('basic'),
      },
      {
        type: 'pro',
        name: 'Pro',
        price: getPrice('pro'),
        recommended: true,
        badge: 'MOST POPULAR',
      },
      {
        type: 'enterprise',
        name: 'Premium',
        price: getPrice('enterprise'),
      },
    ];

  const getCTAText = () => {
    if (!selectedPlan) return 'Skip for now';
    return 'Start 14-Day Free Trial';
  };

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return (yearlyPrice / 12).toFixed(2);
  };

  return (
    <OnboardingLayout
      buttonTitle={getCTAText()}
      onButtonPress={handleContinue}
      isButtonLoading={isNativeProcessing || isSubscriptionLoading}
      hideProgress={true}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.content}>
          <Text variant="h2" style={styles.title}>
            Pick Your Plan
          </Text>

          {/* Billing Toggle */}
          <View style={styles.billingContainer}>
            <TouchableOpacity
              onPress={() => {
                trackPaywall.changeBillingPeriod(billingPeriod, 'monthly', selectedPlan || 'free');
                setBillingPeriod('monthly');
              }}
              style={[
                styles.billingOption,
                billingPeriod === 'monthly' && styles.billingOptionActive
              ]}
            >
              <Text style={[
                styles.billingText,
                billingPeriod === 'monthly' && styles.billingTextActive
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                trackPaywall.changeBillingPeriod(billingPeriod, 'yearly', selectedPlan || 'free');
                setBillingPeriod('yearly');
              }}
              style={[
                styles.billingOption,
                billingPeriod === 'yearly' && styles.billingOptionActive
              ]}
            >
              <Text style={[
                styles.billingText,
                billingPeriod === 'yearly' && styles.billingTextActive
              ]}>
                Annually
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.savingSubtext}>Save on annual plans</Text>

          {/* Plan Cards - Clean Grid Layout */}
          <View style={styles.cardsContainer}>
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.type;
              const isPro = plan.type === 'pro';
              const isExpanded = expandedPlan === plan.type;

              return (
                <Animated.View
                  key={plan.type}
                  style={[
                    styles.card,
                    isPro && styles.cardPro,
                    isSelected && styles.cardSelected,
                    { transform: [{ scale: scaleAnimations[plan.type] }] }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardTouchable}
                    onPress={() => handlePlanSelect(plan.type)}
                    activeOpacity={0.7}
                  >
                    {/* Plan Header */}
                    <View style={styles.planHeader}>
                      <Text style={styles.planName}>{plan.name}</Text>

                      <View style={styles.rightControls}>
                        {plan.badge && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>Recommended</Text>
                          </View>
                        )}
                        {/* Selection Indicator */}
                        <View style={[
                          styles.selectionIndicator,
                          isSelected && styles.selectionIndicatorActive
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Price */}
                    <View style={styles.priceContainer}>
                      <View style={styles.priceRow}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <Text style={styles.price}>
                          {billingPeriod === 'yearly' ? getMonthlyEquivalent(plan.price) : plan.price}
                        </Text>
                        <Text style={styles.period}>
                          {billingPeriod === 'yearly' ? 'Per month' : 'Per month'}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.planDescription}>
                      {plan.type === 'basic' && 'More customization and control'}
                      {plan.type === 'pro' && 'Grow and engage your audience'}
                      {plan.type === 'enterprise' && 'Advanced tools for professionals'}
                    </Text>

                    {/* Expandable Benefits Toggle */}
                    <TouchableOpacity
                      style={styles.benefitsToggle}
                      onPress={() => {
                        toggleBenefits(plan.type);
                      }}
                    >
                      <Text style={styles.benefitsToggleText}>
                        See benefits
                      </Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {/* Expanded Benefits List */}
                    {isExpanded && (
                      <View style={styles.expandedBenefitsList}>
                        {getFullFeatures(plan.type).map((feature, idx) => (
                          <View key={idx} style={styles.expandedBenefitItem}>
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#10B981"
                            />
                            <Text style={styles.expandedBenefitText}>{feature}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              <Text style={styles.termsLink}>Terms and Conditions</Text>
              {' and '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Mobile Payment Modal */}
      {selectedPlan && selectedPlan !== 'free' && Platform.OS !== 'web' && (
        <PlanSelectionPayment
          visible={showPaymentModal}
          plan={selectedPlan}
          period={billingPeriod}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* Web Payment Modal with inline payment */}
      {Platform.OS === 'web' && selectedPlan && selectedPlan !== 'free' && (
        <ResponsiveModal
          visible={showWebPaymentModal}
          onClose={() => {
            setShowWebPaymentModal(false);
            trackPaywall.dismissPaywall(selectedPlan, 'close_button');
          }}
          title="Complete Your Subscription"
          showCloseButton={true}
          closeOnBackdrop={true}
        >
          <View style={styles.webModalContent}>
            <Text style={styles.webModalPlanInfo}>
              {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan - ${billingPeriod === 'yearly' ? getMonthlyEquivalent(getPrice(selectedPlan)) : getPrice(selectedPlan)}/month
            </Text>
            <PaymentSelection
              plan={selectedPlan}
              period={billingPeriod}
              onSuccess={handlePaymentSuccess}
              onError={(error) => {
                console.error('[PlanSelection] Web payment error:', error);
                trackPaywall.dismissPaywall(selectedPlan, 'close_button');
              }}
            />
          </View>
        </ResponsiveModal>
      )}
    </OnboardingLayout>
  );
}