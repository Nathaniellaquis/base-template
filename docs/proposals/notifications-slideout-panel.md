# Notifications Slideout Panel Proposal

## Overview

This proposal outlines adding a notifications slideout panel to the home screen, providing quick access to notifications without switching tabs.

## Current State

- Notifications exist as a separate tab (3rd position)
- No header on home screen
- Unread count already tracked via `useNotifications` hook
- NotificationBadge component exists

## Proposed Solution

### Design Concept

```
┌─────────────────────────┐
│ INGRD      🔔 3         │ <- Custom header
├─────────────────────────┤
│                         │
│    Home Content         │
│                         │
└─────────────────────────┘
```

When notification icon is tapped, a slideout panel appears from the right:

```
┌─────────────┬───────────┐
│ INGRD  🔔 3 │ Notific.. │
├─────────────┼───────────┤
│ ░░░░░░░░░░░ │ [Today]   │
│ ░░░░░░░░░░░ │ • Update  │
│ ░░░░░░░░░░░ │ • Social  │
│             │ [Earlier] │
└─────────────┴───────────┘
```

### Implementation Strategy

#### 1. **Header Component**
Create a reusable header for the home screen:
- App name "INGRD" on the left
- Notification bell icon with badge on the right
- Follows theme colors and typography
- Height: 56px (standard mobile header)

#### 2. **Slideout Panel Architecture**
Two implementation options:

**Option A: Custom Reanimated Component** (Recommended)
- More control over animations
- Better performance
- Can integrate smoothly with existing tab navigation
- Won't interfere with navigation state

**Option B: React Navigation Drawer**
- Easier to implement
- Built-in gesture handling
- But requires restructuring navigation

#### 3. **Panel Features**
- **Width**: 85% of screen width (max 360px)
- **Animation**: Smooth spring animation (300ms)
- **Backdrop**: Semi-transparent overlay (60% opacity)
- **Gestures**: 
  - Swipe from right edge to open
  - Swipe right to close
  - Tap backdrop to close
- **Content**: Reuse existing notifications screen content

### Technical Implementation Plan

#### Phase 1: Header Creation
1. Create `HomeHeader` component
2. Add to home screen
3. Style with theme system
4. Connect notification count

#### Phase 2: Slideout Panel
1. Create `NotificationPanel` component using Reanimated
2. Implement gesture handling
3. Add backdrop and animations
4. Integrate with existing notifications data

#### Phase 3: Polish
1. Add haptic feedback on open/close
2. Implement pull-to-refresh
3. Add empty state
4. Performance optimization

### Component Structure

```
components/
  features/
    home/
      HomeHeader/
        index.tsx
        index.styles.ts
    notifications/
      NotificationPanel/
        index.tsx
        index.styles.ts
        useNotificationPanel.ts
```

### Animation Details

**Opening Animation**:
- Panel slides in from right (translateX)
- Backdrop fades in (opacity 0 → 0.6)
- Slight scale on content (0.95 → 1)
- Duration: 300ms with spring physics

**Closing Animation**:
- Reverse of opening
- Velocity-based if swiping

### Styling Guidelines

Following existing theme:
- **Header background**: `theme.colors.background`
- **Header border**: `theme.colors.border` (1px bottom)
- **Icon color**: `theme.colors.textSecondary`
- **Badge**: Use existing `NotificationBadge` component
- **Panel background**: `theme.colors.surface`
- **Panel shadow**: `theme.shadows.lg`

### User Experience

1. **Discovery**: Bell icon with badge draws attention
2. **Access**: Single tap to open, familiar swipe gestures
3. **Interaction**: Same as current notifications tab
4. **Dismissal**: Multiple intuitive ways to close
5. **Performance**: Smooth 60fps animations

### Benefits

1. **Quick Access**: No tab switching needed
2. **Context Preservation**: Stay on home screen
3. **Visual Feedback**: Always see unread count
4. **Familiar Pattern**: Common mobile UX pattern
5. **Non-Intrusive**: Optional feature, tabs still work

### Considerations

1. **Gesture Conflicts**: Ensure swipe doesn't conflict with scrolling
2. **Performance**: Lazy load panel content
3. **State Management**: Keep in sync with notifications tab
4. **Accessibility**: Full keyboard and screen reader support
5. **Testing**: Test on various screen sizes

### Alternative Approaches Considered

1. **Dropdown from header**: Less space, harder to interact
2. **Modal**: Too disruptive, blocks content
3. **Bottom sheet**: Conflicts with tab bar
4. **Replace tab**: Would remove dedicated notifications space

### Success Metrics

1. Smooth animations (60fps)
2. Quick access (<300ms to open)
3. No impact on home screen performance
4. Intuitive gestures work first try
5. Accessible to all users

## Conclusion

This slideout panel provides an elegant solution for quick notification access while maintaining the existing tab structure. It follows platform conventions, uses the existing design system, and enhances user experience without adding complexity.