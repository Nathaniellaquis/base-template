import { Button, Card, Input, Text } from '@/components/ui';
import { trpc } from '@/lib';
import { useThemedStyles } from '@/styles';
import type { Theme } from '@/types/theme';
import type { ExperimentConfig, ExperimentMetrics } from '@shared';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, View } from 'react-native';

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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.gray[600],
  },
  searchContainer: {
    marginBottom: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  experimentCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  experimentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  experimentInfo: {
    flex: 1,
  },
  experimentName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  experimentKey: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  experimentDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.gray[300],
  },
  statusBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  variantsContainer: {
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingTop: theme.spacing.sm,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  variantName: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  variantWeight: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginRight: theme.spacing.sm,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  metricItem: {
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  createButton: {
    marginBottom: theme.spacing.lg,
  },
});

// Local component for experiment metrics
const ExperimentMetricsView = ({ metrics }: { metrics?: ExperimentMetrics[] }) => {
  const styles = useThemedStyles(createStyles);

  if (!metrics || metrics.length === 0) {
    return null;
  }

  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
  const overallConversionRate = totalImpressions > 0
    ? ((totalConversions / totalImpressions) * 100).toFixed(2)
    : '0.00';

  return (
    <View style={styles.metricsContainer}>
      <View style={styles.metricItem}>
        <Text style={styles.metricValue}>{totalImpressions}</Text>
        <Text style={styles.metricLabel}>Impressions</Text>
      </View>
      <View style={styles.metricItem}>
        <Text style={styles.metricValue}>{totalConversions}</Text>
        <Text style={styles.metricLabel}>Conversions</Text>
      </View>
      <View style={styles.metricItem}>
        <Text style={styles.metricValue}>{overallConversionRate}%</Text>
        <Text style={styles.metricLabel}>Conversion Rate</Text>
      </View>
    </View>
  );
};

export default function AdminExperiments() {
  const styles = useThemedStyles(createStyles);
  // const { user } = useAuth();
  const [search, setSearch] = useState('');

  // Get experiments list
  const { data: experimentsData, refetch } = trpc.experiments.listExperiments.useQuery({
    search: search || undefined,
  });

  // Toggle experiment status mutation
  const toggleExperiment = trpc.experiments.updateExperimentStatus.useMutation();

  useEffect(() => {
    if (toggleExperiment.isSuccess) {
      Alert.alert('Success', 'Experiment status updated');
      refetch();
    }
    if (toggleExperiment.isError) {
      Alert.alert('Error', toggleExperiment.error?.message || 'Failed to update experiment');
    }
  }, [toggleExperiment.isSuccess, toggleExperiment.isError, toggleExperiment.error?.message, refetch]);

  const handleToggleExperiment = (experimentId: string, currentStatus: boolean) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this experiment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => toggleExperiment.mutate({
            experimentId,
            isActive: !currentStatus
          }),
        },
      ]
    );
  };

  const renderExperiment = ({ item }: { item: any }) => {
    return (
      <Card style={styles.experimentCard}>
        <View style={styles.experimentHeader}>
          <View style={styles.experimentInfo}>
            <Text style={styles.experimentName}>{item.name}</Text>
            <Text style={styles.experimentKey}>{item.key}</Text>
            {item.description && (
              <Text style={styles.experimentDescription}>{item.description}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, !item.isActive && styles.inactiveBadge]}>
            <Text style={styles.statusBadgeText}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* Variants */}
        <View style={styles.variantsContainer}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            Variants ({item.variants.length})
          </Text>
          {item.variants.map((variant: any, index: number) => (
            <View key={variant.key} style={styles.variantRow}>
              <Text style={styles.variantName}>
                {variant.name} {variant.key === item.defaultVariant && '(default)'}
              </Text>
              {variant.weight !== undefined && (
                <Text style={styles.variantWeight}>{variant.weight}%</Text>
              )}
            </View>
          ))}
        </View>

        {/* Metrics */}
        <ExperimentMetricsView metrics={item.metrics} />

        {/* Actions */}
        <View style={styles.actionButtons}>
          <Button
            title={item.isActive ? 'Deactivate' : 'Activate'}
            variant={item.isActive ? 'danger' : 'primary'}
            size="small"
            onPress={() => handleToggleExperiment(item._id, item.isActive)}
            disabled={toggleExperiment.isPending}
            style={styles.actionButton}
          />
          <Button
            title="View Details"
            variant="secondary"
            size="small"
            onPress={() => {
              // Navigate to experiment details
              // router.push(`/experiments/${item._id}`);
            }}
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  // Calculate stats
  const stats = {
    total: experimentsData?.experiments.length || 0,
    active: experimentsData?.experiments.filter((e: any) => e.isActive).length || 0,
    totalImpressions: experimentsData?.experiments.reduce((sum: number, e: any) =>
      sum + (e.metrics?.reduce((s: number, m: any) => s + m.impressions, 0) || 0), 0
    ) || 0,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Experiments Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Manage A/B tests and feature rollouts
          </Text>
        </View>

        {/* Create New Button */}
        <Button
          title="Create New Experiment"
          variant="primary"
          onPress={() => {
            Alert.alert('Coming Soon', 'Experiment creation UI coming soon');
          }}
          style={styles.createButton}
        />

        {/* Search */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search experiments by name or key..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Experiments</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalImpressions}</Text>
            <Text style={styles.statLabel}>Total Impressions</Text>
          </Card>
        </View>

        {/* Experiments List */}
        <FlatList
          data={experimentsData?.experiments || []}
          renderItem={renderExperiment}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          ListEmptyComponent={
            <Card style={{ padding: 32, alignItems: 'center' }}>
              <Text variant="body">No experiments found</Text>
            </Card>
          }
        />
      </View>
    </ScrollView>
  );
}