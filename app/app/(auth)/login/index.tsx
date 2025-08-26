import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/providers/auth';
import { useThemedStyles } from '@/styles';
import { createLoginStyles } from './index.styles';
import { Button, Input, Card } from '@/components/ui';
import { AuthFormLayout } from '@/components/features';
import { showError } from '@/lib/notifications/toast';
import { handleError } from '@/utils/error-handler';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const styles = useThemedStyles(createLoginStyles);

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    try {
      await signIn(email, password);
      // Navigation will be handled by auth state change
    } catch (error) {
      handleError(error, 'Login failed');
    }
  };

  return (
    <AuthFormLayout
      title="Welcome Back"
      subtitle="Sign in to continue"
      bottomLinks={[
        {
          text: "Don't have an account?",
          linkText: "Sign Up",
          href: "/signup",
        },
        {
          text: "Forgot password?",
          linkText: "Reset",
          href: "/forgot-password",
        },
      ]}
    >
      <Card style={styles.formCard}>
        <View style={styles.inputContainer}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
        />
      </Card>
    </AuthFormLayout>
  );
}