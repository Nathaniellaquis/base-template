import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/styles';
import { createEmptyStateStyles } from './index.styles';
import { Text, Button } from '@/components/ui';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  message, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  const styles = useThemedStyles(createEmptyStateStyles);
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text variant="h3" style={styles.title}>{title}</Text>
      {message && (
        <Text variant="body" style={styles.message}>{message}</Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}