import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../../providers/auth-provider';
import { UserProfile } from '../../../components/UserProfile';

export default function ProfileScreen() {
    const { user } = useAuth();

    if (!user) {
        return (
            <View className="flex-1 bg-white p-4 justify-center items-center">
                <Text className="text-gray-500">No profile data available</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="bg-white">
                <UserProfile />
            </View>
            
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                    {user.displayName || 'No Name'}
                </Text>
                <Text className="text-base text-gray-600 mb-4">{user.email}</Text>
                
                {user.emailVerified && (
                    <View className="flex-row items-center mb-4">
                        <Text className="text-green-600 text-sm">✓ Email Verified</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}