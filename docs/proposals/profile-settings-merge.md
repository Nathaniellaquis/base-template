# Profile and Settings Page Merge Proposal

## Overview
This proposal outlines the plan to merge the Profile tab functionality into the Settings page, creating a unified user account management experience while maintaining all existing features and following the codebase's established patterns.

## Current State Analysis

### Profile Tab
- **Viewing**: Dedicated profile view with avatar, plan badge, completeness tracking
- **Editing**: Separate edit page with comprehensive form
- **Features**: Bio, location, website, social links, profile completeness

### Settings Tab
- **Profile Section**: Basic info (email, display name) with inline editing
- **Other Sections**: Preferences, Subscription, Security, Admin (conditional), Danger Zone

## Proposed Architecture

### 1. Frontend Structure

#### Settings Page Reorganization
```
Settings Page
├── Profile Section (Enhanced)
│   ├── Avatar & Basic Info
│   ├── Profile Completeness
│   ├── Edit Profile Button → Modal/Sheet
│   └── Quick Actions
├── Account Details (New)
│   ├── Email & Verification Status
│   ├── User ID
│   └── Account Type/Plan
├── Preferences (Existing)
├── Subscription (Existing)
├── Security (Existing)
├── Admin (Conditional)
└── Danger Zone (Existing)
```

#### Implementation Details

1. **Profile Section Enhancement**
   - Move `UserProfile` component logic into settings
   - Add avatar display with edit capability
   - Show profile completeness bar
   - "Edit Profile" button opens modal/sheet instead of navigation

2. **Edit Profile Modal/Sheet**
   - Convert `/profile/edit` to a modal component
   - Use `react-native-modal` or custom sheet
   - Maintain all editing fields and validation
   - Smooth animations and platform-specific styling

3. **Navigation Updates**
   - Remove Profile tab from tab bar
   - Update tab navigation to 3 tabs: Home, Notifications, Settings
   - Handle deep links to profile (redirect to settings)

### 2. Backend Considerations

No backend changes required - all existing APIs remain the same:
- `user.getUser` - Fetch profile data
- `user.updateUser` - Update profile information
- Profile completeness calculation remains server-side

### 3. Component Structure

```typescript
// New structure
app/
├── app/(tabs)/
│   ├── index.tsx (Home)
│   ├── notifications.tsx
│   └── settings/
│       ├── index.tsx (Enhanced settings)
│       └── _layout.tsx
├── components/features/
│   ├── settings/
│   │   ├── ProfileSection.tsx (New)
│   │   ├── EditProfileModal.tsx (New)
│   │   ├── AccountDetailsSection.tsx (New)
│   │   └── ... (existing sections)
│   └── user/
│       └── ProfileCompleteness.tsx (Refactored)
```

### 4. UI/UX Improvements

1. **Collapsed/Expanded States**
   - Profile section shows summary by default
   - Tap to expand for full details
   - Smooth animations

2. **Quick Actions**
   - Edit avatar directly from settings
   - Copy user ID with one tap
   - Share profile link (if applicable)

3. **Visual Hierarchy**
   - Profile section at top (most important)
   - Account details below profile
   - Settings grouped logically

## Implementation Plan

### Phase 1: Component Preparation
1. Create `ProfileSection` component
2. Create `EditProfileModal` component
3. Refactor `UserProfile` logic for reuse
4. Create `AccountDetailsSection` component

### Phase 2: Settings Page Integration
1. Update settings page structure
2. Integrate new components
3. Implement modal/sheet behavior
4. Update styling for consistency

### Phase 3: Navigation Updates
1. Remove profile tab from navigation
2. Update tab bar to 3 tabs
3. Handle routing redirects
4. Update deep linking

### Phase 4: Testing & Polish
1. Test all profile functionality
2. Ensure smooth animations
3. Verify dark mode support
4. Platform-specific testing (iOS/Android)

## Code Examples

### ProfileSection Component
```tsx
const ProfileSection: React.FC = () => {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  return (
    <Card style={styles.card}>
      <View style={styles.profileHeader}>
        <Avatar user={user} size={60} />
        <View style={styles.profileInfo}>
          <Text variant="h3">{user.displayName || 'Set your name'}</Text>
          <Text variant="caption" style={styles.email}>{user.email}</Text>
          <PlanBadge plan={user.plan} />
        </View>
      </View>
      
      <ProfileCompleteness percentage={user.profileCompleteness} />
      
      <Button
        title="Edit Profile"
        onPress={() => setEditModalVisible(true)}
        variant="secondary"
        size="small"
      />
      
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
      />
    </Card>
  );
};
```

### Updated Tab Navigation
```tsx
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "notifications" : "notifications-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "settings" : "settings-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Benefits

1. **Simplified Navigation**: 3 tabs instead of 4, reducing cognitive load
2. **Unified Experience**: All account-related features in one place
3. **Better Organization**: Profile naturally fits with account settings
4. **Maintained Features**: All existing functionality preserved
5. **Improved UX**: Modal editing keeps context, no navigation required

## Migration Considerations

1. **User Education**: Brief tooltip on first launch after update
2. **Deep Links**: Redirect `/profile` routes to `/settings`
3. **Analytics**: Update event tracking for new flow
4. **A/B Testing**: Consider gradual rollout with experiments

## Alternative Approaches Considered

1. **Accordion Style**: All sections collapsible (too complex)
2. **Separate Profile Page**: Keep as sub-route of settings (extra navigation)
3. **Inline Editing Only**: Remove edit modal (limited for complex fields)

## Conclusion

This merge creates a more streamlined user experience while maintaining all existing functionality. The implementation follows established patterns in the codebase and can be completed in phases to minimize risk.