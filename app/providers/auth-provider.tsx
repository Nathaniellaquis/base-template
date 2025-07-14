import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../../types/user';
import { auth } from '../config/firebase';
import { trpcClient } from '../lib/api';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isInitialized: boolean;
    token: string | null;
    error: Error | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Get token
                    const idToken = await firebaseUser.getIdToken();
                    setToken(idToken);

                    // Try to get full user profile from MongoDB
                    try {
                        const profile = await trpcClient.user.get.query();
                        setUser(profile);
                    } catch (error) {
                        // User exists in Firebase but not in MongoDB yet
                        // Use Firebase data as fallback
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email!,
                            displayName: firebaseUser.displayName || undefined,
                            emailVerified: firebaseUser.emailVerified,
                        });
                    }
                } else {
                    setUser(null);
                    setToken(null);
                }
                setError(null);
            } catch (error) {
                console.error('Auth initialization error:', error);
                setError(error as Error);
            } finally {
                setIsInitialized(true);
            }
        });

        return unsubscribe;
    }, []);

    const refreshUser = async () => {
        if (!auth.currentUser) return;
        
        setLoading(true);
        try {
            const profile = await trpcClient.user.get.query();
            setUser(profile);
            setError(null);
        } catch (error) {
            console.error('Failed to refresh user:', error);
            setError(error as Error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(error as Error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string, displayName?: string) => {
        setLoading(true);
        setError(null);
        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }

            // Get initial token
            const idToken = await userCredential.user.getIdToken();
            setToken(idToken);

            // Create the MongoDB user
            try {
                const profile = await trpcClient.user.create.mutate({
                    displayName: displayName || ''
                });

                // Refresh token to get custom claims
                const newToken = await userCredential.user.getIdToken(true);
                setToken(newToken);

                // Update user state with full profile
                setUser(profile);
            } catch (error) {
                console.error('Failed to create user profile:', error);
                // User is created in Firebase but not in MongoDB
                // This is a problem state - maybe we should delete the Firebase user?
                throw error;
            }
        } catch (error) {
            setError(error as Error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setError(null);
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
            isInitialized,
            token,
            error,
            signIn,
            signUp,
            logout,
            resetPassword,
            refreshUser,
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