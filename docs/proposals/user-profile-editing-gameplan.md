# User Profile Editing Complete Implementation Gameplan

## Overview
This document outlines the complete implementation plan for a comprehensive user profile editing system. Currently, only basic display name editing exists. This plan adds avatar uploads, extended profile fields, and a proper editing interface.

## Current State Summary

### ✅ Implemented
- Basic user profile display component
- Display name editing (inline in settings)
- User update API endpoint (limited fields)
- Profile setup in onboarding (display name only)
- Firebase configuration ready for storage

### ❌ Missing
- Avatar/photo upload functionality
- Extended profile fields (bio, phone, location, etc.)
- Dedicated profile editing screen
- Image processing and storage
- Comprehensive validation

## Implementation Plan

### Phase 1: Extend User Schema & Backend (Priority: Critical)

#### 1.1 Update User Type Definition
**Following Type Definition Pattern in `/types/user.ts`:**

```typescript
// types/user.ts
import { z } from 'zod';

export interface User {
  // IDs
  uid: string;          // Firebase ID
  _id?: string;         // MongoDB ID (as string)
  
  // Basic info
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  
  // App fields
  role?: 'user' | 'admin';
  onboardingCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // New profile fields
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
  timezone?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  profileCompleteness?: number; // 0-100 percentage
  lastProfileUpdate?: Date;
  
  // Existing fields (notifications, subscription, etc.)
  pushTokens?: string[];
  notificationPreferences?: NotificationPreferences;
  stripeCustomerId?: string;
  subscription?: UserSubscription;
}

// Update existing schema following pattern
export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  location: z.string().max(100).optional(),
  timezone: z.string().optional(),
  website: z.string().url().optional(),
  socialLinks: z.object({
    twitter: z.string().max(50).optional(),
    linkedin: z.string().max(100).optional(),
    github: z.string().max(50).optional(),
    instagram: z.string().max(50).optional(),
  }).optional(),
});

// Type for avatar upload
export const uploadAvatarSchema = z.object({
  imageBase64: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
```

#### 1.2 Create Avatar Upload Endpoint
**Following Router Pattern:**

```
server/routers/user/
├── index.ts                      # Router definition (update)
├── get-user.ts                   # Existing
├── create-user.ts               # Existing
├── update-user.ts               # Existing (enhance)
└── upload-avatar.ts             # New procedure
```

**Implementation Following Procedure Pattern:**
```typescript
// server/routers/user/upload-avatar.ts
import { protectedProcedure } from '@/trpc/trpc';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { getUserCollection } from '@/db';
import { errors } from '@/utils/errors';
import { uploadAvatarSchema } from '@shared/types/user';
import { ObjectId } from 'mongodb';
import sharp from 'sharp';

export const uploadAvatar = protectedProcedure
  .input(uploadAvatarSchema)
  .mutation(async ({ ctx, input }) => {
    const bucket = getStorage().bucket();
    const userId = ctx.user.uid;
    const usersCollection = getUserCollection();
    
    try {
      // Process image
      const buffer = Buffer.from(input.imageBase64, 'base64');
      const processedImage = await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Upload to Firebase Storage
      const fileName = `avatars/${userId}_${Date.now()}.jpg`;
      const file = bucket.file(fileName);
      
      await file.save(processedImage, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: { userId }
        }
      });
      
      // Make file public and get URL
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      // Delete old avatar if exists
      if (ctx.user.avatarUrl) {
        const oldFileName = ctx.user.avatarUrl.split('/').pop();
        if (oldFileName) {
          const oldFile = bucket.file(`avatars/${oldFileName}`);
          await oldFile.delete().catch(() => {}); // Ignore if doesn't exist
        }
      }
      
      // Update user document following pattern
      const updatedUserResult = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(ctx.user._id) },
        { 
          $set: { 
            avatarUrl: publicUrl, 
            lastProfileUpdate: new Date(),
            updatedAt: new Date()
          } 
        },
        { returnDocument: 'after' }
      );
      
      if (!updatedUserResult) {
        throw errors.notFound('User');
      }
      
      // Return full user following pattern
      return mongoDocToUser(updatedUserResult);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid image')) {
        throw errors.badRequest('Invalid image format');
      }
      throw error;
    }
  });
```

**Update Router Index:**
```typescript
// server/routers/user/index.ts
import { router } from '@/trpc/trpc';
import { getUser } from './get-user';
import { createUser } from './create-user';
import { updateUser } from './update-user';
import { uploadAvatar } from './upload-avatar';

export const userRouter = router({
  get: getUser,
  create: createUser,
  update: updateUser,
  uploadAvatar: uploadAvatar, // Add new procedure
});
```

#### 1.3 Add Profile Completeness Calculator
**Following Service Pattern:**

```
server/services/user/
├── create-user.ts                # Existing
├── find-user-by-uid.ts          # Existing
├── set-user-custom-claims.ts    # Existing
└── calculate-profile-completeness.ts  # New service
```

**Implementation:**
```typescript
// server/services/user/calculate-profile-completeness.ts
import type { User } from '@shared/types/user';

/**
 * Calculate user profile completeness percentage
 * @param user - User document
 * @returns Completeness percentage (0-100)
 */
export function calculateProfileCompleteness(user: User): number {
  const fields = [
    { value: user.displayName, weight: 20 },
    { value: user.avatarUrl, weight: 20 },
    { value: user.bio, weight: 15 },
    { value: user.phoneNumber, weight: 10 },
    { value: user.location, weight: 10 },
    { value: user.website, weight: 5 },
    { value: user.socialLinks?.twitter, weight: 5 },
    { value: user.socialLinks?.linkedin, weight: 5 },
    { value: user.socialLinks?.github, weight: 5 },
    { value: user.socialLinks?.instagram, weight: 5 },
  ];
  
  const completeness = fields.reduce((acc, field) => {
    return acc + (field.value ? field.weight : 0);
  }, 0);
  
  return Math.min(completeness, 100);
}
```

**Update User on Profile Changes:**
```typescript
// In update-user.ts and upload-avatar.ts, add:
import { calculateProfileCompleteness } from '@/services/user/calculate-profile-completeness';

// After updating user fields
const profileCompleteness = calculateProfileCompleteness(updatedUser);

// Include in update
await usersCollection.findOneAndUpdate(
  { _id: new ObjectId(userId) },
  { 
    $set: { 
      ...updateData,
      profileCompleteness,
      updatedAt: new Date()
    }
  }
);
```

### Phase 2: Create Profile Editing UI (Priority: Critical)

#### 2.1 Create Profile Edit Screen
**Following Screen Pattern:**

```
app/app/(tabs)/profile/
├── index.tsx                     # Profile display (existing)
├── index.styles.ts              # Profile styles (existing)
├── edit.tsx                     # Edit screen (new)
└── edit.styles.ts              # Edit styles (new)
```

**Implementation Following Screen Pattern:**
```typescript
// app/app/(tabs)/profile/edit.tsx
import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemedStyles } from '@/styles';
import { createProfileEditStyles } from './edit.styles';
import { AvatarPicker, FormSection, LoadingOverlay } from '@/components';
import { Input, Button, Text } from '@/components/ui';
import { useAuth } from '@/hooks';
import { trpc } from '@/lib/api';
import { handleError } from '@/utils/error-handler';
import { showSuccess } from '@/utils/toast';
import { profileValidation } from '@/utils/profile-validation';

export default function ProfileEditScreen() {
  const styles = useThemedStyles(createProfileEditStyles);
  const router = useRouter();
  const { user, setUser } = useAuth();
  const utils = trpc.useUtils();
  
  // Form state following pattern
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    phoneNumber: user?.phoneNumber || '',
    location: user?.location || '',
    website: user?.website || '',
    socialLinks: user?.socialLinks || {},
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Mutations following pattern
  const updateUser = trpc.user.update.useMutation({
    onSuccess: (updatedUser) => {
      // Update auth context
      setUser(updatedUser);
      // Update cache
      utils.user.get.setData(undefined, updatedUser);
      showSuccess('Profile updated successfully');
      router.back();
    },
    onError: (error) => {
      handleError(error, 'Failed to update profile');
    },
  });
  
  const uploadAvatar = trpc.user.uploadAvatar.useMutation({
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      utils.user.get.setData(undefined, updatedUser);
      showSuccess('Profile photo updated');
    },
    onError: (error) => {
      handleError(error, 'Failed to upload photo');
    },
  });
  
  // Field update handler
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change
    const validator = profileValidation[field];
    if (validator) {
      const error = validator(value);
      setErrors(prev => ({ ...prev, [field]: error || '' }));
    }
  }, []);
  
  // Handle avatar upload
  const handleAvatarUpload = async (base64: string, mimeType: string) => {
    setUploadingAvatar(true);
    try {
      await uploadAvatar.mutateAsync({ imageBase64: base64, mimeType });
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  // Save handler
  const handleSave = async () => {
    // Validate all fields
    const validationErrors: Record<string, string> = {};
    let hasErrors = false;
    
    Object.keys(formData).forEach(field => {
      const validator = profileValidation[field];
      if (validator) {
        const error = validator(formData[field]);
        if (error) {
          validationErrors[field] = error;
          hasErrors = true;
        }
      }
    });
    
    if (hasErrors) {
      setErrors(validationErrors);
      handleError(new Error('Please fix the errors before saving'));
      return;
    }
    
    await updateUser.mutateAsync(formData);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Button
            title="Cancel"
            variant="text"
            onPress={() => router.back()}
          />
          <Text variant="h3">Edit Profile</Text>
          <Button
            title="Save"
            variant="text"
            onPress={handleSave}
            loading={updateUser.isLoading}
          />
        </View>
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AvatarPicker
            currentAvatar={user?.avatarUrl}
            onImageSelected={handleAvatarUpload}
          />
          
          <FormSection title="Basic Info">
            <Input
              label="Display Name"
              value={formData.displayName}
              onChangeText={(text) => updateField('displayName', text)}
              maxLength={50}
              error={errors.displayName}
            />
            
            <Input
              label="Bio"
              value={formData.bio}
              onChangeText={(text) => updateField('bio', text)}
              maxLength={500}
              multiline
              numberOfLines={4}
              placeholder="Tell us about yourself..."
              error={errors.bio}
            />
          </FormSection>
          
          {/* Rest of form sections... */}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {uploadingAvatar && <LoadingOverlay message="Uploading photo..." />}
    </SafeAreaView>
  );
}
```

**Style File:**
```typescript
// app/app/(tabs)/profile/edit.styles.ts
// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createProfileEditStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollContent: {
    paddingVertical: theme.spacing.lg,
  },
});
```

#### 2.2 Create Avatar Picker Component
**Following Component Pattern:**

```
app/components/features/profile/
├── AvatarPicker/
│   ├── index.tsx
│   └── index.styles.ts
├── FormSection/
│   ├── index.tsx
│   └── index.styles.ts
├── SocialLinkInput/
│   ├── index.tsx
│   └── index.styles.ts
└── index.ts                      # Barrel export
```

**Implementation:**
```typescript
// app/components/features/profile/AvatarPicker/index.tsx
import React from 'react';
import { TouchableOpacity, View, Image, Alert } from 'react-native';
import { Text } from '@/components/ui';
import { useThemedStyles } from '@/styles';
import { createAvatarPickerStyles } from './index.styles';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { handleError } from '@/utils/error-handler';

interface AvatarPickerProps {
  currentAvatar?: string;
  onImageSelected: (base64: string, mimeType: string) => void;
}

export function AvatarPicker({ currentAvatar, onImageSelected }: AvatarPickerProps) {
  const styles = useThemedStyles(createAvatarPickerStyles);
  
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a profile picture.'
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Resize and compress
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        onImageSelected(base64, 'image/jpeg');
      }
    } catch (error) {
      handleError(error, 'Failed to select image');
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={pickImage} 
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {currentAvatar ? (
          <Image source={{ uri: currentAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={32} color={styles.placeholderIcon} />
            <Text variant="caption" color="secondary">Add Photo</Text>
          </View>
        )}
        <View style={styles.editBadge}>
          <Ionicons name="pencil" size={16} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

**Style File:**
```typescript
// app/components/features/profile/AvatarPicker/index.styles.ts
import { Theme } from '@/types/theme';

export const createAvatarPickerStyles = (theme: Theme) => ({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  placeholderIcon: theme.colors.textSecondary,
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
});
```

#### 2.3 Update Profile Display Component
**Update Existing Component Following Pattern:**

```typescript
// app/components/features/user/UserProfile.tsx
import React, { useMemo } from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Text, Button } from '@/components/ui';
import { Avatar, ProfileCompletenessBar, InfoRow, SocialLinks } from '@/components';
import { useAuth } from '@/hooks';
import { useThemedStyles } from '@/styles';
import { createUserProfileStyles } from './UserProfile.styles';
import { Ionicons } from '@expo/vector-icons';
import { calculateProfileCompleteness } from '@/utils/profile-utils';

export function UserProfile() {
  const styles = useThemedStyles(createUserProfileStyles);
  const { user } = useAuth();
  const router = useRouter();
  
  const profileCompleteness = useMemo(
    () => user ? calculateProfileCompleteness(user) : 0,
    [user]
  );
  
  if (!user) {
    return null;
  }
  
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Avatar 
          uri={user.avatarUrl} 
          name={user.displayName || user.email}
          size={80}
        />
        <TouchableOpacity 
          onPress={() => router.push('/profile/edit')}
          style={styles.editButton}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={20} color={styles.editButtonIcon} />
          <Text variant="body" color="primary">Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      {profileCompleteness < 100 && (
        <ProfileCompletenessBar 
          percentage={profileCompleteness}
          style={styles.completenessBar}
        />
      )}
      
      <View style={styles.info}>
        <InfoRow 
          label="Name" 
          value={user.displayName || 'Not set'}
          style={styles.infoRow}
        />
        <InfoRow 
          label="Email" 
          value={user.email} 
          verified={user.emailVerified}
          style={styles.infoRow}
        />
        {user.bio && (
          <InfoRow 
            label="Bio" 
            value={user.bio} 
            multiline
            style={styles.infoRow}
          />
        )}
        {user.location && (
          <InfoRow 
            label="Location" 
            value={user.location}
            style={styles.infoRow}
          />
        )}
        {user.website && (
          <InfoRow 
            label="Website" 
            value={user.website} 
            onPress={() => Linking.openURL(user.website!)}
            style={styles.infoRow}
          />
        )}
      </View>
      
      {user.socialLinks && Object.keys(user.socialLinks).length > 0 && (
        <SocialLinks 
          links={user.socialLinks}
          style={styles.socialLinks}
        />
      )}
    </Card>
  );
}
```

**Create Missing Components:**
```typescript
// app/components/ui/Avatar/index.tsx
import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '../Text';
import { useThemedStyles } from '@/styles';
import { createAvatarStyles } from './index.styles';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const styles = useThemedStyles(createAvatarStyles);
  
  const initials = name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  
  return (
    <View style={[
      styles.container,
      { width: size, height: size, borderRadius: size / 2 }
    ]}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <Text variant="body" weight="semibold" color="white">
          {initials}
        </Text>
      )}
    </View>
  );
}
```

### Phase 3: Form Validation & Error Handling (Priority: High)

#### 3.1 Create Validation Utilities
**Following Utils Pattern:**

```
app/utils/
├── error-handler.ts              # Existing
├── toast.ts                      # Existing
├── format.ts                     # Existing
└── profile-validation.ts         # New utility
```

**Implementation:**
```typescript
// app/utils/profile-validation.ts
/**
 * Profile field validation utilities
 */

type ValidationResult = string | null;
type Validator = (value: any) => ValidationResult;

interface ProfileValidators {
  displayName: Validator;
  bio: Validator;
  phoneNumber: Validator;
  location: Validator;
  website: Validator;
  socialLinks: {
    twitter: Validator;
    linkedin: Validator;
    github: Validator;
    instagram: Validator;
  };
}

export const profileValidation: ProfileValidators = {
  displayName: (value: string): ValidationResult => {
    if (!value || !value.trim()) {
      return 'Display name is required';
    }
    if (value.length > 50) {
      return 'Maximum 50 characters';
    }
    if (!/^[a-zA-Z0-9 ._-]+$/.test(value)) {
      return 'Only letters, numbers, and basic punctuation allowed';
    }
    return null;
  },
  
  bio: (value: string): ValidationResult => {
    if (value && value.length > 500) {
      return 'Maximum 500 characters';
    }
    return null;
  },
  
  phoneNumber: (value: string): ValidationResult => {
    if (value && !/^\+?[1-9]\d{1,14}$/.test(value)) {
      return 'Invalid phone number format (e.g., +1234567890)';
    }
    return null;
  },
  
  location: (value: string): ValidationResult => {
    if (value && value.length > 100) {
      return 'Maximum 100 characters';
    }
    return null;
  },
  
  website: (value: string): ValidationResult => {
    if (value) {
      try {
        new URL(value);
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'URL must start with http:// or https://';
        }
      } catch {
        return 'Invalid URL format';
      }
    }
    return null;
  },
  
  socialLinks: {
    twitter: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9_]{1,15}$/.test(value)) {
        return 'Invalid Twitter username (1-15 characters, no @)';
      }
      return null;
    },
    
    linkedin: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9-]{3,100}$/.test(value)) {
        return 'Invalid LinkedIn username';
      }
      return null;
    },
    
    github: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9-]{1,39}$/.test(value)) {
        return 'Invalid GitHub username';
      }
      return null;
    },
    
    instagram: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9_.]{1,30}$/.test(value)) {
        return 'Invalid Instagram username';
      }
      return null;
    },
  },
};

/**
 * Validate all profile fields
 */
export function validateProfileData(data: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  Object.entries(data).forEach(([field, value]) => {
    if (field === 'socialLinks' && typeof value === 'object') {
      Object.entries(value).forEach(([platform, username]) => {
        const validator = profileValidation.socialLinks[platform as keyof typeof profileValidation.socialLinks];
        if (validator) {
          const error = validator(username);
          if (error) {
            errors[`socialLinks.${platform}`] = error;
          }
        }
      });
    } else {
      const validator = profileValidation[field as keyof typeof profileValidation];
      if (validator && typeof validator === 'function') {
        const error = validator(value);
        if (error) {
          errors[field] = error;
        }
      }
    }
  });
  
  return errors;
}
```

#### 3.2 Add Error States to Form
**Following Form Handling Pattern:**

```typescript
// In ProfileEditScreen component
const [errors, setErrors] = useState<Record<string, string>>({});

// Field validation on change
const updateField = useCallback((field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Validate on change following pattern
  if (field === 'socialLinks') {
    // Handle nested validation
    Object.entries(value).forEach(([platform, username]) => {
      const validator = profileValidation.socialLinks[platform as keyof typeof profileValidation.socialLinks];
      if (validator) {
        const error = validator(username);
        setErrors(prev => ({ 
          ...prev, 
          [`socialLinks.${platform}`]: error || '' 
        }));
      }
    });
  } else {
    const validator = profileValidation[field as keyof typeof profileValidation];
    if (validator && typeof validator === 'function') {
      const error = validator(value);
      setErrors(prev => ({ ...prev, [field]: error || '' }));
    }
  }
}, []);

// Save handler following error handling pattern
const handleSave = async () => {
  // Validate all fields
  const validationErrors = validateProfileData(formData);
  
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    handleError(new Error('Please fix the errors before saving'));
    return;
  }
  
  // Clear errors
  setErrors({});
  
  // Use mutation (already handles success/error)
  await updateUser.mutateAsync(formData);
};

// Component usage example
<Input
  label="Display Name"
  value={formData.displayName}
  onChangeText={(text) => updateField('displayName', text)}
  error={errors.displayName}
  maxLength={50}
/>
```

### Phase 4: Performance & UX Enhancements (Priority: Medium)

#### 4.1 Add Image Optimization
```typescript
// Add image caching
import FastImage from 'react-native-fast-image';

// Use FastImage for avatars
<FastImage
  source={{ uri: avatarUrl, priority: FastImage.priority.high }}
  style={styles.avatar}
  resizeMode={FastImage.resizeMode.cover}
/>
```

#### 4.2 Follow Codebase Update Pattern
**Note: The codebase uses pessimistic updates, not optimistic updates**

```typescript
// Following the existing pattern from the codebase:
const updateUser = trpc.user.update.useMutation({
  onSuccess: (updatedUser) => {
    // Update auth context immediately
    setUser(updatedUser);
    
    // Update React Query cache directly
    utils.user.get.setData(undefined, updatedUser);
    
    // Show success feedback
    showSuccess('Profile updated successfully');
    
    // Navigate back
    router.back();
  },
  onError: (error) => {
    handleError(error, 'Failed to update profile');
  },
});

// The codebase pattern returns full updated data from mutations,
// so no need for optimistic updates or refetching
```

#### 4.3 Add Loading States
```typescript
export function ProfileEditScreen() {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const handleAvatarUpload = async (base64: string, mimeType: string) => {
    setUploadingAvatar(true);
    try {
      const { avatarUrl } = await uploadAvatar.mutateAsync({ 
        imageBase64: base64, 
        mimeType 
      });
      // Update local state
      setUser(prev => ({ ...prev, avatarUrl }));
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  return (
    <>
      {uploadingAvatar && <LoadingOverlay message="Uploading photo..." />}
      {savingProfile && <LoadingOverlay message="Saving profile..." />}
      {/* Rest of UI */}
    </>
  );
}
```

### Phase 5: Additional Features (Priority: Low)

#### 5.1 Profile Privacy Settings
```typescript
// Add to user schema
privacySettings?: {
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  profileVisibility?: 'public' | 'private' | 'connections';
};
```

#### 5.2 Profile Themes/Customization
```typescript
// Add profile customization options
profileTheme?: {
  headerColor?: string;
  accentColor?: string;
  coverImage?: string;
};
```

#### 5.3 Profile Analytics
```typescript
// Track profile views and interactions
profileStats?: {
  views?: number;
  lastViewed?: Date[];
  profileCompletionHistory?: Array<{
    date: Date;
    percentage: number;
  }>;
};
```

## Implementation Timeline

### Week 1: Backend & Schema
- Extend user schema with new fields
- Implement avatar upload endpoint
- Add profile completeness calculation
- Update user update endpoint

### Week 2: Core UI Implementation
- Create profile edit screen
- Build avatar picker component
- Update profile display component
- Add navigation and routing

### Week 3: Validation & Polish
- Implement form validation
- Add error handling
- Create loading states
- Add optimistic updates

### Week 4: Testing & Optimization
- Test all edge cases
- Optimize image handling
- Add accessibility features
- Update documentation

## Technical Considerations

### 1. Image Storage
```typescript
// Firebase Storage rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}_{timestamp}.jpg {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.uid == userId &&
                     request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

### 2. Database Indexes
```typescript
// Add indexes for profile queries
db.users.createIndex({ "socialLinks.twitter": 1 });
db.users.createIndex({ "location": 1 });
db.users.createIndex({ "profileCompleteness": -1 });
```

### 3. Caching Strategy
**Following Codebase Cache Configuration:**

```typescript
// The codebase uses default React Query settings:
// From app/providers/trpc/index.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,          // Use cache when available
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',    // Use cache when offline
    },
  },
});

// Usage in components (uses defaults):
const { data: user } = trpc.user.get.useQuery();

// Direct cache updates after mutations:
const uploadAvatar = trpc.user.uploadAvatar.useMutation({
  onSuccess: (updatedUser) => {
    // Update cache directly - no refetch needed
    utils.user.get.setData(undefined, updatedUser);
  },
});
```

## Success Metrics

1. **User Engagement**
   - 60% of users complete their profile within first week
   - Average profile completeness > 70%
   - 80% of users upload avatar

2. **Technical Performance**
   - Avatar upload < 3 seconds
   - Profile save < 1 second
   - Zero data loss on saves

3. **User Satisfaction**
   - < 5% error rate on saves
   - 90% success rate on first attempt
   - Positive user feedback

## Next Steps

1. **Immediate Actions**
   - Review and approve schema changes
   - Set up Firebase Storage rules
   - Create design mockups

2. **Development**
   - Start with backend implementation
   - Build UI components in parallel
   - Integrate and test

3. **Launch**
   - Beta test with small group
   - Gather feedback
   - Iterate and improve

## Conclusion

The user profile editing system requires significant implementation across backend, frontend, and infrastructure. The plan prioritizes core functionality (avatar upload and basic fields) before adding advanced features. With proper execution, this can be completed in 4 weeks and will significantly enhance user engagement and personalization in the app.