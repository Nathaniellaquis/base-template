# Notifications Overlay Component Proposal

## Overview

Create a reusable NotificationsOverlay component that can be triggered from anywhere in the app, starting with a header on the home screen. This follows your existing modal patterns and component structure.

## Component Architecture

### File Structure (Following Your Patterns)

```
app/
  components/
    features/
      notifications/
        NotificationsOverlay/
          index.tsx
          index.styles.ts
        NotificationsList/        # Extract from current screen
          index.tsx
          index.styles.ts
      home/
        HomeHeader/
          index.tsx
          index.styles.ts
```

### Why This Structure Works

1. **Follows your existing patterns**: Features organized by domain
2. **Reuses existing code**: Extract the FlatList logic into NotificationsList
3. **Component-based**: Not a page, just a component that can be shown/hidden
4. **Production-ready**: Clean separation of concerns

## Implementation Details

### 1. HomeHeader Component

```typescript
// components/features/home/HomeHeader/index.tsx
export function HomeHeader() {
  const styles = useThemedStyles(createHomeHeaderStyles);
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  
  return (
    <>
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
      
      <NotificationsOverlay 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
```

### 2. NotificationsOverlay Component

Following your modal patterns (like UpgradeModal):

```typescript
// components/features/notifications/NotificationsOverlay/index.tsx
interface NotificationsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsOverlay({ visible, onClose }: NotificationsOverlayProps) {
  const styles = useThemedStyles(createNotificationsOverlayStyles);
  const { theme } = useTheme();
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text variant="h3" style={styles.title}>Notifications</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* Reuse the notifications list */}
          <NotificationsList />
        </View>
      </View>
    </Modal>
  );
}
```

### 3. NotificationsList Component

Extract the FlatList logic from current notifications screen:

```typescript
// components/features/notifications/NotificationsList/index.tsx
export function NotificationsList() {
  // Move all the logic from NotificationsScreen here
  // Same queries, mutations, rendering logic
  // Just the FlatList and its logic, no wrapper
  
  return (
    <FlatList
      style={styles.container}
      data={data?.notifications || []}
      renderItem={renderNotification}
      // ... rest of current implementation
    />
  );
}
```

### 4. Update Notifications Tab Screen

Make it use the shared component:

```typescript
// app/(tabs)/notifications/index.tsx
export default function NotificationsScreen() {
  return <NotificationsList />;
}
```

## Styling Approach

### NotificationsOverlay Styles

Following your existing modal patterns:

```typescript
// index.styles.ts
export const createNotificationsOverlayStyles = (theme: Theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    marginTop: 100, // Start below status bar + some space
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32, // Match back button width for centering
  },
});
```

## Benefits of This Approach

1. **Reusable**: Can trigger from anywhere (home, profile, etc.)
2. **Consistent**: Uses your existing Modal patterns
3. **Clean**: No navigation complexity
4. **Familiar**: Follows your component structure exactly
5. **Production-ready**: Properly organized and typed

## Usage Pattern

1. Add `<HomeHeader />` to home screen
2. Header manages its own state for showing overlay
3. Overlay slides up like your other modals
4. Back button or swipe down to close
5. Same notifications content, just in an overlay

## Animation Details

- **Open**: Slide up from bottom (like UpgradeModal)
- **Close**: Slide down on back button or backdrop tap
- **Gesture**: Could add swipe-down-to-close later

## Why This is Better

1. **No new navigation patterns**: Just a component
2. **Follows your structure**: Feature-based organization
3. **Reuses everything**: Your styles, patterns, components
4. **Easy to implement**: Standard Modal component
5. **Flexible**: Can add to other screens easily

This gives you a production-ready notifications overlay that matches your existing patterns perfectly!