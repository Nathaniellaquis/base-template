import React from 'react';
import { ScrollView, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTypedRouter } from '@/hooks/useTypedRouter';
import { useAdmin } from '@/providers/admin';
import { useAuth } from '@/providers/auth';
import { useThemedStyles } from '@/styles';
import { Card, Text, Button } from '@/components/ui';

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.sm,
  },
  statCard: {
    width: '50%',
    padding: theme.spacing.sm,
  },
  statContent: {
    padding: theme.spacing.md,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
});

export default function AdminDashboard() {
  const router = useTypedRouter();
  const { stats, isLoading, refreshStats } = useAdmin();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  
  const plan = user?.subscription?.plan || 'free';
  
  if (isLoading && !stats) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  const StatCard = ({ number, label }: { number: number; label: string }) => (
    <View style={styles.statCard}>
      <Card style={styles.statContent}>
        <Text style={styles.statNumber}>{number.toLocaleString()}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card>
    </View>
  );
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard number={stats?.totalUsers || 0} label="Total Users" />
          <StatCard number={stats?.activeUsers || 0} label="Active (7d)" />
          <StatCard number={stats?.totalNotifications || 0} label="Total Notifs" />
          <StatCard number={stats?.notificationsSentToday || 0} label="Sent Today" />
        </View>
        
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <Button
            title="Send Test Notification"
            onPress={() => router.push('/(admin)/notifications' as any)}
            style={styles.actionButton}
          />
          
          <Button
            title="Manage Users"
            onPress={() => router.push('/(admin)/users' as any)}
            variant="secondary"
            style={styles.actionButton}
          />
          
          <Button
            title="Experiments Dashboard"
            onPress={() => router.push('/(admin)/experiments/' as any)}
            variant="secondary"
            style={styles.actionButton}
          />
          
          <Button
            title="Refresh Stats"
            onPress={refreshStats}
            variant="outline"
          />
        </View>
        
        {/* Admin Info */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: styles.sectionTitle.marginBottom }}>
            <Text style={styles.sectionTitle}>Admin Access</Text>
            <View style={{ backgroundColor: '#667eea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>{plan}</Text>
            </View>
          </View>
          <Card style={styles.statContent}>
            <Text variant="body">
              You have full admin access. Use responsibly.
            </Text>
            <Text variant="caption" style={{ marginTop: 8 }}>
              All admin actions are logged for security.
            </Text>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}