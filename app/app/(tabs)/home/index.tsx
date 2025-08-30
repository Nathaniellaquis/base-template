import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/providers/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { useThemedStyles } from '@/styles';
import { createHomeStyles } from './index.styles';
import { Text, Card, NotificationBadge } from '@/components/ui';
import { NotificationsOverlay } from '@/components/features/notifications';

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const plan = user?.subscription?.plan || 'free';
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const styles = useThemedStyles(createHomeStyles);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Just simulate a refresh for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="body">Loading...</Text>
      </View>
    );
  }

  return (
    <>
      {/* Home Header */}
      <View style={styles.header}>
        <Text variant="h3" style={styles.appName}>INGRD</Text>
        <TouchableOpacity 
          onPress={() => setShowNotifications(true)}
          style={styles.notificationButton}
        >
          <Ionicons 
            name="notifications-outline" 
            size={24} 
            color={theme.colors.textSecondary} 
          />
          {unreadCount > 0 && (
            <NotificationBadge count={unreadCount} size="small" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.dashboardContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={styles.actionButtonText.color}
          />
        }
      >
        <View style={styles.contentContainer}>
        {/* Welcome Section */}
        <Card style={styles.welcomeSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text variant="h2">
                Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
              </Text>
              <Text variant="body">
                Here&apos;s your dashboard overview
              </Text>
            </View>
            <View style={{ 
              backgroundColor: plan === 'free' ? '#6b7280' : plan === 'pro' ? '#667eea' : '#059669', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 6 
            }}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' }}>
                {plan}
              </Text>
            </View>
          </View>
        </Card>

        {/* User Info Card */}
        <Card style={styles.infoSection}>
          <Text variant="h3" style={styles.sectionTitle}>
            Account Information
          </Text>

          <View>
            <View style={styles.infoRow}>
              <Text variant="body">Email</Text>
              <Text variant="body">{user?.email}</Text>
            </View>

            {user?.displayName && (
              <View style={styles.infoRow}>
                <Text variant="body">Display Name</Text>
                <Text variant="body">{user.displayName}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text variant="body">Email Verified</Text>
              <Text 
                variant="body" 
                style={{ 
                  color: user?.emailVerified 
                    ? styles.dashboardContainer.backgroundColor === '#111827' ? '#34D399' : '#10B981'
                    : styles.dashboardContainer.backgroundColor === '#111827' ? '#FBBF24' : '#F59E0B'
                }}
              >
                {user?.emailVerified ? 'Yes' : 'No'}
              </Text>
            </View>

            {user?.role && (
              <View style={styles.infoRow}>
                <Text variant="body">Role</Text>
                <Text variant="body" style={styles.statusText}>{user.role}</Text>
              </View>
            )}

            {user?._id && (
              <View style={styles.infoRowLast}>
                <Text variant="body">Account ID</Text>
                <Text variant="caption">{user._id}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Text variant="h3" style={styles.sectionTitle}>
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
              <TouchableOpacity style={styles.verifyButton}>
                <Text style={styles.verifyButtonText}>Verify Email</Text>
                <Text style={styles.verifyButtonSubtext}>
                  Please verify your email address
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </View>
    </ScrollView>
    
    {/* Notifications Overlay */}
    <NotificationsOverlay 
      visible={showNotifications}
      onClose={() => setShowNotifications(false)}
    />
    </>
  );
}