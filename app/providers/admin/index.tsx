import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth';
import { trpc } from '@/providers/trpc';
import { AdminStats } from '@shared';

interface AdminContextValue {
  isAdmin: boolean;
  isLoading: boolean;
  stats?: AdminStats;
  checkAdmin: () => boolean;
  refreshStats: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | undefined>();
  
  // Get admin stats if user is admin
  const { data: statsData, isLoading, refetch } = trpc.admin.getStats.useQuery(
    undefined,
    { 
      enabled: user?.role === 'admin',
      retry: false,
    }
  );
  
  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
  }, [statsData]);
  
  const checkAdmin = () => {
    if (user?.role !== 'admin') {
      return false;
    }
    return true;
  };
  
  const refreshStats = () => {
    if (user?.role === 'admin') {
      refetch();
    }
  };
  
  const value: AdminContextValue = {
    isAdmin: user?.role === 'admin',
    isLoading,
    stats,
    checkAdmin,
    refreshStats,
  };
  
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}