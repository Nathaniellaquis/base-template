# Notifications System

## Overview
A practical push notification system that balances simplicity with essential features. This approach covers 95% of use cases without overengineering.

## Core Architecture

### 1. What We're Using
- **Expo Notifications**: Push notifications for iOS/Android only
- **MongoDB**: Store tokens and basic preferences in user document
- **TRPC**: Simple endpoints for token management and sending
- **In-App Notification Center**: View notifications on web/mobile (no web push)

### 2. Database Schema (Simple & Effective)

#### Update User Document
```typescript
// Add to existing User interface in types/user.ts
interface User {
  // ... existing fields
  
  // Notification fields
  pushTokens?: {
    token: string;
    deviceId?: string;
    platform: 'ios' | 'android';
    updatedAt: Date;
  }[];
  
  notificationPreferences?: {
    enabled: boolean;
    // Just the essentials - add more only as needed
    updates: boolean;      // App updates, new features
    reminders: boolean;    // Task reminders, deadlines
    social: boolean;       // Comments, mentions, follows
  };
}
```

#### Notifications Collection (for tracking & history)
```typescript
// types/notification.ts
interface NotificationDocument {
  _id: ObjectId;
  userId: ObjectId;
  
  // Content
  title: string;
  body: string;
  category: 'updates' | 'reminders' | 'social';
  data?: any; // For deep linking
  
  // Status tracking
  status: 'created' | 'sent' | 'delivered' | 'read';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  
  // Platform info
  platforms: ('ios' | 'android')[];
  
  // Expo response (for debugging)
  pushTickets?: any[];
}
```

### 3. Implementation Plan

#### Phase 1: Get It Working (2-3 days)
1. **Install Expo Notifications**
2. **Add token registration on app launch**
3. **Create simple send endpoint**
4. **Test on real devices**

#### Phase 2: User Control (1-2 days)
1. **Add preferences to settings screen**
2. **Update toggle to actually work**
3. **Check preferences before sending**

#### Phase 3: Polish (Optional, as needed)
1. **Handle token updates**
2. **Add notification badges**
3. **Deep linking from notifications**

## Technical Implementation

### 1. Frontend Implementation

#### Enhanced Hook: `app/hooks/useNotifications.ts`
```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import { trpc } from '@/utils/trpc';

export function useNotifications() {
  const { user } = useAuth();
  const registerToken = trpc.notifications.registerToken.useMutation();
  const markAsRead = trpc.notifications.markAsRead.useMutation();
  
  const registerForPushNotifications = async () => {
    // Only register on mobile
    if (Platform.OS === 'web') return null;
    
    try {
      // Mobile push notifications only
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return null;
      
      const expoPushToken = await Notifications.getExpoPushTokenAsync();
      const deviceId = await Notifications.getDeviceIdAsync();
      
      // Add/update token for this device
      // This should upsert based on deviceId to handle multiple devices
      await registerToken.mutateAsync({
        token: expoPushToken.data,
        deviceId,
        platform: Platform.OS as 'ios' | 'android',
      });
      
      return expoPushToken.data;
    } catch (error) {
      console.error('Failed to register:', error);
      return null;
    }
  };
  
  // Handle notification interactions
  useEffect(() => {
    // When app is in foreground
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
    
    // When user taps notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.content.data?.notificationId;
      if (notificationId) {
        // Mark as read
        markAsRead.mutate({ notificationId });
      }
      
      // Handle deep linking
      const screen = response.notification.request.content.data?.screen;
      if (screen) {
        // Navigate to screen
      }
    });
    
    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);
  
  return { registerForPushNotifications };
}
```

### 2. Backend Implementation

#### TRPC Router: `server/routers/notifications.ts`
```typescript
import { router } from '../trpc';
import { protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

export const notificationsRouter = router({
  // Register/update push token for a device
  registerToken: protectedProcedure
    .input(z.object({
      token: z.string(),
      deviceId: z.string(),
      platform: z.enum(['ios', 'android']),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.users.findOne({ firebaseUid: ctx.userId });
      if (!user) throw new Error('User not found');
      
      // Get existing tokens or initialize empty array
      const existingTokens = user.pushTokens || [];
      
      // Remove old token for this device if exists
      const filteredTokens = existingTokens.filter(t => t.deviceId !== input.deviceId);
      
      // Add new token
      const updatedTokens = [
        ...filteredTokens,
        {
          token: input.token,
          deviceId: input.deviceId,
          platform: input.platform,
          updatedAt: new Date(),
        }
      ];
      
      // Update user document
      await ctx.db.users.updateOne(
        { _id: user._id },
        { $set: { pushTokens: updatedTokens } }
      );
      
      return { success: true, deviceCount: updatedTokens.length };
    }),
  
  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      enabled: z.boolean(),
      updates: z.boolean().optional(),
      reminders: z.boolean().optional(),
      social: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.users.findOne({ firebaseUid: ctx.userId });
      if (!user) throw new Error('User not found');
      
      await ctx.db.users.updateOne(
        { _id: user._id },
        { $set: { notificationPreferences: input } }
      );
      
      return { success: true };
    }),
  
  // Send notification to user (using existing backend patterns)
  sendToUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      title: z.string(),
      body: z.string(),
      category: z.enum(['updates', 'reminders', 'social']),
      data: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use existing pattern from get-user.ts
      const targetUser = await ctx.db.users.findOne({ _id: new ObjectId(input.userId) });
      if (!targetUser) throw new Error('User not found');
      
      // Check if notifications enabled
      if (!targetUser.notificationPreferences?.enabled) {
        return { sent: false, reason: 'Notifications disabled' };
      }
      
      // Check category preference
      if (!targetUser.notificationPreferences[input.category]) {
        return { sent: false, reason: 'Category disabled' };
      }
      
      // Create notification record (visible in web/mobile app)
      const notification = await ctx.db.notifications.insertOne({
        userId: targetUser._id,
        title: input.title,
        body: input.body,
        category: input.category,
        data: input.data,
        status: 'created',
        createdAt: new Date(),
        platforms: targetUser.pushTokens?.map(t => t.platform) || [],
      });
      
      // Get all mobile tokens (supports multiple devices)
      const mobileTokens = targetUser.pushTokens?.map(t => t.token) || [];
      
      // Send push notifications to mobile devices only
      if (mobileTokens.length > 0) {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: mobileTokens,
            title: input.title,
            body: input.body,
            data: { 
              ...input.data, 
              notificationId: notification.insertedId.toString() 
            },
          }),
        });
        
        // Update notification status
        await ctx.db.notifications.updateOne(
          { _id: notification.insertedId },
          { 
            $set: { 
              status: 'sent',
              sentAt: new Date(),
              pushTickets: await response.json()
            } 
          }
        );
      }
      
      return { sent: true, notificationId: notification.insertedId };
    }),
  
  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notifications.updateOne(
        { 
          _id: new ObjectId(input.notificationId),
          userId: new ObjectId(ctx.userId) // Ensure user owns this notification
        },
        { 
          $set: { 
            status: 'read',
            readAt: new Date() 
          } 
        }
      );
      
      return { success: true };
    }),
  
  // Get user's notifications (using existing backend patterns)
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      skip: z.number().default(0),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      // Use existing pattern to get MongoDB user
      const user = await ctx.db.users.findOne({ firebaseUid: ctx.userId });
      if (!user) throw new Error('User not found');
      
      const query: any = { userId: user._id };
      if (input.unreadOnly) {
        query.status = { $ne: 'read' };
      }
      
      const notifications = await ctx.db.notifications
        .find(query)
        .sort({ createdAt: -1 })
        .limit(input.limit)
        .skip(input.skip)
        .toArray();
      
      const total = await ctx.db.notifications.countDocuments(query);
      
      return { notifications, total };
    }),
});
```

### 3. Settings Screen Update

#### `app/app/(tabs)/settings.tsx`
```typescript
export default function SettingsScreen() {
  const { user } = useAuth();
  const updatePreferences = trpc.notifications.updatePreferences.useMutation();
  
  const [preferences, setPreferences] = useState({
    enabled: user?.notificationPreferences?.enabled ?? true,
    updates: user?.notificationPreferences?.updates ?? true,
    reminders: user?.notificationPreferences?.reminders ?? true,
    social: user?.notificationPreferences?.social ?? true,
  });
  
  const handleToggle = async (key: string, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    // Save to backend
    await updatePreferences.mutateAsync(newPrefs);
  };
  
  return (
    <ScrollView>
      <Card>
        <Text variant="h3">Notifications</Text>
        
        <View style={styles.toggle}>
          <Text>Push Notifications</Text>
          <Switch
            value={preferences.enabled}
            onValueChange={(v) => handleToggle('enabled', v)}
          />
        </View>
        
        {preferences.enabled && (
          <>
            <View style={styles.toggle}>
              <Text>App Updates</Text>
              <Switch
                value={preferences.updates}
                onValueChange={(v) => handleToggle('updates', v)}
              />
            </View>
            
            <View style={styles.toggle}>
              <Text>Reminders</Text>
              <Switch
                value={preferences.reminders}
                onValueChange={(v) => handleToggle('reminders', v)}
              />
            </View>
            
            <View style={styles.toggle}>
              <Text>Social Updates</Text>
              <Switch
                value={preferences.social}
                onValueChange={(v) => handleToggle('social', v)}
              />
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
}
```

### 4. Simple Notification Center (Optional)

#### `app/app/(tabs)/notifications.tsx`
```typescript
import { FlatList, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const { data, isLoading, refetch } = trpc.notifications.getNotifications.useQuery({
    limit: 50,
  });
  const markAsRead = trpc.notifications.markAsRead.useMutation();
  
  const handleNotificationPress = async (notification: any) => {
    // Mark as read if not already
    if (notification.status !== 'read') {
      await markAsRead.mutateAsync({ notificationId: notification._id });
      refetch();
    }
    
    // Handle navigation based on data
    if (notification.data?.screen) {
      // Navigate to screen
    }
  };
  
  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      onPress={() => handleNotificationPress(item)}
      style={[
        styles.notificationItem,
        item.status !== 'read' && styles.unread
      ]}
    >
      <View style={styles.notificationContent}>
        <Text variant="subtitle" style={styles.title}>{item.title}</Text>
        <Text variant="body" style={styles.body}>{item.body}</Text>
        <Text variant="caption" style={styles.time}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
      {item.status !== 'read' && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        data={data?.notifications || []}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications yet</Text>
        }
      />
    </View>
  );
}
```

## Multi-Device Support

The system automatically handles multiple devices per user:

```typescript
// Example: User with iPhone and iPad
user.pushTokens = [
  {
    token: "ExponentPushToken[xxxxx]",
    deviceId: "iPhone-12345",
    platform: "ios",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    token: "ExponentPushToken[yyyyy]", 
    deviceId: "iPad-67890",
    platform: "ios",
    updatedAt: "2024-01-15T14:30:00Z"
  }
]
```

When sending notifications:
- All devices receive the push notification
- Each device token is updated when the app launches
- Old tokens are automatically replaced for each device

## Common Use Cases

### 1. Welcome Notification (after signup)
```typescript
// In create-user.ts
await notificationService.sendToUser(newUser._id, {
  title: 'Welcome to Ingrd! 👋',
  body: 'Tap to start exploring',
  category: 'updates',
});
```

### 2. Task Reminder
```typescript
// In your task service
await notificationService.sendToUser(userId, {
  title: 'Task Due Soon',
  body: taskTitle,
  category: 'reminders',
  data: { taskId, screen: 'tasks' }
});
```

### 3. Social Notification
```typescript
// When someone comments/mentions
await notificationService.sendToUser(userId, {
  title: 'New Comment',
  body: `${userName} commented on your post`,
  category: 'social',
  data: { postId, screen: 'post' }
});
```

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd app
npx expo install expo-notifications expo-device
```

### Step 2: Database Setup
```typescript
// In server/db.ts, add notifications collection
const db = {
  users: database.collection<User>('users'),
  onboarding: database.collection<OnboardingDocument>('onboarding'),
  notifications: database.collection<NotificationDocument>('notifications'), // ADD THIS
};
```

### Step 3: Update User Type
Add the notification fields to `types/user.ts`

### Step 4: Create Notifications Router
Add the router to your server and include it in `app.ts`

### Step 5: Update Settings Screen
Make the toggle functional with the code above

### Step 6: Add Notification Badge (Optional)
```typescript
// In your tabs or header
const { data: notificationData } = trpc.notifications.getNotifications.useQuery({
  unreadOnly: true,
  limit: 1
});

const unreadCount = notificationData?.total || 0;

// Show badge if unreadCount > 0
```

### Step 7: Test on Real Device
Notifications don't work in simulators!


## What This Gives You 🎉

- ✅ **Push Notifications**: iOS and Android only (no web push complexity)
- ✅ **In-App Viewing**: All platforms can view notifications in the app
- ✅ **Status Tracking**: Know if notifications were sent or read
- ✅ **User Control**: Preferences stored in user document
- ✅ **History**: All notifications saved in separate collection
- ✅ **Simple Categories**: Just 3 types to start
- ✅ **Read Receipts**: Automatically mark as read when viewed

## Still Keeping It Simple

We avoided:
- ❌ Complex scheduling systems
- ❌ Email fallbacks
- ❌ A/B testing
- ❌ Analytics dashboards
- ❌ Bulk campaign tools

You can add these later if/when you need them!