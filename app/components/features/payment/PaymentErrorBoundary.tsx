import React, { Component, ReactNode } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Payment Error:', error, errorInfo);
    
    // You could send this to your error tracking service
    // Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Please email support@ingrd.com with error code: PAY_ERR_001',
      [{ text: 'OK' }]
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-red-50 rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-2xl font-bold text-red-900 mb-2">
              Payment Error
            </Text>
            <Text className="text-red-700 mb-4">
              We encountered an issue with the payment system. This has been logged and our team will investigate.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View className="bg-red-100 rounded-lg p-3 mb-4">
                <Text className="text-xs text-red-800 font-mono">
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <View className="space-y-3">
              <Button
                title="Try Again"
                onPress={this.handleReset}
                className="bg-red-600"
              />
              
              <TouchableOpacity
                onPress={this.handleContactSupport}
                className="py-2"
              >
                <Text className="text-center text-red-700 font-medium">
                  Contact Support
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}