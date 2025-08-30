import { WorkspaceSection } from '@/components/features/settings/WorkspaceSection';
import { Button, Card, Input, Text } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { useTypedRouter } from '@/hooks/useTypedRouter';
import { trpc } from '@/lib';
import type { AppRouter } from '@/lib/api/trpc';
import { useAdmin } from '@/providers/admin';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/providers/theme';
import { useThemedStyles } from '@/styles';
import type { User } from '@shared';
import type { inferRouterError } from '@trpc/server';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { createSettingsStyles } from './index.styles';

// Helper component for preference rows
const PreferenceSwitch = ({
  title,
  description,
  value,
  onValueChange,
  theme
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: any;
}) => {
  const styles = useThemedStyles(createSettingsStyles);
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceInfo}>
        <Text variant="body">{title}</Text>
        <Text variant="bodySmall">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.colors.gray[400],
          true: theme.colors.primary
        }}
        thumbColor={theme.colors.white}
      />
    </View>
  );
};

export default function SettingsScreen() {
  const { user, signOut, resetPassword, setUser } = useAuth();
  const utils = trpc.useContext();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { isAdmin } = useAdmin();
  const { registerForPushNotifications } = useNotifications();
  const router = useTypedRouter();
  const [isEditing, setIsEditing] = useState(false);
  const styles = useThemedStyles(createSettingsStyles);

  // Form state with initial values from user
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  // Update form data when user changes
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
      });
    }
  }, [user, isEditing]);

  // Notification preferences state - memoized to prevent unnecessary re-renders
  const initialPreferences = useMemo(() => ({
    enabled: user?.notificationPreferences?.enabled ?? true,
    updates: user?.notificationPreferences?.updates ?? true,
    reminders: user?.notificationPreferences?.reminders ?? true,
    social: user?.notificationPreferences?.social ?? true,
  }), [user?.notificationPreferences]);

  const [preferences, setPreferences] = useState(initialPreferences);

  // Update preferences mutation
  const updatePreferences = trpc.notifications.updatePreferences.useMutation();

  useEffect(() => {
    if (updatePreferences.isError) {
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  }, [updatePreferences.isError]);

  // tRPC mutation for updating user
  const updateUser = trpc.user.update.useMutation({
    onSuccess: (updatedUser: User) => {
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      // Update auth provider with returned user data
      if (updatedUser) {
        setUser(updatedUser);
        // Also update React Query cache
        utils.user.get.setData(undefined, updatedUser);
      }
    },
    onError: (error: inferRouterError<AppRouter>) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  });

  const handleUpdateProfile = useCallback(() => {
    const trimmedName = formData.displayName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    updateUser.mutate({
      displayName: trimmedName,
      bio: formData.bio.trim() || undefined,
      location: formData.location.trim() || undefined,
      website: formData.website.trim() || undefined
    });
  }, [formData, updateUser]);

  const handleToggleNotification = useCallback(async (key: keyof typeof preferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    // If enabling notifications for the first time, request permissions
    if (key === 'enabled' && value) {
      const token = await registerForPushNotifications();
      if (!token) {
        setPreferences(prev => ({ ...prev, enabled: false }));
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
        return;
      }
    }

    // Save to backend
    await updatePreferences.mutateAsync(newPrefs);
  }, [preferences, registerForPushNotifications, updatePreferences]);

  const handleResetPassword = useCallback(() => {
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
  }, [resetPassword, user?.email]);

  const handleSignOut = useCallback(() => {
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
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to sign out';
              Alert.alert('Error', message);
            }
          }
        }
      ]
    );
  }, [signOut]);

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
                  value={formData.displayName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
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
                      setFormData({
                        displayName: user?.displayName || '',
                        bio: user?.bio || '',
                        location: user?.location || '',
                        website: user?.website || '',
                      });
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
                  value={formData.bio}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
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
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                  placeholder="Your location"
                  maxLength={100}
                  containerStyle={styles.editInputContainer}
                />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Website</Text>
                <Input
                  value={formData.website}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
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

          <PreferenceSwitch
            title="Push Notifications"
            description="Receive updates and alerts"
            value={preferences.enabled}
            onValueChange={(v) => handleToggleNotification('enabled', v)}
            theme={theme}
          />

          {preferences.enabled && (
            <>
              <PreferenceSwitch
                title="App Updates"
                description="New features and improvements"
                value={preferences.updates}
                onValueChange={(v) => handleToggleNotification('updates', v)}
                theme={theme}
              />

              <PreferenceSwitch
                title="Reminders"
                description="Task reminders and deadlines"
                value={preferences.reminders}
                onValueChange={(v) => handleToggleNotification('reminders', v)}
                theme={theme}
              />

              <PreferenceSwitch
                title="Social Updates"
                description="Comments and mentions"
                value={preferences.social}
                onValueChange={(v) => handleToggleNotification('social', v)}
                theme={theme}
              />
            </>
          )}

          <PreferenceSwitch
            title="Dark Mode"
            description="Switch between light and dark themes"
            value={isDarkMode}
            onValueChange={toggleTheme}
            theme={theme}
          />
        </Card>

        {/* Workspace Section - only shows when enabled */}
        <WorkspaceSection />

        {/* Subscription Section */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Subscription</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.subscriptionInfo}>
              <Text variant="body">Current Plan</Text>
              <View style={{
                backgroundColor: user?.subscription?.plan === 'pro' ? '#667eea' : user?.subscription?.plan === 'enterprise' ? '#059669' : '#6b7280',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                marginTop: 8
              }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' }}>
                  {user?.subscription?.plan || 'free'}
                </Text>
              </View>
              {user?.subscription?.currentPeriodEnd && (
                <Text variant="caption" style={{ marginTop: 8 }}>
                  {user.subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </Text>
              )}
            </View>
          </View>
        </Card>

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