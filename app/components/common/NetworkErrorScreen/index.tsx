import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, Text } from '@/components/ui';
import { useThemedStyles } from '@/styles';
import { createStyles } from './index.styles';

interface NetworkErrorScreenProps {
  onRetry: () => Promise<void>;
  autoRetry?: boolean;
  errorMessage?: string;
}

export function NetworkErrorScreen({ 
  onRetry, 
  autoRetry = true,
  errorMessage
}: NetworkErrorScreenProps) {
  // Determine the appropriate message
  const message = errorMessage || (
    navigator.onLine 
      ? "Unable to Connect to Server" 
      : "No Internet Connection"
  );
  const styles = useThemedStyles(createStyles);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);

  // Auto-retry logic with exponential backoff
  useEffect(() => {
    if (!autoRetry || isRetrying) return;

    // Calculate next retry delay: 5s, 10s, 20s, 30s, then stop
    const delays = [5, 10, 20, 30];
    const delay = delays[Math.min(retryCount, delays.length - 1)];
    
    if (retryCount >= delays.length) {
      // Stop auto-retry after max attempts
      setNextRetryIn(null);
      return;
    }

    setNextRetryIn(delay);
    const interval = setInterval(() => {
      setNextRetryIn(prev => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      handleRetry();
    }, delay * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [retryCount, autoRetry, isRetrying]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setNextRetryIn(null);
    
    try {
      await onRetry();
      // If successful, reset retry count
      setRetryCount(0);
    } catch (error) {
      // Increment retry count on failure
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons 
          name="signal-wifi-off" 
          size={80} 
          color={styles.icon.color} 
        />
        
        <Text variant="h2" style={styles.title}>
          {message}
        </Text>
        
        <Text variant="body" style={styles.description}>
          {navigator.onLine 
            ? "The server might be down or undergoing maintenance. Please try again later."
            : "Please check your internet connection and try again"
          }
        </Text>

        {nextRetryIn !== null && (
          <Text variant="caption" style={styles.retryText}>
            Retrying in {nextRetryIn}s...
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={isRetrying ? "Retrying..." : "Try Again"}
            onPress={handleRetry}
            disabled={isRetrying}
            size="large"
            style={styles.button}
          />
        </View>

        {isRetrying && (
          <ActivityIndicator 
            size="small" 
            color={styles.loadingIndicator.color}
            style={styles.loadingIndicator}
          />
        )}
      </View>
    </View>
  );
}