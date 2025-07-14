import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SplashScreen() {
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Prevent flash of splash screen for fast loads
        const timer = setTimeout(() => {
            // This ensures splash shows for at least 500ms
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <Text style={styles.logo}>INGRD</Text>
                <Text style={styles.tagline}>Loading your experience...</Text>
                <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logo: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 48,
    },
    loader: {
        marginTop: 20,
    },
});