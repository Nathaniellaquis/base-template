import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/providers/auth';
import { TRPCProvider } from '@/providers/trpc';
import { ThemeProvider } from '@/providers/theme';
import { OnboardingProvider } from '@/providers/onboarding';
import { PaymentProvider } from '@/providers/payment';
import { PaymentErrorBoundary } from '@/components/features/payment/PaymentErrorBoundary';
import { AdminProvider } from '@/providers/admin';
import { AnalyticsProvider, useAnalytics } from '@/providers/analytics';
import { SplashScreen, ErrorBoundary, GlobalErrorFallback, NetworkErrorScreen } from '@/components/common';
import { useNotifications } from '@/hooks/useNotifications';
import { initializeCrashReporter, crashReporter } from '@/lib/crash-reporter';
import { setupNotificationHandlers } from '@/lib/notifications/deep-linking';

// Initialize crash reporter before app renders
initializeCrashReporter();

function App() {
  const { isInitialized, user, networkError, retryConnection } = useAuth();
  const { registerForPushNotifications } = useNotifications();
  const { identify } = useAnalytics();
  const router = useRouter();
  const segments = useSegments();
  
  // Set up notification handlers for deep linking
  useEffect(() => {
    const cleanup = setupNotificationHandlers();
    return cleanup;
  }, []);
  
  // Register for push notifications when user is logged in
  useEffect(() => {
    if (user && user.notificationPreferences?.enabled !== false) {
      registerForPushNotifications().catch(console.error);
    }
  }, [user, registerForPushNotifications]);
  
  // Initialize PostHog analytics with user identification
  useEffect(() => {
    if (user && user._id) {
      identify(user._id, {
        email: user.email,
        plan: user.subscription?.plan || 'free',
        onboardingCompleted: user.onboardingCompleted,
      });
    }
  }, [user, identify]);
  
  // Handle initial navigation based on auth state
  useEffect(() => {
    if (!isInitialized) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    
    console.log('[App Layout] Navigation check:', {
      isInitialized,
      hasUser: !!user,
      userId: user?._id,
      onboardingCompleted: user?.onboardingCompleted,
      segments,
      inAuthGroup,
      inOnboardingGroup,
      inTabsGroup
    });
    
    if (!user && !inAuthGroup) {
      // Not authenticated and not in auth screens - redirect to auth
      console.log('[App Layout] Redirecting to auth (no user)');
      router.replace('/(auth)');
    } else if (user && !user.onboardingCompleted && !inOnboardingGroup) {
      // Authenticated but not onboarded - redirect to onboarding
      console.log('[App Layout] Redirecting to onboarding');
      router.replace('/(onboarding)');
    } else if (user && user.onboardingCompleted && (inAuthGroup || inOnboardingGroup)) {
      // Fully authenticated but in auth/onboarding screens - redirect to home
      console.log('[App Layout] Redirecting to home (fully authenticated)');
      router.replace('/(tabs)/home');
    }
  }, [isInitialized, user, segments, router]);
  
  // Show splash screen while checking auth state
  if (!isInitialized) {
    return <SplashScreen />;
  }
  
  // Show network error screen if there's a connection issue
  if (networkError) {
    return <NetworkErrorScreen onRetry={retryConnection} />;
  }
  
  // All routes exist in the tree - navigation guards handle protection
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      {/* All routes are always in the tree */}
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>INGRD</title>
        <meta name="description" content="Full-stack app with React Native and Express" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ErrorBoundary
          fallback={GlobalErrorFallback}
          onError={(error, errorInfo) => {
            // Log to crash reporting service
            crashReporter.captureException(error, {
              errorInfo,
              context: 'global_app_boundary'
            });
          }}
        >
          <ThemeProvider>
            <TRPCProvider>
              <AuthProvider>
                <AnalyticsProvider>
                  <PaymentErrorBoundary>
                    <PaymentProvider>
                      <OnboardingProvider>
                      <AdminProvider>
                        <App />
                        <StatusBar style="auto" />
                      </AdminProvider>
                      </OnboardingProvider>
                    </PaymentProvider>
                  </PaymentErrorBoundary>
                </AnalyticsProvider>
              </AuthProvider>
            </TRPCProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
      <Toast />
    </>
  );
}