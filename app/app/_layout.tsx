import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider, useAuth } from '../providers/auth-provider';
import { TRPCProvider } from '../providers/trpc-provider';
import { SplashScreen } from '../components/SplashScreen';

function RootNavigator() {
  const { isInitialized, user } = useAuth();
  
  // Show splash screen while checking auth
  if (!isInitialized) {
    return <SplashScreen />;
  }
  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          // User is authenticated: Show app with tabs
          <Stack.Screen name="(app)" />
        ) : (
          // User is NOT authenticated: Show auth screens (no tabs)
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
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
      <TRPCProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </TRPCProvider>
    </>
  );
}
