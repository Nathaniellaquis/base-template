import React, { useEffect } from 'react';
import { View, Alert, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemedStyles } from '@/styles';
import { Card, Text, Button } from '@/components/ui';
import { trpc } from '@/lib';
import type { Theme } from '@/types/theme';
import type { ExperimentMetrics, ExperimentConfig, ExperimentVariant } from '@shared';

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.gray[300],
  },
  statusBadgeText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  experimentKey: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: theme.colors.gray[600],
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  variantCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  variantKey: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.gray[600],
  },
  variantWeight: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  defaultBadge: {
    backgroundColor: theme.colors.info,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: theme.colors.white,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  metricVariant: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  configLabel: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  configValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
});

// Local component for variant metrics
const VariantMetrics = ({ 
  variant, 
  metrics 
}: { 
  variant: string; 
  metrics?: ExperimentMetrics;
}) => {
  const styles = useThemedStyles(createStyles);
  
  if (!metrics) {
    return (
      <Text style={{ fontSize: 14, color: styles.metricLabel.color }}>
        No data yet
      </Text>
    );
  }
  
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>
            {metrics.impressions}
          </Text>
          <Text style={{ fontSize: 12, color: styles.metricLabel.color }}>
            impressions
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>
            {metrics.conversions}
          </Text>
          <Text style={{ fontSize: 12, color: styles.metricLabel.color }}>
            conversions
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>
            {metrics.conversionRate.toFixed(2)}%
          </Text>
          <Text style={{ fontSize: 12, color: styles.metricLabel.color }}>
            conversion rate
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function ExperimentDetails() {
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Get experiment details
  const { data: experiment, refetch } = trpc.experiments.getExperiment.useQuery({
    experimentId: id,
  }) as { data: (ExperimentConfig & { _id: string; metrics?: ExperimentMetrics[] }) | undefined; refetch: () => void };
  
  // Update experiment mutation
  // const updateExperiment = trpc.experiments.updateExperiment.useMutation();
  const toggleStatus = trpc.experiments.updateExperimentStatus.useMutation();
  
  useEffect(() => {
    if (toggleStatus.isSuccess) {
      Alert.alert('Success', 'Experiment status updated');
      refetch();
    }
    if (toggleStatus.isError) {
      Alert.alert('Error', toggleStatus.error?.message || 'Failed to update status');
    }
  }, [toggleStatus.isSuccess, toggleStatus.isError, toggleStatus.error?.message, refetch]);
  
  const handleToggleStatus = () => {
    if (!experiment) return;
    
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${experiment.isActive ? 'deactivate' : 'activate'} this experiment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => toggleStatus.mutate({ 
            experimentId: id, 
            isActive: !experiment.isActive 
          }),
        },
      ]
    );
  };
  
  const handleResetData = () => {
    Alert.alert(
      'Reset Experiment Data',
      'This will clear all metrics for this experiment. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Data reset functionality coming soon');
          }
        },
      ]
    );
  };
  
  if (!experiment) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  // Calculate overall metrics
  const overallMetrics = experiment.metrics?.reduce((acc, m) => ({
    impressions: acc.impressions + m.impressions,
    conversions: acc.conversions + m.conversions,
    conversionRate: 0, // Will calculate below
    value: acc.value + (m.averageValue || 0) * m.conversions,
  }), { impressions: 0, conversions: 0, conversionRate: 0, value: 0 });
  
  if (overallMetrics && overallMetrics.impressions > 0) {
    overallMetrics.conversionRate = (overallMetrics.conversions / overallMetrics.impressions) * 100;
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>{experiment.name}</Text>
            <View style={[styles.statusBadge, !experiment.isActive && styles.inactiveBadge]}>
              <Text style={styles.statusBadgeText}>
                {experiment.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
          <Text style={styles.experimentKey}>{experiment.key}</Text>
          {experiment.description && (
            <Text style={styles.description}>{experiment.description}</Text>
          )}
        </View>
        
        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Card style={styles.card}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Traffic Allocation</Text>
              <Text style={styles.configValue}>
                {experiment.trafficAllocation?.type || 'random'}
              </Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Start Date</Text>
              <Text style={styles.configValue}>
                {experiment.startDate 
                  ? new Date(experiment.startDate).toLocaleDateString()
                  : 'Not set'}
              </Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>End Date</Text>
              <Text style={styles.configValue}>
                {experiment.endDate 
                  ? new Date(experiment.endDate).toLocaleDateString()
                  : 'Not set'}
              </Text>
            </View>
            <View style={[styles.configRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.configLabel}>Default Variant</Text>
              <Text style={styles.configValue}>{experiment.defaultVariant}</Text>
            </View>
          </Card>
        </View>
        
        {/* Overall Metrics */}
        {overallMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Performance</Text>
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard}>
                <Text style={styles.metricValue}>{overallMetrics.impressions}</Text>
                <Text style={styles.metricLabel}>Total Impressions</Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricValue}>{overallMetrics.conversions}</Text>
                <Text style={styles.metricLabel}>Total Conversions</Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {overallMetrics.conversionRate.toFixed(2)}%
                </Text>
                <Text style={styles.metricLabel}>Overall Conversion Rate</Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  ${overallMetrics.value.toFixed(2)}
                </Text>
                <Text style={styles.metricLabel}>Total Value</Text>
              </Card>
            </View>
          </View>
        )}
        
        {/* Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variants</Text>
          {experiment.variants.map((variant: ExperimentVariant) => {
            const variantMetrics = experiment.metrics?.find(m => m.variant === variant.key);
            return (
              <Card key={variant.key} style={styles.variantCard}>
                <View style={styles.variantHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.variantName}>{variant.name}</Text>
                      {variant.key === experiment.defaultVariant && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.variantKey}>{variant.key}</Text>
                  </View>
                  <Text style={styles.variantWeight}>
                    {variant.weight || 0}%
                  </Text>
                </View>
                {variant.description && (
                  <Text style={{ fontSize: 14, color: styles.description.color, marginBottom: 8 }}>
                    {variant.description}
                  </Text>
                )}
                <VariantMetrics variant={variant.key} metrics={variantMetrics} />
              </Card>
            );
          })}
        </View>
        
        {/* Actions */}
        <View style={styles.actionButtons}>
          <Button
            title={experiment.isActive ? 'Deactivate' : 'Activate'}
            variant={experiment.isActive ? 'danger' : 'primary'}
            onPress={handleToggleStatus}
            disabled={toggleStatus.isPending}
            style={styles.actionButton}
          />
          <Button
            title="Edit Experiment"
            variant="secondary"
            onPress={() => {
              Alert.alert('Coming Soon', 'Edit functionality coming soon');
            }}
            style={styles.actionButton}
          />
        </View>
        
        <Button
          title="Reset Experiment Data"
          variant="danger"
          onPress={handleResetData}
          style={{ marginTop: 16 }}
        />
      </View>
    </ScrollView>
  );
}