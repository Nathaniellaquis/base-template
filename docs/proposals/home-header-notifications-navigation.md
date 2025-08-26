# Home Header with Notifications Navigation Proposal

## Overview

Add a header to the home screen with app name "INGRD" on the left and a notification bell icon on the right. When tapped, it navigates to a full-screen notifications page with a back button.

## Current State

- Home screen has no header (`headerShown: false`)
- Notifications exists as a tab screen
- No existing header components or patterns
- Tab navigation doesn't support back navigation

## Proposed Solution

### Visual Design

**Home Screen with Header:**
```
┌─────────────────────────┐
│ INGRD              🔔 3 │ <- New header (56px height)
├─────────────────────────┤
│                         │
│ Welcome back!           │
│ [Home content...]       │
│                         │
└─────────────────────────┘
```

**Notifications Screen (when accessed from home):**
```
┌─────────────────────────┐
│ ← Notifications         │ <- Stack header with back
├─────────────────────────┤
│                         │
│ [Notification items...] │
│                         │
└─────────────────────────┘
```

### Implementation Strategy

#### 1. Create Home Header Component

```
components/
  features/
    home/
      HomeHeader/
        index.tsx
        index.styles.ts
```

**Features:**
- Fixed height: 56px
- App name "INGRD" (variant: h3, fontWeight: bold)
- Notification bell icon with NotificationBadge
- Theme-aware styling
- Proper spacing matching design system

#### 2. Navigation Architecture

**Create a new stack screen for notifications:**

```
app/
  (tabs)/
    home/
    notifications/    <- Keep existing tab
  notifications/      <- New stack screen
    index.tsx
```

This allows:
- Tab navigation keeps working normally
- Home can navigate to full-screen notifications with back button
- Reuse existing notifications component logic

#### 3. File Structure

```
app/
  app/
    (tabs)/
      home/
        index.tsx (add HomeHeader)
      notifications/
        index.tsx (existing tab screen)
    notifications/
      index.tsx (new stack screen - wraps NotificationsList)
    _layout.tsx (add new Stack.Screen)
```

### Technical Details

#### HomeHeader Component

```typescript
// Pseudo-structure
<View style={styles.header}>
  <Text variant="h3" style={styles.appName}>INGRD</Text>
  <TouchableOpacity onPress={() => router.push('/notifications')}>
    <View style={styles.notificationButton}>
      <Ionicons name="notifications-outline" />
      {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
    </View>
  </TouchableOpacity>
</View>
```

#### Navigation Flow

1. User taps notification icon in home header
2. Navigate using: `router.push('/notifications')`
3. Stack screen shows with native back button
4. Back button returns to home screen
5. Bottom tabs remain visible but notifications tab not highlighted

#### Shared Component Approach

Create a `NotificationsList` component that both screens use:

```
components/
  features/
    notifications/
      NotificationsList/
        index.tsx
```

Both `/notifications/index.tsx` and `/(tabs)/notifications/index.tsx` render this component.

### Styling Guidelines

**Header Styling:**
- Background: `theme.colors.background`
- Border bottom: 1px solid `theme.colors.border`
- Padding horizontal: `theme.spacing.md`
- App name color: `theme.colors.text`
- Icon color: `theme.colors.textSecondary`

**Consistency:**
- Use existing NotificationBadge component
- Follow spacing from theme system
- Match existing icon patterns (outline variant)

### Benefits

1. **Clean Architecture**: Separates tab and stack navigation
2. **Reusability**: Share notification list between screens
3. **Native Feel**: Standard back navigation pattern
4. **No Breaking Changes**: Existing tab navigation unchanged
5. **Consistent UX**: Same notifications content, different entry points

### Implementation Steps

1. **Phase 1**: Create HomeHeader component
   - Build component with styling
   - Add to home screen
   - Connect notification count

2. **Phase 2**: Create stack notifications screen
   - Add to root layout
   - Extract NotificationsList component
   - Update both screens to use shared component

3. **Phase 3**: Polish
   - Add loading states
   - Ensure smooth navigation
   - Test on various devices

### Alternative Considered

**Why not modify the tab screen?**
- Would complicate tab navigation logic
- Conditional headers are messy
- Back navigation in tabs is non-standard
- Separate screens are cleaner

### Code Organization

The solution maintains clean separation:
- Header logic stays in home feature
- Notifications logic stays in notifications feature  
- Navigation is explicit and easy to follow
- No complex state management needed

## Conclusion

This approach provides a clean, maintainable solution that:
- Adds the requested header to home screen
- Enables full-screen notifications with back navigation
- Reuses existing code efficiently
- Follows platform navigation patterns
- Maintains the existing tab structure