import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { Text } from '@/components/ui';
import { OnboardingLayout } from '@/components/features';
import { trackOnboarding } from '@/lib/analytics/tracking';
import { useThemedStyles } from '@/styles';
import { createStyles } from './index.styles';

const valuePoints = [
  {
    icon: '🚀',
    title: 'Scale Your Business',
    description: 'Access powerful tools that grow with your needs'
  },
  {
    icon: '⚡',
    title: 'Save 10+ Hours Weekly',
    description: 'Automate repetitive tasks and focus on what matters'
  },
  {
    icon: '📈',
    title: 'Increase Revenue by 40%',
    description: 'Join thousands of teams seeing real results'
  }
];

export default function ValueRecap() {
  const { completeAndNavigate } = useOnboardingNavigation();
  const styles = useThemedStyles(createStyles);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    trackOnboarding.viewValueRecap();
  }, [])
  
  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await completeAndNavigate();
    } catch (error) {
      console.error('Failed to complete value recap step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      buttonTitle="View Pricing Plans"
      onButtonPress={handleContinue}
      isButtonLoading={isLoading}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="h2" style={styles.title}>
            You&apos;re Almost There!
          </Text>
          
          <Text variant="body" style={styles.subtitle}>
            Here&apos;s what you&apos;ll unlock:
          </Text>

          {/* Value Points */}
          <View style={styles.valueContainer}>
            {valuePoints.map((point, index) => (
              <View key={index} style={styles.valueCard}>
                <Text style={styles.valueIcon}>{point.icon}</Text>
                <View style={styles.valueTextContainer}>
                  <Text style={styles.valueTitle}>{point.title}</Text>
                  <Text style={styles.valueDescription}>{point.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Social Proof */}
          <View style={styles.socialProofContainer}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>10,000+</Text>
                <Text style={styles.statLabel}>Active Teams</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>4.9/5</Text>
                <Text style={styles.statLabel}>User Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>99.9%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
            </View>
          </View>

          {/* Guarantee Text */}
          <Text style={styles.guaranteeText}>
            30-day money-back guarantee
          </Text>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}