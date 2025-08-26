import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useThemedStyles } from '@/styles';
import { Theme } from '@/types/theme';
import { type PlanType } from '@shared';

interface PlanBadgeProps {
  plan: PlanType;
  size?: 'small' | 'medium' | 'large';
}

export function PlanBadge({ plan, size = 'medium' }: PlanBadgeProps) {
  const styles = useThemedStyles(createStyles);
  
  if (plan === 'free') return null;
  
  const sizeStyles = {
    small: styles.smallBadge,
    medium: styles.mediumBadge,
    large: styles.largeBadge,
  };
  
  const colorStyles = {
    basic: styles.basicBadge,
    pro: styles.proBadge,
    enterprise: styles.enterpriseBadge,
  };
  
  return (
    <View style={[styles.planBadge, sizeStyles[size], colorStyles[plan]]}>
      <Text style={[styles.planBadgeText, sizeStyles[size]]}>{plan.toUpperCase()}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  planBadge: {
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start' as const,
  },
  
  // Size variants
  smallBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  mediumBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  largeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  // Color variants
  basicBadge: {
    backgroundColor: theme.colors.primaryLight,
  },
  proBadge: {
    backgroundColor: theme.colors.secondary,
  },
  enterpriseBadge: {
    backgroundColor: theme.colors.warning,
  },
  
  // Text styles
  planBadgeText: {
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  smallBadgeText: {
    fontSize: 10,
  },
  mediumBadgeText: {
    fontSize: 12,
  },
  largeBadgeText: {
    fontSize: 14,
  },
});