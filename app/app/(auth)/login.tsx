import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/auth-provider';
import { colors, commonStyles, createStyles, fontSize, spacing } from '../../styles';

const styles = createStyles({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: colors.gray[50],
    },
    formContainer: {
        backgroundColor: colors.white,
        padding: spacing.lg,
        borderRadius: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: fontSize['2xl'],
        fontWeight: 'bold',
        color: colors.gray[900],
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSize.base,
        color: colors.gray[600],
        marginBottom: spacing.lg,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    switchText: {
        textAlign: 'center',
        marginTop: spacing.md,
        color: colors.gray[600],
    },
    linkText: {
        color: colors.primary,
        fontWeight: '500',
    },
    loggedInContainer: {
        ...commonStyles.card,
        alignItems: 'center',
    },
    userEmail: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: colors.gray[900],
        marginBottom: spacing.xs,
    },
    userInfo: {
        fontSize: fontSize.sm,
        color: colors.gray[600],
        marginBottom: spacing.md,
    },
});

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await signIn(email, password);
            // Auth state change will handle navigation
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Authentication failed');
        }
    };


    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <Text style={[styles.title, { textAlign: 'center' }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { textAlign: 'center' }]}>Sign in to continue</Text>

                <View style={styles.inputContainer}>
                    <Text style={commonStyles.label}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={commonStyles.input}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={commonStyles.label}>Password</Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                        style={commonStyles.input}
                    />
                </View>


                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    style={[
                        commonStyles.button,
                        commonStyles.buttonPrimary,
                        loading && { backgroundColor: colors.gray[400] }
                    ]}
                >
                    <Text style={commonStyles.buttonText}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/(auth)/forgot-password')}
                    style={{ paddingVertical: spacing.sm }}
                >
                    <Text style={[styles.switchText, { textAlign: 'center' }]}>
                        Forgot Password?
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.replace('/(auth)/signup')}
                    style={{ paddingVertical: spacing.sm }}
                >
                    <Text style={styles.switchText}>
                        Don't have an account? 
                        <Text style={styles.linkText}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
} 