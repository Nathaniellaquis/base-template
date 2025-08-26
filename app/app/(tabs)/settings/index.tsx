import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/providers/theme';
import { useAdmin } from '@/providers/admin';
import { useTypedRouter } from '@/hooks/useTypedRouter';
import { trpc } from '@/lib';
import { useThemedStyles } from '@/styles';
import { createSettingsStyles } from './index.styles';
import { Button, Card, Input, Text } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { SubscriptionSection } from '@/components/features/payment/SubscriptionSection';
import type { User } from '@shared';

export default function SettingsScreen() {
  const { user, signOut, resetPassword, setUser } = useAuth();
  const utils = trpc.useContext();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { isAdmin } = useAdmin();
  const { registerForPushNotifications } = useNotifications();
  const router = useTypedRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [isEditing, setIsEditing] = useState(false);
  const styles = useThemedStyles(createSettingsStyles);
  
  // Notification preferences state
  const [preferences, setPreferences] = useState({
    enabled: user?.notificationPreferences?.enabled ?? true,
    updates: user?.notificationPreferences?.updates ?? true,
    reminders: user?.notificationPreferences?.reminders ?? true,
    social: user?.notificationPreferences?.social ?? true,
  });
  
  // Update preferences mutation
  const updatePreferences = trpc.notifications.updatePreferences.useMutation();
  
  useEffect(() => {
    if (updatePreferences.isError) {
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  }, [updatePreferences.isError]);

  // tRPC mutation for updating user
  const updateUser = trpc.user.update.useMutation({
    onSuccess: (updatedUser) => {
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      // Update auth provider with returned user data
      if (updatedUser) {
        setUser(updatedUser);
        // Also update React Query cache
        utils.user.get.setData(undefined, updatedUser);
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  });

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    updateUser.mutate({ 
      displayName,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      website: website.trim() || undefined
    });
  };
  
  const handleToggleNotification = async (key: string, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    // If enabling notifications for the first time, request permissions
    if (key === 'enabled' && value) {
      const token = await registerForPushNotifications();
      if (!token) {
        setPreferences({ ...preferences, enabled: false });
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
        return;
      }
    }
    
    // Save to backend
    await updatePreferences.mutateAsync(newPrefs);
  };

  const handleResetPassword = async () => {
    Alert.alert(
      'Reset Password',
      'Are you sure you want to reset your password? An email will be sent to your registered email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await resetPassword(user?.email || '');
              Alert.alert('Success', 'Password reset email sent');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to send reset email';
              Alert.alert('Error', message);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled by auth state change in _layout.tsx
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to sign out';
              Alert.alert('Error', message);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Profile Section */}
        <Card style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Profile Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text variant="body">{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Display Name</Text>
            {isEditing ? (
              <View style={styles.editRow}>
                <Input
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                  containerStyle={styles.editInputContainer}
                />
                <View style={styles.editButtonsContainer}>
                  <Button
                    title="Save"
                    size="small"
                    onPress={handleUpdateProfile}
                    loading={updateUser.isPending}
                    disabled={updateUser.isPending}
                  />
                  <Button
                    title="Cancel"
                    size="small"
                    variant="secondary"
                    onPress={() => {
                      setIsEditing(false);
                      setDisplayName(user?.displayName || '');
                      setBio(user?.bio || '');
                      setLocation(user?.location || '');
                      setWebsite(user?.website || '');
                    }}
                    style={styles.saveButton}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.editableRow}>
                <Text variant="body">
                  {user?.displayName || 'Not set'}
                </Text>
                <Text 
                  variant="link" 
                  style={styles.editLink}
                  onPress={() => setIsEditing(true)}
                >
                  Edit
                </Text>
              </View>
            )}
          </View>

          {isEditing && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Bio</Text>
                <Input
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  containerStyle={styles.editInputContainer}
                />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Location</Text>
                <Input
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Your location"
                  maxLength={100}
                  containerStyle={styles.editInputContainer}
                />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Website</Text>
                <Input
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://example.com"
                  keyboardType="url"
                  autoCapitalize="none"
                  containerStyle={styles.editInputContainer}
                />
              </View>
            </>
          )}

          {!isEditing && (
            <>
              {user?.bio && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Bio</Text>
                  <Text variant="body">{user.bio}</Text>
                </View>
              )}
              
              {user?.location && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Location</Text>
                  <Text variant="body">{user.location}</Text>
                </View>
              )}
              
              {user?.website && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Website</Text>
                  <Text variant="body">{user.website}</Text>
                </View>
              )}
            </>
          )}

          <View>
            <Text style={styles.label}>User ID</Text>
            <Text variant="caption">{user?.uid}</Text>
          </View>
        </Card>

        {/* Preferences Section */}
        <Card style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Preferences
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text variant="body">Push Notifications</Text>
              <Text variant="bodySmall">
                Receive updates and alerts
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(v) => handleToggleNotification('enabled', v)}
              trackColor={{ 
                false: theme.colors.gray[400], 
                true: theme.colors.primary 
              }}
              thumbColor={theme.colors.white}
            />
          </View>
          
          {preferences.enabled && (
            <>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <Text variant="body">App Updates</Text>
                  <Text variant="bodySmall">
                    New features and improvements
                  </Text>
                </View>
                <Switch
                  value={preferences.updates}
                  onValueChange={(v) => handleToggleNotification('updates', v)}
                  trackColor={{ 
                    false: theme.colors.gray[400], 
                    true: theme.colors.primary 
                  }}
                  thumbColor={theme.colors.white}
                />
              </View>
              
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <Text variant="body">Reminders</Text>
                  <Text variant="bodySmall">
                    Task reminders and deadlines
                  </Text>
                </View>
                <Switch
                  value={preferences.reminders}
                  onValueChange={(v) => handleToggleNotification('reminders', v)}
                  trackColor={{ 
                    false: theme.colors.gray[400], 
                    true: theme.colors.primary 
                  }}
                  thumbColor={theme.colors.white}
                />
              </View>
              
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <Text variant="body">Social Updates</Text>
                  <Text variant="bodySmall">
                    Comments and mentions
                  </Text>
                </View>
                <Switch
                  value={preferences.social}
                  onValueChange={(v) => handleToggleNotification('social', v)}
                  trackColor={{ 
                    false: theme.colors.gray[400], 
                    true: theme.colors.primary 
                  }}
                  thumbColor={theme.colors.white}
                />
              </View>
            </>
          )}

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text variant="body">Dark Mode</Text>
              <Text variant="bodySmall">
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ 
                false: theme.colors.gray[400], 
                true: theme.colors.primary 
              }}
              thumbColor={theme.colors.white}
            />
          </View>
        </Card>

        {/* Subscription Section */}
        <SubscriptionSection />

        {/* Security Section */}
        <Card style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Security
          </Text>

          <Button
            title="Reset Password"
            variant="secondary"
            onPress={handleResetPassword}
            style={styles.buttonSpacing}
          />

          {!user?.emailVerified && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningTitle}>
                Verify Email
              </Text>
              <Text style={styles.warningText}>
                Your email is not verified
              </Text>
            </View>
          )}
        </Card>

        {/* Admin Section */}
        {isAdmin && (
          <Card style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Admin Access
            </Text>
            
            <Button
              title="Open Admin Dashboard"
              variant="primary"
              onPress={() => router.push('/(admin)')}
              style={styles.buttonSpacing}
            />
          </Card>
        )}

        {/* Danger Zone */}
        <Card>
          <Text variant="h3" style={[styles.sectionTitle, styles.dangerTitle]}>
            Danger Zone
          </Text>

          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleSignOut}
          />
        </Card>
      </View>
    </ScrollView>
  );
}