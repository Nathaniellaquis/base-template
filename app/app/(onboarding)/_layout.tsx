import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/providers/theme';

export default function OnboardingLayout() {
  const { user, isInitialized } = useAuth();
  const { theme } = useTheme();
  
  console.log('[Onboarding Layout] State:', {
    hasUser: !!user,
    userId: user?._id,
    onboardingCompleted: user?.onboardingCompleted,
    isInitialized
  });
  
  // Wait for initialization
  if (!isInitialized) {
    return null;
  }
  
  // If not authenticated, go to auth
  if (!user) {
    console.log('[Onboarding Layout] No user - redirecting to auth');
    return <Redirect href="/(auth)" />;
  }
  
  // If already onboarded, go to main app
  if (user.onboardingCompleted) {
    console.log('[Onboarding Layout] User already onboarded - redirecting to home');
    return <Redirect href="/(tabs)/home" />;
  }
  
  // User is authenticated but not onboarded - show onboarding screens
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}