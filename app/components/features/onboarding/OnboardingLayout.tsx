import { Button, Text } from '@/components/ui';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useThemedStyles } from '@/styles';
import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, View } from 'react-native';
import { createStyles } from './OnboardingLayout.styles';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  buttonTitle?: string;
  onButtonPress: () => void | Promise<void>;
  isButtonLoading?: boolean;
  hideButton?: boolean;
  customButton?: React.ReactNode;
  hideProgress?: boolean;
}

export function OnboardingLayout({
  children,
  buttonTitle = 'Continue',
  onButtonPress,
  isButtonLoading = false,
  hideButton = false,
  customButton,
  hideProgress = false,
}: OnboardingLayoutProps) {
  const { currentStep, totalSteps } = useOnboarding();
  const styles = useThemedStyles(createStyles);

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Fixed Progress Bar at Top */}
        {!hideProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.stepText}>
              Step {currentStep + 1} of {totalSteps}
            </Text>
          </View>
        )}

        {/* Scrollable Content Area */}
        <View style={styles.contentContainer}>
          {children}
        </View>

        {/* Sticky Bottom Button */}
        {!hideButton && (
          <View style={styles.bottomContainer}>
            <View style={styles.buttonWrapper}>
              {customButton || (
                <Button
                  title={buttonTitle}
                  onPress={onButtonPress}
                  loading={isButtonLoading}
                  size="large"
                />
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}