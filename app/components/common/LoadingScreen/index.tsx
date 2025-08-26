import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useThemedStyles, useThemeColors } from '@/styles';
import { createLoadingScreenStyles } from './index.styles';
import { Text } from '@/components/ui';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createLoadingScreenStyles);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text variant="body" style={styles.messageText}>
        {message}
      </Text>
    </View>
  );
}