import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { useThemedStyles, useThemeColors } from '@/styles';
import { createWelcomeStyles } from './index.styles';
import { Text } from '@/components/ui';
import { OnboardingLayout } from '@/components/features';
import { trackOnboarding } from '@/lib/analytics/tracking';

export default function WelcomeScreen() {
  const { completeAndNavigate } = useOnboardingNavigation();
  const styles = useThemedStyles(createWelcomeStyles);
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    trackOnboarding.viewWelcome();
  }, []);
  
  const handleNext = async () => {
    setIsLoading(true);
    try {
      await completeAndNavigate();
    } catch (error) {
      console.error('Failed to complete onboarding step:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <OnboardingLayout
      buttonTitle="Get Started"
      onButtonPress={handleNext}
      isButtonLoading={isLoading}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Ionicons 
            name="rocket" 
            size={80} 
            color={colors.primary} 
            style={styles.icon}
          />
          
          <Text variant="h1" style={styles.title}>
            Welcome to Ingrd!
          </Text>
          
          <Text variant="body" style={styles.subtitle}>
            Let&apos;s get you set up in just a few quick steps. 
            This will only take a minute.
          </Text>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}