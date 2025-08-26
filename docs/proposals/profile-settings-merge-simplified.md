# Simplified Profile-Settings Merge Plan

## Overview
Merge profile functionality into settings page with a minimalist approach - no images/avatars, just essential profile fields integrated naturally into the existing settings structure.

## Implementation Steps

### 1. Remove Avatar/Image Functionality
- Remove all avatar-related code from `UserProfile` component
- Remove profile image from onboarding flow
- Clean up any image upload/display logic
- Update user type to remove avatar field references

### 2. Simplify Profile Section in Settings
Instead of a complex profile section, just extend the existing "Profile Information" section:

```tsx
// Enhanced Profile Information Section in settings/index.tsx
<Card style={styles.card}>
  <Text variant="h3" style={styles.cardTitle}>Profile Information</Text>
  
  {/* Existing fields */}
  <View style={styles.infoRow}>
    <Text>Email</Text>
    <Text>{user.email}</Text>
  </View>
  
  <View style={styles.infoRow}>
    <Text>Display Name</Text>
    <TextInput value={displayName} onChangeText={setDisplayName} />
  </View>
  
  {/* New simple profile fields */}
  <View style={styles.infoRow}>
    <Text>Bio</Text>
    <TextInput 
      value={bio} 
      onChangeText={setBio}
      multiline
      placeholder="Tell us about yourself"
    />
  </View>
  
  <View style={styles.infoRow}>
    <Text>Location</Text>
    <TextInput value={location} onChangeText={setLocation} />
  </View>
  
  <View style={styles.infoRow}>
    <Text>Website</Text>
    <TextInput value={website} onChangeText={setWebsite} />
  </View>
  
  {/* Save button appears when changes are made */}
  {hasChanges && (
    <Button title="Save Changes" onPress={handleSave} />
  )}
</Card>
```

### 3. Navigation Updates
- Remove profile tab completely
- Update tab bar to show only: Home, Notifications, Settings
- No modals needed - everything inline

### 4. Remove Unnecessary Components
- Delete `UserProfile.tsx` component
- Delete `profile` folder from tabs
- Remove profile completeness tracking (overkill for simple profiles)
- Remove social links section (keep it minimal)

### 5. Update Onboarding
- Remove profile image step
- Keep only essential fields: name, basic info
- Streamline the flow

## File Changes

### Delete These Files:
```
app/app/(tabs)/profile/index.tsx
app/app/(tabs)/profile/edit.tsx
app/app/(tabs)/profile/_layout.tsx
app/components/features/user/UserProfile.tsx
app/components/ui/Avatar.tsx (if exists)
```

### Update These Files:
```
app/app/(tabs)/_layout.tsx - Remove profile tab
app/app/(tabs)/settings/index.tsx - Add profile fields
app/app/(onboarding)/* - Remove image step
types/user.ts - Remove avatar field
```

## Benefits
1. **Simpler UX** - Everything in one place, no navigation needed
2. **Less Code** - Remove entire profile infrastructure
3. **Faster Implementation** - Just extend existing settings
4. **Cleaner Maintenance** - Fewer components to maintain

## Testing Checklist
- [ ] Profile fields save correctly
- [ ] Tab navigation works with 3 tabs
- [ ] Onboarding completes without image step
- [ ] No broken imports from deleted components
- [ ] Dark mode works for all fields
- [ ] Form validation works inline