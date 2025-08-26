# Notification Preferences UI Completion Gameplan

## Overview
The notification system backend and preferences management are fully implemented. The main missing component is a user-facing notification center where users can view and interact with their notifications.

## Current State Summary

### ✅ Already Implemented
- Complete backend API with all endpoints
- Push notification registration and handling
- Notification preferences UI in settings
- Admin notification testing tools
- Multi-device push token support
- Permission handling flow
- MongoDB schema and indexing

### ❌ Missing Components
- User notification center/inbox
- Notification badges and counters
- Deep linking from notifications
- In-app notification toasts
- Web push notifications (mobile-only by design)

## Implementation Plan

### Phase 1: Notification Center UI (Priority: Critical)

#### 1.1 Create Notifications Tab
**Following Tab Structure Pattern:**

```
app/app/(tabs)/notifications/
├── index.tsx                      # Main notification list screen
├── index.styles.ts               # Screen styles
└── _layout.tsx                   # Stack navigator (if needed for details)
```

**Implementation Following Screen Pattern:**
```typescript
// app/app/(tabs)/notifications/index.tsx
import React from 'react';
import { SafeAreaView, FlatList, RefreshControl, View, TouchableOpacity } from 'react-native';
import { useThemedStyles } from '@/styles';
import { createNotificationsStyles } from './index.styles';
import { Text, EmptyState, LoadingScreen } from '@/components';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '@/lib/api';
import { formatRelativeTime } from '@/utils/format';
import type { Notification } from '@shared/types/notification';

export default function NotificationsScreen() {
  const styles = useThemedStyles(createNotificationsStyles);
  const utils = trpc.useUtils();
  const { data: notifications, isLoading, refetch, isRefetching } = trpc.notifications.getNotifications.useQuery();
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: (updatedNotification) => {
      // Update cache directly
      utils.notifications.getNotifications.setData(
        undefined,
        (old) => old?.map(n => 
          n._id === updatedNotification._id ? updatedNotification : n
        )
      );
    },
  });
  
  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate({ id: notification._id });
    }
    // Handle navigation based on notification type
    // router.push(...)
  };
  
  // Local render function for notification items
  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = item.category === 'payment' 
      ? 'card-outline' 
      : item.category === 'social' 
      ? 'people-outline'
      : 'notifications-outline';
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !item.read && styles.unread
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color={styles.iconColor} />
        </View>
        
        <View style={styles.content}>
          <Text variant="body" weight="semibold">
            {item.title}
          </Text>
          <Text variant="caption" color="secondary">
            {item.body}
          </Text>
          <Text variant="caption" color="tertiary">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        
        {!item.read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };
  
  // Group notifications by date
  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text variant="caption" color="secondary">
        {section.title}
      </Text>
    </View>
  );
  
  if (isLoading) {
    return <LoadingScreen message="Loading notifications..." />;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications || []}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={styles.refreshColor}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No notifications"
            message="You're all caught up!"
            icon="notifications-off-outline"
          />
        }
      />
    </SafeAreaView>
  );
}
```

**Style File Following Pattern:**
```typescript
// app/app/(tabs)/notifications/index.styles.ts
// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createNotificationsStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.md,
  },
  refreshColor: theme.colors.primary,
});
```

#### 1.2 Update Tab Bar
**Location:** `/app/app/(tabs)/_layout.tsx`

**Changes:**
- Add notifications tab with icon
- Implement badge showing unread count
- Add proper navigation

```typescript
<Tabs.Screen
  name="notifications"
  options={{
    title: 'Notifications',
    tabBarIcon: ({ color, size }) => (
      <View>
        <Ionicons name="notifications-outline" size={size} color={color} />
        {unreadCount > 0 && (
          <Badge count={unreadCount} />
        )}
      </View>
    ),
  }}
/>
```

### Phase 2: Notification Components (Priority: High)

#### 2.1 Create Reusable Components
**Component Organization Note:**

The `NotificationBadge` is a reusable UI component that will be used in multiple places (tab bar, headers, etc.), so it belongs in the shared UI components:

```
app/components/ui/NotificationBadge/
├── index.tsx
└── index.styles.ts
```

The `NotificationList` and `NotificationListItem` are specific to the notifications screen and should be implemented locally within the screen component (not as separate components) following the pattern shown in the experiments screen above.

**Implementation in NotificationsScreen:**
```typescript
// This would be implemented as a local renderItem function within NotificationsScreen
// Similar to the experiments screen pattern shown above

const renderNotification = ({ item }: { item: Notification }) => {
  const iconName = item.category === 'payment' 
    ? 'card-outline' 
    : item.category === 'social' 
    ? 'people-outline'
    : 'notifications-outline';
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.read && styles.unread
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color={styles.iconColor} />
      </View>
      
      <View style={styles.content}>
        <Text variant="body" weight="semibold">
          {item.title}
        </Text>
        <Text variant="caption" color="secondary">
          {item.body}
        </Text>
        <Text variant="caption" color="tertiary">
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
      
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};
```

**NotificationBadge as Reusable UI Component:**
```typescript
// app/components/ui/NotificationBadge/index.tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useThemedStyles } from '@/styles';
import { createNotificationBadgeStyles } from './index.styles';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export function NotificationBadge({ 
  count, 
  size = 'medium' 
}: NotificationBadgeProps) {
  const styles = useThemedStyles(createNotificationBadgeStyles);
  
  if (count <= 0) return null;
  
  return (
    <View style={[
      styles.badge,
      styles[size]
    ]}>
      <Text variant="caption" color="white" weight="bold">
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
}

// app/components/ui/NotificationBadge/index.styles.ts
import { Theme } from '@/types/theme';

export const createNotificationBadgeStyles = (theme: Theme) => ({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  medium: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  large: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
});
```

#### 2.2 Implement Notification Grouping
**Features:**
- Group by date (Today, Yesterday, This Week, Older)
- Group by category (Updates, Reminders, Social)
- Collapsible sections
- Swipe actions (mark as read, delete)

### Phase 3: Enhanced useNotifications Hook (Priority: High)

#### 3.1 Extend Current Hook
**Following Hook Pattern in `/app/hooks/useNotifications.ts`:**

```typescript
// app/hooks/useNotifications.ts
import { useEffect, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/api';
import { handleError } from '@/utils/error-handler';
import type { Notification } from '@shared/types/notification';

export function useNotifications() {
  // Existing notification registration code...
  
  // TRPC queries following codebase pattern
  const utils = trpc.useUtils();
  const { data: notifications, refetch } = trpc.notifications.getNotifications.useQuery(
    undefined,
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Poll every minute
    }
  );
  
  // Mutations following pattern
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: (updatedNotification) => {
      // Update cache directly
      utils.notifications.getNotifications.setData(
        undefined,
        (old) => old?.map(n => 
          n._id === updatedNotification._id ? updatedNotification : n
        )
      );
    },
    onError: (error) => {
      handleError(error, 'Failed to mark notification as read');
    },
  });
  
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      // Refetch to get updated data
      utils.notifications.getNotifications.invalidate();
    },
  });
  
  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: (_, { id }) => {
      // Remove from cache
      utils.notifications.getNotifications.setData(
        undefined,
        (old) => old?.filter(n => n._id !== id)
      );
    },
  });
  
  // Computed values
  const unreadCount = useMemo(
    () => notifications?.filter(n => !n.read).length || 0,
    [notifications]
  );
  
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(notifications || []),
    [notifications]
  );
  
  return {
    // Data
    notifications: groupedNotifications,
    unreadCount,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
    
    // Existing returns...
    registerForPushNotifications,
    handleNotificationResponse,
  };
}

// Helper function following existing patterns
function groupNotificationsByDate(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    
    if (date >= today) {
      groups.today.push(notification);
    } else if (date >= yesterday) {
      groups.yesterday.push(notification);
    } else if (date >= weekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });
  
  return groups;
}
```

#### 3.2 Add Polling/Real-time Updates
```typescript
// Poll for new notifications every 30 seconds
useQuery({
  refetchInterval: 30000,
  refetchIntervalInBackground: true,
});

// Or use WebSocket for real-time updates
useNotificationSubscription();
```

### Phase 4: Deep Linking Implementation (Priority: Medium)

#### 4.1 Enable Deep Linking
**Location:** `/app/hooks/useNotifications.ts`

**Implementation:**
```typescript
// Uncomment and enhance existing code
const handleNotificationResponse = useCallback((response: NotificationResponse) => {
  const data = response.notification.request.content.data;
  
  if (data?.deepLink) {
    // Navigate based on notification type
    switch (data.type) {
      case 'payment':
        router.push(`/payments/${data.paymentId}`);
        break;
      case 'user':
        router.push(`/profile/${data.userId}`);
        break;
      default:
        router.push('/notifications');
    }
  }
  
  // Mark as read
  markAsRead.mutate({ id: data.notificationId });
}, [router, markAsRead]);
```

#### 4.2 Update Notification Sending
**Backend Changes:**
```typescript
// Add deepLink data when sending notifications
await notificationsRouter.sendToUser({
  userId,
  notification: {
    title: 'Payment Received',
    body: 'You received $50 from John',
    data: {
      deepLink: true,
      type: 'payment',
      paymentId: payment.id,
      notificationId: notification.id,
    }
  }
});
```

### Phase 5: In-App Toast Notifications (Priority: Medium)

#### 5.1 Create Toast Component
**Following UI Component Pattern:**

```
app/components/ui/Toast/
├── index.tsx
├── index.styles.ts
└── NotificationToast.tsx         # Specific toast variant
```

**Implementation:**
```typescript
// app/components/ui/Toast/NotificationToast.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { Text } from '../Text';
import { IconButton } from '../IconButton';
import { useThemedStyles } from '@/styles';
import { createToastStyles } from './index.styles';
import type { Notification } from '@shared/types/notification';

interface NotificationToastProps {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
}

export function NotificationToast({ 
  notification, 
  onPress, 
  onDismiss 
}: NotificationToastProps) {
  const styles = useThemedStyles(createToastStyles);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  
  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.content} 
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.textContainer}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {notification.title}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        
        <IconButton 
          icon="close" 
          size="small"
          onPress={handleDismiss}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
```

#### 5.2 Toast Provider
**Following Provider Pattern:**

```typescript
// app/providers/toast-provider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationToast } from '@/components/ui/Toast/NotificationToast';
import type { Notification } from '@shared/types/notification';

interface ToastContextValue {
  showNotificationToast: (notification: Notification, onPress?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    notification: Notification;
    onPress?: () => void;
  }>>([]);
  
  const showNotificationToast = useCallback(
    (notification: Notification, onPress?: () => void) => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, notification, onPress }]);
    },
    []
  );
  
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ showNotificationToast }}>
      {children}
      
      {/* Toast container */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast.notification}
            onPress={() => {
              toast.onPress?.();
              dismissToast(toast.id);
            }}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
```

### Phase 6: Backend Enhancements (Priority: Low)

#### 6.1 New API Endpoints
**Following Router Pattern in `/server/routers/notifications.ts`:**

```typescript
// server/routers/notifications.ts
import { router, protectedProcedure } from '@/trpc/trpc';
import { z } from 'zod';
import { getNotificationsCollection } from '@/db';
import { errors } from '@/utils/errors';
import { ObjectId } from 'mongodb';

export const notificationRouter = router({
  // Existing endpoints...
  
  // New endpoint: Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const notificationsCollection = getNotificationsCollection();
      
      // Update all unread notifications for user
      const result = await notificationsCollection.updateMany(
        { 
          userId: ctx.user.uid,
          read: false 
        },
        { 
          $set: { 
            read: true,
            readAt: new Date() 
          } 
        }
      );
      
      return {
        modifiedCount: result.modifiedCount,
      };
    }),
    
  // New endpoint: Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const notificationsCollection = getNotificationsCollection();
      
      // Verify ownership before deleting
      const notification = await notificationsCollection.findOne({
        _id: new ObjectId(input.id),
        userId: ctx.user.uid,
      });
      
      if (!notification) {
        throw errors.notFound('Notification');
      }
      
      await notificationsCollection.deleteOne({
        _id: new ObjectId(input.id),
      });
      
      return { success: true };
    }),
    
  // New endpoint: Get unread count only
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const notificationsCollection = getNotificationsCollection();
      
      const count = await notificationsCollection.countDocuments({
        userId: ctx.user.uid,
        read: false,
      });
      
      return { count };
    }),
});
```

#### 6.2 Notification Categories Enhancement
- Add more granular categories
- Allow custom category creation
- Category-specific settings (sound, vibration)

### Phase 7: Testing & Polish (Priority: High)

#### 7.1 Test Scenarios
- [ ] Test with 0, 1, 10, 100+ notifications
- [ ] Test marking as read (single and bulk)
- [ ] Test deep linking to various screens
- [ ] Test permission denial scenarios
- [ ] Test offline behavior
- [ ] Test notification grouping

#### 7.2 Performance Optimization
- [ ] Implement virtual scrolling for long lists
- [ ] Add pagination (load more on scroll)
- [ ] Cache notifications locally
- [ ] Optimize re-renders

#### 7.3 Accessibility
- [ ] Add screen reader support
- [ ] Ensure proper contrast ratios
- [ ] Add haptic feedback
- [ ] Support reduced motion

## Technical Implementation Details

### 1. Update TRPC Hooks
```typescript
// Add to app/lib/api/index.ts
export const notificationApi = {
  useNotifications: () => trpc.notifications.getNotifications.useQuery(),
  useUnreadCount: () => trpc.notifications.getUnreadCount.useQuery(),
  useMarkAsRead: () => trpc.notifications.markAsRead.useMutation(),
  useMarkAllAsRead: () => trpc.notifications.markAllAsRead.useMutation(),
  useDeleteNotification: () => trpc.notifications.delete.useMutation(),
};
```

### 2. State Management
```typescript
// Consider using Zustand for notification state
// app/stores/notification-store.ts
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}));
```

### 3. Styling Considerations
```typescript
// app/styles/notifications.ts
export const notificationStyles = StyleSheet.create({
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unread: {
    backgroundColor: colors.primaryLight,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## Implementation Timeline

### Week 1: Core Notification Center
- Create notifications tab
- Build basic notification list
- Implement unread badges
- Add mark as read functionality

### Week 2: Enhanced Features
- Add notification grouping
- Implement swipe actions
- Create empty states
- Add pull-to-refresh

### Week 3: Deep Linking & Toasts
- Enable deep linking
- Create toast notifications
- Add in-app notification handling
- Test navigation flows

### Week 4: Polish & Testing
- Performance optimization
- Accessibility improvements
- Comprehensive testing
- Documentation updates

## Success Metrics

1. **User Engagement**
   - 80% of users view notification center weekly
   - 90% of notifications marked as read within 24 hours
   - < 5% disable notifications after enabling

2. **Technical Performance**
   - List renders 100 items in < 100ms
   - Badge updates in real-time
   - Zero notification delivery failures
   - Deep links work 100% of the time

3. **User Experience**
   - Users can find all notifications easily
   - Clear visual distinction for unread items
   - Smooth animations and transitions
   - Intuitive swipe gestures

## Risks & Mitigation

1. **Performance with Large Lists**
   - Implement pagination
   - Use FlatList with optimization
   - Cache rendered items

2. **Missing Notifications**
   - Implement retry logic
   - Store failed notifications
   - Add delivery confirmation

3. **Deep Link Failures**
   - Graceful fallback to notification center
   - Log navigation errors
   - Test all possible routes

## Next Steps

1. **Immediate Actions**
   - Create notifications tab structure
   - Add to tab bar with badge
   - Implement basic list view

2. **This Week**
   - Complete Phase 1 & 2
   - Test basic functionality
   - Get design feedback

3. **This Month**
   - Complete all phases
   - Launch to beta users
   - Iterate based on feedback

## Conclusion

The notification preferences UI is already complete and functional. The main missing piece is the notification center where users can view their notifications. With the backend fully implemented, adding the UI should be straightforward. The implementation can be completed in 3-4 weeks with proper testing and polish.