import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/providers/auth';
import { useThemedStyles } from '@/styles';
import { createSignupStyles } from './index.styles';
import { Button, Input, Card } from '@/components/ui';
import { AuthFormLayout } from '@/components/features';
import { showError } from '@/lib/notifications/toast';

export default function SignupScreen() {
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const styles = useThemedStyles(createSignupStyles);

  const handleSignup = async () => {
    if (!email || !password) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      console.log('[Signup] Starting signup process for:', email);
      await signUp(email, password);
      console.log('[Signup] Signup completed successfully');
      // Auth state change will handle navigation
    } catch (error) {
      console.error('[Signup] Signup failed:', error);
      if (error instanceof Error) {
        showError(error);
      } else {
        showError(String(error));
      }
    }
  };

  return (
    <AuthFormLayout
      title="Get Started Free"
      subtitle="Join thousands of users already using INGRD"
      bottomLinks={[
        {
          text: "Already have an account?",
          linkText: "Log In",
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

        <View style={styles.inputContainer}>
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password-new"
          />
        </View>

        <Button
          title="Start Free →"
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
        />
      </Card>
    </AuthFormLayout>
  );
}