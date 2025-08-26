import { Ionicons } from '@expo/vector-icons';
import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/providers/theme';

export default function TabLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  // If not authenticated, go to auth
  if (!user) {
    return <Redirect href="/(auth)" />;
  }
  
  // If not onboarded, go to onboarding
  if (!user.onboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3b82f6',
          headerShown: false,
        }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide the index route from tabs
        }}
      />
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}
