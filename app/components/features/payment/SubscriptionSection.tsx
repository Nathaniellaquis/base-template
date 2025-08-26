import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Card, Text, Button } from '@/components/ui';
import { usePayment } from '@/providers/payment';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';
import { trpc } from '@/lib';
import { useThemedStyles } from '@/styles';
import { createStyles } from './index.styles';
import { type PlanType, PRICING } from '@shared';
import { PaymentForm } from './PaymentForm';
import { PlanBadge } from './PlanBadge';

export function SubscriptionSection() {
  const styles = useThemedStyles(createStyles);
  const { plan, period, isSubscriptionLoading, cancel, openBilling } = usePayment();
  const { confirmSubscription, isProcessing } = usePaymentConfirmation();
  const [showPlans, setShowPlans] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan: PlanType; period: 'monthly' | 'yearly' } | null>(null);
  
  // Get detailed subscription data
  const { data: subscription, isLoading } = trpc.payment.getSubscription.useQuery(
    undefined,
    { enabled: plan !== 'free' }
  );

  if (isSubscriptionLoading || isLoading) {
    return (
      <Card style={styles.section}>
        <ActivityIndicator />
      </Card>
    );
  }

  const handleUpgrade = async (targetPlan: PlanType, targetPeriod: 'monthly' | 'yearly') => {
    // For existing subscribers, upgrade/downgrade doesn't need payment
    if (plan !== 'free') {
      const result = await confirmSubscription(targetPlan as Exclude<PlanType, 'free'>, targetPeriod);
      if (result?.success) {
        setShowPlans(false);
        Alert.alert('Success', `Successfully changed to ${targetPlan} plan!`);
      }
    } else {
      // New subscribers need to enter payment details
      setSelectedPlan({ plan: targetPlan, period: targetPeriod });
      setShowPaymentModal(true);
      setShowPlans(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    Alert.alert('Success', 'Subscription activated!');
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel();
              Alert.alert('Subscription Canceled', 'Your subscription will end at the end of the current billing period.');
            } catch {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  const handleResume = async () => {
    // Resuming is just subscribing to the same plan
    const result = await confirmSubscription(plan as Exclude<PlanType, 'free'>, period);
    if (result?.success) {
      Alert.alert('Success', 'Your subscription has been resumed!');
    }
  };

  // Format date helper
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card style={styles.section}>
      <Text variant="h3" style={styles.sectionTitle}>
        Subscription
      </Text>

      {/* Current Plan Display */}
      <View style={styles.currentPlanContainer}>
        <View style={styles.planHeader}>
          <View>
            <Text variant="h4" style={styles.planName}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </Text>
            {plan !== 'free' && period && (
              <Text variant="bodySmall" style={styles.billingPeriod}>
                Billed {period}
              </Text>
            )}
          </View>
          {plan !== 'free' && (
            <PlanBadge plan={plan} />
          )}
        </View>

        {/* Subscription Status */}
        {subscription && plan !== 'free' && (
          <View style={styles.statusContainer}>
            {subscription.subscription?.status === 'past_due' && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️ Payment failed - please update your payment method
                </Text>
              </View>
            )}
            
            {subscription.subscription?.cancelAtPeriodEnd && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  Cancels on {formatDate(subscription.subscription.currentPeriodEnd)}
                </Text>
              </View>
            )}

            {subscription.subscription?.status === 'trialing' && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  Trial ends on {formatDate(subscription.subscription.currentPeriodEnd)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {plan === 'free' ? (
          <Button
            title="Upgrade to Pro"
            onPress={() => setShowPlans(true)}
            style={styles.actionButton}
          />
        ) : (
          <>
            {subscription?.subscription?.cancelAtPeriodEnd ? (
              <Button
                title="Resume Subscription"
                onPress={handleResume}
                loading={isProcessing}
                style={styles.actionButton}
              />
            ) : (
              <>
                <Button
                  title="Change Plan"
                  variant="secondary"
                  onPress={() => setShowPlans(true)}
                  style={styles.actionButton}
                />
                <Button
                  title="Manage Billing"
                  variant="secondary"
                  onPress={openBilling}
                  style={styles.actionButton}
                />
                <TouchableOpacity onPress={handleCancel}>
                  <Text variant="link" style={styles.cancelLink}>
                    Cancel Subscription
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {/* Plan Selection (shown when changing plans) */}
      {showPlans && (
        <PlanSelector
          currentPlan={plan}
          onSelect={handleUpgrade}
          onCancel={() => setShowPlans(false)}
          isProcessing={isProcessing}
        />
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowPaymentModal(false)}
        >
          <Pressable style={styles.modalContent}>
            {selectedPlan && (
              <PaymentForm
                plan={selectedPlan.plan}
                period={selectedPlan.period}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentModal(false)}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Card>
  );
}


// Plan Selector Component
interface PlanSelectorProps {
  currentPlan: PlanType;
  onSelect: (plan: PlanType, period: 'monthly' | 'yearly') => void;
  onCancel: () => void;
  isProcessing: boolean;
}

function PlanSelector({ currentPlan, onSelect, onCancel, isProcessing }: PlanSelectorProps) {
  const styles = useThemedStyles(createStyles);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const plans: { type: PlanType; name: string; recommended?: boolean }[] = [
    { type: 'basic', name: 'Basic' },
    { type: 'pro', name: 'Pro', recommended: true },
    { type: 'enterprise', name: 'Enterprise' },
  ];

  return (
    <View style={styles.planSelector}>
      <Text variant="h4" style={styles.planSelectorTitle}>
        Choose Your Plan
      </Text>

      {/* Billing Period Toggle */}
      <View style={styles.periodToggle}>
        <TouchableOpacity
          onPress={() => setSelectedPeriod('monthly')}
          style={[
            styles.periodOption,
            selectedPeriod === 'monthly' && styles.periodOptionActive
          ]}
        >
          <Text style={[
            styles.periodOptionText,
            selectedPeriod === 'monthly' && styles.periodOptionTextActive
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedPeriod('yearly')}
          style={[
            styles.periodOption,
            selectedPeriod === 'yearly' && styles.periodOptionActive
          ]}
        >
          <Text style={[
            styles.periodOptionText,
            selectedPeriod === 'yearly' && styles.periodOptionTextActive
          ]}>
            Yearly (Save 17%)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Plan Options */}
      {plans.map((planOption) => {
        const price = planOption.type === 'free' ? 0 : PRICING[planOption.type as Exclude<PlanType, 'free'>][selectedPeriod];
        const isCurrentPlan = planOption.type === currentPlan;
        
        return (
          <TouchableOpacity
            key={planOption.type}
            onPress={() => !isCurrentPlan && onSelect(planOption.type, selectedPeriod)}
            style={[
              styles.planOption,
              isCurrentPlan && styles.planOptionCurrent,
              planOption.recommended && styles.planOptionRecommended
            ]}
            disabled={isCurrentPlan || isProcessing}
          >
            {planOption.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>RECOMMENDED</Text>
              </View>
            )}
            
            <View style={styles.planOptionContent}>
              <Text variant="h4">{planOption.name}</Text>
              <Text variant="h3">
                ${price}
                <Text variant="bodySmall">/{selectedPeriod === 'monthly' ? 'mo' : 'yr'}</Text>
              </Text>
              {isCurrentPlan && (
                <Text style={styles.currentPlanLabel}>Current Plan</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Cancel Button */}
      <Button
        title="Cancel"
        variant="outline"
        onPress={onCancel}
        disabled={isProcessing}
        style={styles.cancelButton}
      />
    </View>
  );
}