import React from 'react';
import { View } from 'react-native';
import { PaymentSelection } from './PaymentSelection';
import { type PlanType, type BillingPeriod } from '@shared';

interface EnhancedPaymentFormProps {
  plan: PlanType;
  period: BillingPeriod;
  onSuccess?: () => void;
  onCancel?: () => void;
  showSaveCard?: boolean;
}

export function EnhancedPaymentForm({ 
  plan, 
  period, 
  onSuccess, 
  onCancel,
}: EnhancedPaymentFormProps) {
  // Handle free plan edge case
  if (plan === 'free') {
    return null;
  }
  
  // Use the unified PaymentSelection component
  return (
    <View style={{ flex: 1 }}>
      <PaymentSelection
        plan={plan}
        period={period}
        onSuccess={onSuccess || (() => {})}
        onError={(error) => {
          console.error('Payment error:', error);
        }}
      />
    </View>
  );
}