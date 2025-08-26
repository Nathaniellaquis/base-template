/**
 * Auth Provider Types
 * 
 * Type definitions for the authentication provider
 */

import { ReactNode } from 'react';
import { User } from '@shared';

export interface AuthProviderProps {
  children: ReactNode;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  token: string | null;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}