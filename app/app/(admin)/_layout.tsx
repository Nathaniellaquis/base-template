import { Stack, Redirect } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '@/providers/admin';
import { useTheme } from '@/providers/theme';

export default function AdminLayout() {
  const { isAdmin } = useAdmin();
  const { theme } = useTheme();
  
  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Admin Dashboard',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Send Notification',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="users" 
        options={{ 
          title: 'User Management',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="experiments/index" 
        options={{ 
          title: 'Experiments',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="experiments/[id]" 
        options={{ 
          title: 'Experiment Details',
          headerShown: true 
        }} 
      />
    </Stack>
    </SafeAreaView>
  );
}