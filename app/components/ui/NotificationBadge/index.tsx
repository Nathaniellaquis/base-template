import React from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useThemedStyles } from '@/styles';
import { createNotificationBadgeStyles } from './index.styles';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export function NotificationBadge({ 
  count, 
  size = 'medium' 
}: NotificationBadgeProps) {
  const styles = useThemedStyles(createNotificationBadgeStyles);
  
  if (count <= 0) return null;
  
  return (
    <View style={[
      styles.badge,
      styles[size]
    ]}>
      <Text variant="caption" style={styles.text}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
}