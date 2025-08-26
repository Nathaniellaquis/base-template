import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { useAuth } from '@/providers/auth';
import { useThemedStyles } from '@/styles';
import { createProfileSetupStyles } from './index.styles';
import { Text, Input } from '@/components/ui';
import { OnboardingLayout } from '@/components/features';
import { trackOnboarding } from '@/lib/analytics/tracking';
import { trpc } from '@/providers/trpc';
import { ConversionEvents, conversionTracker } from '@/lib/experiments/conversion';
import type { User } from '@shared';

export default function ProfileSetupScreen() {
  const { completeAndNavigate } = useOnboardingNavigation();
  const { user, setUser } = useAuth();
  const styles = useThemedStyles(createProfileSetupStyles);
  const utils = trpc.useContext();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const updateUserMutation = trpc.user.update.useMutation({
    onSuccess: (updatedUser: User) => {
      // Update auth provider with returned user data
      if (updatedUser) {
        setUser(updatedUser);
        // Also update React Query cache
        utils.user.get.setData(undefined, updatedUser);
      }
    }
  });
  
  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter your display name');
      return;
    }
    
    setIsLoading(true);
    try {
      // Update user profile first
      await updateUserMutation.mutateAsync({ displayName: displayName.trim() });
      
      // Track profile completion
      trackOnboarding.completeProfile(displayName.trim());
      
      // Track profile creation conversion
      conversionTracker.trackConversion(
        ConversionEvents.PROFILE_CREATED,
        {
          customProperties: {
            hasDisplayName: true,
            step: 'profile_setup',
          }
        },
        user?.uid
      );
      
      // Complete step and navigate to next
      await completeAndNavigate();
    } catch (error: any) {
      console.error('Profile setup error:', error);
      Alert.alert(
        'Error', 
        error?.message || 'Failed to complete setup. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <OnboardingLayout
      buttonTitle="Complete Setup"
      onButtonPress={handleComplete}
      isButtonLoading={isLoading}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text variant="h2" style={styles.title}>
            Set up your profile
          </Text>
          
          <Text variant="body" style={styles.subtitle}>
            Let&apos;s personalize your experience
          </Text>
          
          {/* Display Name Input */}
          <View style={styles.inputContainer}>
            <Input
              label="Display Name"
              placeholder="Enter your name"
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
              maxLength={50}
            />
          </View>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}