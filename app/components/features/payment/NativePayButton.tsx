import { Text } from '@/components/ui/Text';
import { useNativePayment } from '@/hooks/useNativePayment';
import type { BillingPeriod, PlanType } from '@shared';
import { PlatformPay, PlatformPayButton } from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

interface NativePayButtonProps {
  plan: PlanType;
  period: BillingPeriod;
  onSuccess: () => void;
  onError?: (error: string) => void;
  style?: any;
}

export function NativePayButton({
  plan,
  period,
  onSuccess,
  onError,
  style
}: NativePayButtonProps) {
  const { isNativePaySupported, confirmNativePayment, isProcessing } = useNativePayment();

  // Debug logging
  useEffect(() => {
    console.log('[NativePayButton] Component mounted:', {
      platform: Platform.OS,
      isNativePaySupported,
      plan,
      period,
    });
  }, [isNativePaySupported, plan, period]);

  // Show debug info if not supported
  if (!isNativePaySupported) {
    console.log('[NativePayButton] Native pay not supported on this device');
    return null;
  }

  const handlePress = async () => {
    console.log('[NativePayButton] Button pressed:', { plan, period });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await confirmNativePayment(plan, period);
    console.log('[NativePayButton] Payment result:', result);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } else if (result.error && result.error !== 'canceled') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onError?.(result.error);
    }
  };

  if (isProcessing) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  // Determine button type based on platform
  const buttonType = Platform.OS === 'ios'
    ? PlatformPay.ButtonType.Subscribe
    : PlatformPay.ButtonType.Buy; // Google Pay doesn't have Subscribe type

  return (
    <View style={styles.buttonWrapper}>
      <PlatformPayButton
        type={buttonType}
        appearance={PlatformPay.ButtonStyle.Black}
        borderRadius={8}
        onPress={handlePress}
        style={[styles.button, style]}
      />
      {/* Show platform indicator for debugging */}
      {__DEV__ && (
        <Text style={styles.debugText}>
          {Platform.OS === 'ios' ? '🍎 Apple Pay' : '🤖 Google Pay'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: '100%',
  },
  button: {
    minHeight: 50,
    width: '100%',
  },
  loadingContainer: {
    minHeight: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  debugText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});