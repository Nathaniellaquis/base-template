import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useNativePayment } from '@/hooks/useNativePayment';
import { useThemedStyles } from '@/styles';
import { Theme } from '@/types/theme';
import { type BillingPeriod, type PlanType, PRICING } from '@shared';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { NativePayButton } from './NativePayButton';

interface PaymentSelectionProps {
  plan: PlanType;
  period: BillingPeriod;
  onSuccess: () => void;
  onError: (error: string) => void;
  showSaveCard?: boolean;
}

export function PaymentSelection({
  plan,
  period,
  onSuccess,
  onError,
  showSaveCard = false,
}: PaymentSelectionProps) {
  const styles = useThemedStyles(createStyles);
  const { isNativePaySupported, confirmSubscription, isProcessing } = useNativePayment();
  const [isLoading, setIsLoading] = useState(false);

  const price = PRICING[plan as Exclude<PlanType, 'free'>]?.[period] || 0;

  // Smart button text based on available payment methods and platform
  const getSmartButtonText = () => {
    if (Platform.OS !== 'web' && isNativePaySupported) {
      // Mobile with native pay - button is for card fallback
      return 'Pay with Card';
    }

    if (Platform.OS === 'web') {
      // Web - show available methods
      return 'Complete Subscription';
    }

    // Fallback
    return 'Subscribe Now';
  };

  const handlePaymentSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSuccess();
  };

  const handlePaymentError = (error: string) => {
    if (error !== 'canceled') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment Error', error);
    }
    onError(error);
  };

  const handleCardPayment = async () => {
    setIsLoading(true);
    try {
      const result = await confirmSubscription(plan, period);
      if (result.success) {
        handlePaymentSuccess();
      } else if (result.error) {
        handlePaymentError(result.error);
      }
    } catch (error) {
      handlePaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  // On mobile platforms with native pay support, show native pay button
  if (Platform.OS !== 'web' && isNativePaySupported) {
    return (
      <View style={styles.container}>
        <NativePayButton
          plan={plan}
          period={period}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <Button
          title={getSmartButtonText()}
          onPress={handleCardPayment}
          variant="secondary"
          loading={isLoading || isProcessing}
          disabled={isLoading || isProcessing}
        />
      </View>
    );
  }

  // On web or when native pay is not supported, show card payment only
  return (
    <View style={styles.container}>
      <Button
        title={getSmartButtonText()}
        onPress={handleCardPayment}
        variant="primary"
        loading={isLoading || isProcessing}
        disabled={isLoading || isProcessing}
      />

      {showSaveCard && (
        <Text style={styles.saveCardNote}>
          Your card will be saved for future purchases
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[300],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.gray[500],
    fontSize: 14,
  },
  saveCardNote: {
    textAlign: 'center',
    color: theme.colors.gray[600],
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
});