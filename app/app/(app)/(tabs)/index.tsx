import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../providers/auth-provider';
import { colors, combineStyles, commonStyles, createStyles, fontSize, spacing } from '../../../styles';

const styles = createStyles({
  welcomeText: {
    ...commonStyles.heading3,
    marginBottom: spacing.md,
  },
  subtitleText: {
    ...commonStyles.body,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  contentContainer: {
    padding: spacing.lg,
  },
  welcomeCard: {
    ...commonStyles.card,
    marginBottom: spacing.md,
  },
  infoCard: {
    ...commonStyles.card,
    marginBottom: spacing.md,
  },
  infoRow: {
    ...commonStyles.row,
    ...commonStyles.spaceBetween,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    color: colors.gray[900],
    fontWeight: '500',
    fontSize: fontSize.base,
  },
  actionButtonSubtext: {
    color: colors.gray[600],
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  verifyButton: {
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#78350F',
    fontWeight: '500',
    fontSize: fontSize.base,
  },
  verifyButtonSubtext: {
    color: '#C2410C',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  loadingText: {
    ...commonStyles.body,
    color: colors.gray[500],
  },
});

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Just simulate a refresh for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // This screen is protected, user will always be authenticated

  if (authLoading) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.dashboardContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.contentContainer}>
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={commonStyles.heading2}>
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
          </Text>
          <Text style={commonStyles.body}>
            Here&apos;s your dashboard overview
          </Text>
        </View>

        {/* User Info Card */}
        <View style={styles.infoCard}>
          <Text style={[commonStyles.heading3, commonStyles.mb4]}>
            Account Information
          </Text>

          <View>
            <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.gray[100] }]}>
              <Text style={commonStyles.body}>Email</Text>
              <Text style={[commonStyles.body, { color: colors.gray[900] }]}>{user?.email}</Text>
            </View>

            {user?.displayName && (
              <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.gray[100] }]}>
                <Text style={commonStyles.body}>Display Name</Text>
                <Text style={[commonStyles.body, { color: colors.gray[900] }]}>{user.displayName}</Text>
              </View>
            )}

            <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.gray[100] }]}>
              <Text style={commonStyles.body}>Email Verified</Text>
              <Text style={[commonStyles.body, { color: user?.emailVerified ? colors.secondary : colors.warning }]}>
                {user?.emailVerified ? 'Yes' : 'No'}
              </Text>
            </View>

            {user?.role && (
              <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.gray[100] }]}>
                <Text style={commonStyles.body}>Role</Text>
                <Text style={[commonStyles.body, { color: colors.gray[900], textTransform: 'capitalize' }]}>{user.role}</Text>
              </View>
            )}

            {user?._id && (
              <View style={styles.infoRow}>
                <Text style={commonStyles.body}>Account ID</Text>
                <Text style={[commonStyles.bodySmall, { color: colors.gray[500] }]}>{user._id}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.heading3, commonStyles.mb4]}>
            Quick Actions
          </Text>

          <View>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Edit Profile</Text>
              <Text style={styles.actionButtonSubtext}>
                Update your display name and preferences
              </Text>
            </TouchableOpacity>

            {!user?.emailVerified && (
              <TouchableOpacity
                style={styles.verifyButton}
              >
                <Text style={styles.verifyButtonText}>Verify Email</Text>
                <Text style={styles.verifyButtonSubtext}>
                  Please verify your email address
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}