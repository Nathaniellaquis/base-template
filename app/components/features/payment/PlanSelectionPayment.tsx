import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useNativePayment } from '@/hooks/useNativePayment';
import { useThemedStyles } from '@/styles';
import { Theme } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import { type BillingPeriod, type PlanType, PRICING } from '@shared';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativePayButton } from './NativePayButton';

interface PlanSelectionPaymentProps {
  visible: boolean;
  plan: PlanType;
  period: BillingPeriod;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlanSelectionPayment({
  visible,
  plan,
  period,
  onSuccess,
  onCancel,
}: PlanSelectionPaymentProps) {
  const styles = useThemedStyles(createStyles);
  const { isNativePaySupported, confirmSubscription, isProcessing } = useNativePayment();

  const price = PRICING[plan as Exclude<PlanType, 'free'>]?.[period] || 0;

  // Smart button text for modal context
  const getModalButtonText = () => {
    if (Platform.OS !== 'web' && isNativePaySupported) {
      // Should not reach here as native button is shown instead
      return 'Subscribe with Card';
    }
    return 'Complete Payment';
  };
  const displayPrice = period === 'monthly'
    ? `$${price}/month`
    : `$${price}/year`;

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSuccess();
  };

  const handleError = (error: string) => {
    if (error !== 'canceled') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'web' ? 'overFullScreen' : 'pageSheet'}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text variant="h3" style={styles.title}>Complete Your Subscription</Text>
              <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.planSummary}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                </Text>
                <Text style={styles.planPrice}>{displayPrice}</Text>
              </View>
              {period === 'yearly' && (
                <View style={styles.savingBadge}>
                  <Text style={styles.savingText}>Save 17%</Text>
                </View>
              )}
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Payment Selection - Shows native on mobile, card on web */}
            <View style={styles.paymentSection}>
              {Platform.OS !== 'web' && isNativePaySupported ? (
                <NativePayButton
                  plan={plan}
                  period={period}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              ) : (
                <Button
                  title={getModalButtonText()}
                  onPress={async () => {
                    const result = await confirmSubscription(plan, period);
                    if (result.success) {
                      handleSuccess();
                    } else if (result.error && result.error !== 'canceled') {
                      handleError(result.error);
                    }
                  }}
                  loading={isProcessing}
                  disabled={isProcessing}
                />
              )}
            </View>

            {/* Features reminder */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>What you&apos;ll get:</Text>
              {getFeatures(plan).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Trust badges */}
            <View style={styles.trustSection}>
              <View style={styles.trustItem}>
                <Ionicons name="lock-closed" size={16} color="#6B7280" />
                <Text style={styles.trustText}>Secure payment</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="refresh" size={16} color="#6B7280" />
                <Text style={styles.trustText}>Cancel anytime</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
                <Text style={styles.trustText}>Money-back guarantee</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Helper function to get features for each plan
function getFeatures(plan: PlanType): string[] {
  switch (plan) {
    case 'basic':
      return [
        'All Free features',
        '10 projects',
        '50GB storage',
        'Priority support',
        'Advanced analytics',
      ];
    case 'pro':
      return [
        'All Basic features',
        'Unlimited projects',
        '500GB storage',
        'Dedicated support',
        'Custom integrations',
        'Team collaboration',
      ];
    case 'enterprise':
      return [
        'All Pro features',
        'Unlimited storage',
        'White-glove support',
        'Custom contracts',
        'SLA guarantee',
        'Advanced security',
      ];
    default:
      return [];
  }
}

const createStyles = (theme: Theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  container: {
    flex: Platform.OS === 'web' ? 0 : 1,
    backgroundColor: theme.colors.background,
    maxHeight: Platform.OS === 'web' ? '90%' : undefined,
    width: Platform.OS === 'web' ? '90%' : '100%',
    maxWidth: Platform.OS === 'web' ? 500 : undefined,
    borderRadius: Platform.OS === 'web' ? theme.borderRadius.lg : 0,
    ...(Platform.OS === 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    }),
  },
  header: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    paddingTop: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopLeftRadius: Platform.OS === 'web' ? theme.borderRadius.lg : 0,
    borderTopRightRadius: Platform.OS === 'web' ? theme.borderRadius.lg : 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  planSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    gap: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  savingBadge: {
    backgroundColor: '#D1FAE5', // Light green background
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  savingText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  paymentSection: {
    padding: theme.spacing.lg,
  },
  featuresSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.gray[50],
    marginTop: theme.spacing.md,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  trustText: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
});