/**
 * Admin Provider Types
 * 
 * Type definitions for the admin provider
 */

import { ReactNode } from 'react';
import { User } from '@shared';

export interface AdminProviderProps {
  children: ReactNode;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export interface AdminContextValue {
  isAdmin: boolean;
  loading: boolean;
  stats: AdminStats | null;
  users: User[];
  refreshStats: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  makeAdmin: (userId: string) => Promise<void>;
  removeAdmin: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}