import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ResponsiveModal } from '@/components/common';
import { PlanSelectionPayment } from './PlanSelectionPayment';
import { PLAN_LIMITS, PRICING, type PlanType, type BillingPeriod } from '@shared/payment';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@/styles';
import { Theme } from '@/types/theme';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  requiredPlan: PlanType;
  feature?: string;
}

export function UpgradeModal({
  visible,
  onClose,
  currentPlan,
  requiredPlan,
  feature,
}: UpgradeModalProps) {
  const styles = useThemedStyles(createStyles);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('monthly');

  const plans: Record<PlanType, {
    name: string;
    icon: string;
    color: string;
  }> = {
    free: { name: 'Free', icon: 'gift', color: '#6B7280' },
    basic: { name: 'Basic', icon: 'star', color: '#3B82F6' },
    pro: { name: 'Pro', icon: 'rocket', color: '#8B5CF6' },
    enterprise: { name: 'Enterprise', icon: 'diamond', color: '#F59E0B' },
  };

  const handleUpgrade = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onClose();
  };

  if (showPayment) {
    return (
      <PlanSelectionPayment
        visible={true}
        plan={requiredPlan}
        period={selectedPeriod}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPayment(false)}
      />
    );
  }

  return (
    <ResponsiveModal
      visible={visible}
      onClose={onClose}
      title={feature ? `${feature} requires ${plans[requiredPlan].name}` : `Upgrade to ${plans[requiredPlan].name}`}
      testID="upgrade-modal"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={plans[requiredPlan].icon as any} 
              size={32} 
              color={plans[requiredPlan].color} 
            />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.subtitle}>
              Unlock premium features and take your experience to the next level
            </Text>

            {/* Billing Period Toggle */}
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[styles.periodOption, selectedPeriod === 'monthly' && styles.periodOptionActive]}
                onPress={() => setSelectedPeriod('monthly')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'monthly' && styles.periodTextActive]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodOption, selectedPeriod === 'yearly' && styles.periodOptionActive]}
                onPress={() => setSelectedPeriod('yearly')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'yearly' && styles.periodTextActive]}>
                  Yearly
                </Text>
                {selectedPeriod === 'yearly' && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>Save 17%</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Price Display */}
            <View style={styles.priceSection}>
              <Text style={styles.price}>
                ${PRICING[requiredPlan][selectedPeriod]}
              </Text>
              <Text style={styles.pricePeriod}>
                /{selectedPeriod === 'monthly' ? 'month' : 'year'}
              </Text>
            </View>

            {/* Features */}
            <View style={styles.features}>
              <Text style={styles.featuresTitle}>What you&apos;ll get:</Text>
              {Object.entries(PLAN_LIMITS[requiredPlan]).map(([key, value]) => (
                <View key={key} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.featureText}>
                    {formatFeature(key, value)}
                  </Text>
                </View>
              ))}
            </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={`Upgrade to ${plans[requiredPlan].name}`}
            onPress={handleUpgrade}
            variant="primary"
            style={styles.upgradeButton}
          />
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ResponsiveModal>
  );
}

function formatFeature(key: string, value: any): string {
  const labels: Record<string, string> = {
    projects: 'Projects',
    storage: 'Storage',
    teamMembers: 'Team Members',
    apiCalls: 'API Calls',
    customIntegrations: 'Custom Integrations',
    priority: 'Priority Support',
    analytics: 'Advanced Analytics',
    customDomain: 'Custom Domain',
    sla: 'SLA Guarantee',
    dedicatedSupport: 'Dedicated Support',
  };

  const label = labels[key] || key;

  if (typeof value === 'boolean') {
    return label;
  } else if (typeof value === 'number') {
    if (value === -1) return `Unlimited ${label}`;
    if (key === 'storage') return `${value}GB ${label}`;
    if (key === 'apiCalls') return `${value.toLocaleString()} ${label}/month`;
    return `${value} ${label}`;
  }
  
  return `${label}: ${value}`;
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.xl,
  },
  periodOption: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    position: 'relative',
  },
  periodOptionActive: {
    backgroundColor: theme.colors.white,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  periodTextActive: {
    color: theme.colors.text,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  saveText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.white,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.text,
  },
  pricePeriod: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  features: {
    marginBottom: theme.spacing.xl,
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
    flex: 1,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    gap: theme.spacing.sm,
  },
  upgradeButton: {
    width: '100%',
  },
  cancelText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
  },
});