import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/auth-provider';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { resetPassword, loading } = useAuth();
    const [email, setEmail] = useState('');

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        try {
            await resetPassword(email);
            Alert.alert(
                'Password Reset Email Sent',
                'Check your email for instructions to reset your password.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <View className="flex-1 justify-center px-8">
                <Text className="text-4xl font-bold text-gray-900 mb-2">Reset Password</Text>
                <Text className="text-base text-gray-600 mb-8">
                    Enter your email and we'll send you instructions to reset your password.
                </Text>

                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@example.com"
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={loading}
                    className={`mt-6 rounded-lg py-3 ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
                >
                    <Text className="text-white text-center font-semibold text-base">
                        {loading ? 'Sending...' : 'Send Reset Email'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="mt-6"
                >
                    <Text className="text-blue-500 text-center font-semibold">
                        Back to Login
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}