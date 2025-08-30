import { auth } from '@/config';
import { queryClient, trpcClient } from '@/lib/api';
import { crashReporter } from '@/lib/crash-reporter';
import { classifyError } from '@/utils/error-classifier';
import { User } from '@shared';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isInitialized: boolean;
    networkError: boolean;
    token: string | null;
    error: Error | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    retryConnection: () => Promise<void>;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [minLoadTimeElapsed, setMinLoadTimeElapsed] = useState(false);

    // Ensure splash screen shows for at least 1.5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('[AuthProvider] Minimum load time elapsed');
            setMinLoadTimeElapsed(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Retry connection for network errors
    const retryConnection = async () => {
        if (!auth.currentUser) {
            setNetworkError(false);
            setIsInitialized(true);
            return;
        }

        setLoading(true);
        setNetworkError(false);

        try {
            // Get fresh token
            const authToken = await auth.currentUser.getIdToken(true);
            setToken(authToken);

            // Fetch user data
            const userProfile = await trpcClient.user.get.query();
            setUser(userProfile);
            setError(null);
            setIsInitialized(true);

            // Update crash reporter
            crashReporter.setUser({
                id: userProfile._id || '',
                email: userProfile.email
            });
        } catch (error: any) {
            console.error('[AuthProvider] Retry connection failed:', error);
            const { isConnectionIssue, isAuthIssue } = classifyError(error);
            setError(error as Error);

            if (isConnectionIssue) {
                setNetworkError(true);
            } else if (isAuthIssue) {
                // Auth error - clear state
                setUser(null);
                setToken(null);
                setIsInitialized(true);
            }
        } finally {
            setLoading(false);
        }
    };

    // Simplified refreshUser - only needed for initial auth or manual refresh
    // Most updates now come from mutation responses
    const refreshUser = async () => {
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            // Get fresh token
            const token = await auth.currentUser.getIdToken(true);
            setToken(token);

            // Fetch user data
            const userProfile = await trpcClient.user.get.query();
            setUser(userProfile);
            setError(null);
            setNetworkError(false);
        } catch (error: any) {
            console.error('Failed to refresh user:', error);
            const { isConnectionIssue } = classifyError(error);

            if (!isConnectionIssue) {
                // Only clear state for non-connection errors
                setUser(null);
                setToken(null);
            }
            setError(error as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isComplete = false;
        let initTimeout: ReturnType<typeof setTimeout>;
        
        // Single exit point for initialization - DRY principle
        const completeInitialization = (params: {
            user?: User | null;
            networkError?: boolean;
            error?: Error | null;
        }) => {
            console.log('[AuthProvider] Completing initialization with:', {
                hasUser: !!params.user,
                userId: params.user?._id,
                networkError: params.networkError,
                hasError: !!params.error,
                isComplete,
                isInitialized
            });
            
            // If we already initialized and this is just a user update, always allow it
            if (isComplete && params.user) {
                console.log('[AuthProvider] Updating user after initialization');
                setUser(params.user);
                setLoading(false);
                
                // Update crash reporter
                crashReporter.setUser({
                    id: params.user._id || '',
                    email: params.user.email
                });
                return;
            }
            
            // Prevent multiple completions only for non-user updates
            if (isComplete && !params.user) {
                console.log('[AuthProvider] Skipping duplicate completion');
                return;
            }
            
            // Clear timeout since we're completing
            if (initTimeout) clearTimeout(initTimeout);
            
            // Update state based on params
            setUser(params.user || null);
            setNetworkError(params.networkError || false);
            setError(params.error || null);
            setIsInitialized(true);
            setLoading(false);
            
            // Update crash reporter
            if (params.user && params.user._id) {
                crashReporter.setUser({
                    id: params.user._id || '',
                    email: params.user.email
                });
            } else {
                crashReporter.setUser(null);
            }
            
            // Mark as complete only after updating state
            isComplete = true;
        };

        // Timeout ensures we never hang forever
        initTimeout = setTimeout(() => {
            console.warn('[AuthProvider] Initialization timeout - assuming network issue');
            completeInitialization({ networkError: true });
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            setLoading(true);

            try {
                if (!authUser) {
                    // No Firebase user - go to auth
                    completeInitialization({ user: null });
                    return;
                }

                // Have Firebase user - get token and profile
                const authToken = await authUser.getIdToken();
                setToken(authToken);

                // Fetch user profile with retry logic
                let userProfile = null;
                for (let retry = 0; retry < 3; retry++) {
                    try {
                        userProfile = await trpcClient.user.get.query();
                        break; // Success - exit retry loop
                    } catch (fetchError: any) {
                        if (retry === 2) { // Last retry failed
                            console.error('[AuthProvider] Failed to fetch user profile after retries:', fetchError?.message);
                            const { isConnectionIssue } = classifyError(fetchError);
                            
                            if (isConnectionIssue) {
                                completeInitialization({ networkError: true, error: fetchError });
                                return;
                            }
                            throw fetchError; // Re-throw non-network errors
                        }
                        // Wait before retry (backend might be creating user)
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                // Success - we have user profile
                console.log('[AuthProvider] User profile fetched successfully:', {
                    userId: userProfile?._id,
                    email: userProfile?.email,
                    onboardingCompleted: userProfile?.onboardingCompleted
                });
                completeInitialization({ user: userProfile });
                
            } catch (error: any) {
                const { isConnectionIssue, isAuthIssue } = classifyError(error);
                
                if (isConnectionIssue) {
                    completeInitialization({ networkError: true, error });
                } else {
                    // Auth error or unknown - clear user and go to auth
                    completeInitialization({ user: null, error });
                }
            }
        });

        return () => {
            isComplete = true; // Prevent completion after unmount
            clearTimeout(initTimeout);
            unsubscribe();
        };
    }, []);

    // Refresh user data when app comes to foreground
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && auth.currentUser && user) {
                refreshUser();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [user]);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            setError(error as Error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Force token refresh to ensure it's available for the next request
            const token = await userCredential.user.getIdToken(true);
            setToken(token);
            
            // Wait a bit for auth.currentUser to be populated
            // This ensures the TRPC client can get the token
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Explicitly create the backend user
            try {
                await trpcClient.user.create.mutate({});
                console.log('[AuthProvider] Backend user created successfully');
                
                // Force another token refresh to ensure claims are updated with MongoDB ID
                const updatedToken = await userCredential.user.getIdToken(true);
                setToken(updatedToken);
                
                // Manually fetch and set the user profile to ensure immediate update
                const userProfile = await trpcClient.user.get.query();
                console.log('[AuthProvider] User profile fetched after signup:', {
                    userId: userProfile?._id,
                    email: userProfile?.email
                });
                
                // Directly update the user state
                setUser(userProfile);
                setIsInitialized(true);
                setNetworkError(false);
                setError(null);
                
                // Update crash reporter
                if (userProfile && userProfile._id) {
                    crashReporter.setUser({
                        id: userProfile._id || '',
                        email: userProfile.email
                    });
                }
            } catch (createError) {
                console.error('[AuthProvider] Failed to create backend user:', createError);
                // Don't throw here - the auto-creation in onAuthStateChanged will handle it
            }
            
            // onAuthStateChanged will also fire and may complete the setup
        } catch (error) {
            console.error('[AuthProvider] Signup error:', error);
            setError(error as Error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            // Clear cache and sign out
            queryClient.clear();
            await firebaseSignOut(auth);

            // Clear state
            setUser(null);
            setToken(null);
            setError(null);
            setNetworkError(false);

            // Clear user context from crash reporter
            crashReporter.setUser(null);

            // The onAuthStateChanged listener will handle state update
            // The _layout.tsx will handle navigation to auth screens
        } catch (error) {
            setError(error as Error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            setError(error as Error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isInitialized: isInitialized && minLoadTimeElapsed, // Both must be true
            networkError,
            token,
            error,
            signIn,
            signUp,
            signOut,
            resetPassword,
            refreshUser,
            retryConnection,
            setUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};