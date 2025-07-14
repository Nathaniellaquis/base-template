import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/auth-provider';

export default function SignupScreen() {
    const router = useRouter();
    const { signUp, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await signUp(email, password, displayName);
            // Auth state change will handle navigation
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <View className="flex-1 justify-center px-8">
                <Text className="text-4xl font-bold text-gray-900 mb-2">Create Account</Text>
                <Text className="text-base text-gray-600 mb-8">Sign up to get started</Text>

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Display Name</Text>
                        <TextInput
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="John Doe"
                            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                            autoCapitalize="words"
                        />
                    </View>

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

                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                            secureTextEntry
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSignup}
                    disabled={loading}
                    className={`mt-6 rounded-lg py-3 ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
                >
                    <Text className="text-white text-center font-semibold text-base">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-6">
                    <Text className="text-gray-600">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                        <Text className="text-blue-500 font-semibold">Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}