import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/auth';
import { useThemedStyles } from '@/styles';
import { createForgotPasswordStyles } from './index.styles';
import { Button, Input, Card } from '@/components/ui';
import { AuthFormLayout } from '@/components/features';
import { showError, showSuccess } from '@/lib/notifications/toast';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const styles = useThemedStyles(createForgotPasswordStyles);

  const handleResetPassword = async () => {
    if (!email) {
      showError('Please enter your email');
      return;
    }

    try {
      await resetPassword(email);
      showSuccess('Password Reset Email Sent', 'Check your email for instructions');
      setTimeout(() => router.back(), 2000);
    } catch (error) {
      if (error instanceof Error) {
        showError(error);
      } else {
        showError(String(error));
      }
    }
  };

  return (
    <AuthFormLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you instructions to reset your password."
      bottomLinks={[
        {
          text: "Remember your password?",
          linkText: "Back to Login",
          href: "/login",
        },
      ]}
    >
      <Card style={styles.formCard}>
        <View style={styles.inputContainer}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <Button
          title="Send Reset Email"
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
        />
      </Card>
    </AuthFormLayout>
  );
}