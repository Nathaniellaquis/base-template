import React from 'react';
import { FlatList, RefreshControl, View, TouchableOpacity } from 'react-native';
import { useThemedStyles } from '@/styles';
import { useTheme } from '@/providers/theme';
import { createNotificationsListStyles } from './index.styles';
import { Text } from '@/components/ui';
import { EmptyState, LoadingScreen } from '@/components/common';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '@/lib';
import { formatRelativeTime } from '@/utils/formatters';
import type { Notification } from '@shared/types/notification';

export function NotificationsList() {
  const styles = useThemedStyles(createNotificationsListStyles);
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const { data, isLoading, refetch, isRefetching } = trpc.notifications.getNotifications.useQuery(
    {},
    {
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    }
  );
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: (updatedNotification) => {
      // Update cache directly with the returned notification
      utils.notifications.getNotifications.setData(
        {},
        (old) => old ? {
          ...old,
          notifications: old.notifications.map(n => 
            n._id === updatedNotification._id ? updatedNotification : n
          )
        } : old
      );
    },
  });
  
  const handleNotificationPress = (notification: Notification) => {
    if (notification.status !== 'read') {
      markAsRead.mutate({ notificationId: notification._id });
    }
    // Handle navigation based on notification type
    // router.push(...)
  };
  
  // Local render function for notification items
  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = item.category === 'updates' 
      ? 'information-circle-outline' 
      : item.category === 'social' 
      ? 'people-outline'
      : item.category === 'reminders'
      ? 'alarm-outline'
      : 'notifications-outline';
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          item.status !== 'read' && styles.unread
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName as any} size={24} color={theme.colors.textSecondary} />
        </View>
        
        <View style={styles.content}>
          <Text variant="body" style={styles.notificationTitle}>
            {item.title}
          </Text>
          <Text variant="caption" style={styles.notificationBody}>
            {item.body}
          </Text>
          <Text variant="caption" style={styles.timestamp}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        
        {item.status !== 'read' && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return <LoadingScreen message="Loading notifications..." />;
  }
  
  return (
    <FlatList
      style={styles.container}
      data={data?.notifications || []}
      renderItem={renderNotification}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={theme.colors.primary}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="notifications-off-outline" size={64} color="#999" />}
          title="No notifications"
          message="You're all caught up!"
        />
      }
    />
  );
}