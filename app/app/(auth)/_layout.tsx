import { Stack, Redirect } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/providers/theme';

export default function AuthLayout() {
    const { user, isInitialized } = useAuth();
    const { theme } = useTheme();
    
    console.log('[Auth Layout] State:', {
        hasUser: !!user,
        userId: user?._id,
        onboardingCompleted: user?.onboardingCompleted,
        isInitialized
    });
    
    // Wait for initialization to complete before making navigation decisions
    if (!isInitialized) {
        return null; // Don't render anything until we know the auth state
    }
    
    // If user is authenticated, redirect to appropriate screen
    if (user) {
        if (!user.onboardingCompleted) {
            console.log('[Auth Layout] User authenticated but not onboarded - redirecting to onboarding');
            return <Redirect href="/(onboarding)" />;
        }
        console.log('[Auth Layout] User fully authenticated - redirecting to home');
        return <Redirect href="/(tabs)/home" />;
    }
    
    // User not authenticated - show auth screens
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
            <Stack screenOptions={{ 
                headerShown: false,
                animation: 'none'
            }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login/index" />
                <Stack.Screen name="signup/index" />
                <Stack.Screen name="forgot-password/index" />
            </Stack>
        </SafeAreaView>
    );
}