import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../providers/auth-provider';
import { trpc } from '../../../lib/api';

export default function SettingsScreen() {
    const { user, logout, resetPassword } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isEditing, setIsEditing] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // tRPC mutation for updating user
    const updateUser = trpc.user.update.useMutation({
        onSuccess: () => {
            Alert.alert('Success', 'Profile updated successfully');
            setIsEditing(false);
        },
        onError: (error) => {
            Alert.alert('Error', error.message || 'Failed to update profile');
        },
    });

    const handleUpdateProfile = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Display name cannot be empty');
            return;
        }

        updateUser.mutate({ displayName });
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
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to send reset email');
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            // Auth state change will handle navigation
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };


    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="p-6">
                {/* Profile Section */}
                <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                    <Text className="text-lg font-semibold text-gray-900 mb-4">
                        Profile Information
                    </Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-sm text-gray-600 mb-1">Email</Text>
                            <Text className="text-base text-gray-900">{user?.email}</Text>
                        </View>

                        <View>
                            <Text className="text-sm text-gray-600 mb-1">Display Name</Text>
                            {isEditing ? (
                                <View className="flex-row items-center">
                                    <TextInput
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
                                        placeholder="Enter display name"
                                    />
                                    <TouchableOpacity
                                        onPress={handleUpdateProfile}
                                        disabled={updateUser.isPending}
                                        className={`px-4 py-2 rounded-lg ${updateUser.isPending ? 'bg-gray-400' : 'bg-blue-500'}`}
                                    >
                                        <Text className="text-white font-medium">
                                            {updateUser.isPending ? 'Saving...' : 'Save'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsEditing(false);
                                            setDisplayName(user?.displayName || '');
                                        }}
                                        className="ml-2 px-4 py-2"
                                    >
                                        <Text className="text-gray-600">Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base text-gray-900">
                                        {user?.displayName || 'Not set'}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setIsEditing(true)}
                                        className="px-3 py-1"
                                    >
                                        <Text className="text-blue-500">Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View>
                            <Text className="text-sm text-gray-600 mb-1">User ID</Text>
                            <Text className="text-xs text-gray-500">{user?.uid}</Text>
                        </View>
                    </View>
                </View>

                {/* Preferences Section */}
                <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                    <Text className="text-lg font-semibold text-gray-900 mb-4">
                        Preferences
                    </Text>

                    <View className="space-y-4">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-base text-gray-900">Push Notifications</Text>
                                <Text className="text-sm text-gray-600">
                                    Receive updates and alerts
                                </Text>
                            </View>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#767577', true: '#3B82F6' }}
                            />
                        </View>

                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-base text-gray-900">Dark Mode</Text>
                                <Text className="text-sm text-gray-600">
                                    Coming soon
                                </Text>
                            </View>
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#767577', true: '#3B82F6' }}
                                disabled
                            />
                        </View>
                    </View>
                </View>

                {/* Security Section */}
                <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                    <Text className="text-lg font-semibold text-gray-900 mb-4">
                        Security
                    </Text>

                    <TouchableOpacity
                        onPress={handleResetPassword}
                        className="bg-gray-100 p-4 rounded-lg mb-3"
                    >
                        <Text className="text-gray-900 font-medium">Reset Password</Text>
                        <Text className="text-gray-600 text-sm mt-1">
                            Send password reset email
                        </Text>
                    </TouchableOpacity>

                    {!user?.emailVerified && (
                        <TouchableOpacity
                            className="bg-orange-100 p-4 rounded-lg"
                        >
                            <Text className="text-orange-900 font-medium">Verify Email</Text>
                            <Text className="text-orange-700 text-sm mt-1">
                                Your email is not verified
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Danger Zone */}
                <View className="bg-white rounded-lg p-6 shadow-sm">
                    <Text className="text-lg font-semibold text-red-600 mb-4">
                        Danger Zone
                    </Text>

                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-500 p-4 rounded-lg"
                    >
                        <Text className="text-white font-medium text-center">
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}