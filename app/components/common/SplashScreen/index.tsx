import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles, useThemeColors } from '@/styles';
import { createSplashScreenStyles } from './index.styles';
import { Text } from '@/components/ui';

export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useThemedStyles(createSplashScreenStyles);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Smooth fade-in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text variant="h1" style={styles.logo}>INGRD</Text>
        <Text variant="body" style={styles.tagline}>Loading your experience...</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </Animated.View>
    </View>
  );
}