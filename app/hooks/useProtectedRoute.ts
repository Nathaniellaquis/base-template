import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../providers/auth-provider';

export function useProtectedRoute() {
    const { user, isInitialized } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    
    useEffect(() => {
        if (!isInitialized) return;
        
        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';
        
        if (!user && inAppGroup) {
            // User is not authenticated but trying to access protected routes
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // User is authenticated but on auth screens
            router.replace('/(app)/(tabs)');
        }
    }, [user, isInitialized, segments]);
    
    return { isAuthorized: !!user };
}