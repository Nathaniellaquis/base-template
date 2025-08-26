import React from 'react';
import {
  View,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Text } from '@/components/ui';
import { useThemedStyles, useThemeColors } from '@/styles';
import { createGlobalErrorFallbackStyles } from './index.styles';

interface GlobalErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function GlobalErrorFallback({ 
  error, 
  resetError 
}: GlobalErrorFallbackProps) {
  const isDev = __DEV__;
  const styles = useThemedStyles(createGlobalErrorFallbackStyles);
  const colors = useThemeColors();
  
  const handleContactSupport = () => {
    Linking.openURL(`mailto:support@app.com?subject=Error: ${error.message}`);
  };

  const handleGoHome = () => {
    resetError();
    router.replace('/');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
        </View>
        
        <Text variant="h2" style={styles.title}>
          Oops! Something went wrong
        </Text>
        
        <Text variant="body" style={styles.message}>
          We're sorry for the inconvenience. Please try again or contact support if the problem persists.
        </Text>
        
        {isDev && (
          <View style={styles.errorDetails}>
            <Text variant="body" style={styles.errorName}>
              {error.name}
            </Text>
            <Text variant="bodySmall" style={styles.errorMessage}>
              {error.message}
            </Text>
            <ScrollView style={styles.stackContainer}>
              <Text variant="caption" style={styles.stack}>
                {error.stack}
              </Text>
            </ScrollView>
          </View>
        )}
        
        <View style={styles.actions}>
          <Button
            title="Try Again"
            onPress={resetError}
            variant="primary"
          />
          
          <Button
            title="Go Home"
            onPress={handleGoHome}
            variant="secondary"
          />
          
          {!isDev && (
            <Button
              title="Contact Support"
              onPress={handleContactSupport}
              variant="outline"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}