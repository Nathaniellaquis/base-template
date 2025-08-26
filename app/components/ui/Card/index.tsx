import React from 'react';
import { View, ViewProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/styles';
import { createCardStyles } from './index.styles';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'compact';
}

export function Card({ 
  children, 
  variant = 'default',
  style,
  ...props 
}: CardProps) {
  const styles = useThemedStyles(createCardStyles);

  const cardStyles = [
    variant === 'default' ? styles.card : styles.cardCompact,
  ];

  return (
    <View style={StyleSheet.flatten([...cardStyles, style]) as StyleProp<ViewStyle>} {...props}>
      {children}
    </View>
  );
}