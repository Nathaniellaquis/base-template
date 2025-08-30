import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { APP_CONFIG } from '@/config';
import { useAuth } from '@/providers/auth';
import { trpc } from '@/lib/api/trpc';
import type { Workspace } from '@shared';

// ============================================
// Types
// ============================================
interface WorkspaceProviderProps {
  children: ReactNode;
}

interface WorkspaceContextValue {
  // Current workspace
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  
  // Actions
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

// ============================================
// Workspace ID Store for tRPC headers
// ============================================
let currentWorkspaceId: string | null = null;

export const workspaceIdStore = {
  setCurrentWorkspaceId(id: string | null) {
    if (APP_CONFIG.features.enableWorkspaces) {
      currentWorkspaceId = id;
    }
  },
  
  getCurrentWorkspaceId() {
    if (!APP_CONFIG.features.enableWorkspaces) {
      return null;
    }
    return currentWorkspaceId;
  },
  
  clear() {
    currentWorkspaceId = null;
  }
};

// ============================================
// Context
// ============================================
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ============================================
// No-op implementation for when workspaces are disabled
// ============================================
const noOpWorkspaceValue: WorkspaceContextValue = {
  currentWorkspace: null,
  workspaces: [],
  loading: false,
  switchWorkspace: async () => {},
  createWorkspace: async () => ({} as Workspace),
  refreshWorkspaces: async () => {},
};

// ============================================
// Inner Provider Implementation
// ============================================
function WorkspaceContextProvider({ children }: WorkspaceProviderProps) {
  const { user, setUser } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const utils = trpc.useContext();
  
  // Get workspaces query - always available when workspaces are enabled
  const { data: workspacesData, refetch: refetchWorkspaces, isLoading: isLoadingWorkspaces } = trpc.workspace.list.useQuery(
    undefined,
    { 
      enabled: !!user,
      onSettled: () => setLoading(false),
      // Keep previous data while refetching to prevent UI flicker
      keepPreviousData: true,
    }
  );
  
  // Extract workspaces array from response
  const workspaces = workspacesData || [];
  
  // Switch workspace mutation
  const switchMutation = trpc.workspace.switch.useMutation({
    onSuccess: (data: any, variables: { workspaceId: string }) => {
      // Update current workspace
      const workspace = workspaces.find((w: Workspace) => w._id === variables.workspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
      
      // Update user's currentWorkspaceId
      if (user) {
        setUser({
          ...user,
          currentWorkspaceId: variables.workspaceId
        });
      }
    }
  });
  
  // Create workspace mutation
  const createMutation = trpc.workspace.create.useMutation({
    onSuccess: async (newWorkspace: Workspace) => {
      // Use tRPC's setData to immediately update the cache
      utils.workspace.list.setData(undefined, (old) => {
        return [...(old || []), newWorkspace];
      });
      
      // Switch to the new workspace
      setCurrentWorkspace(newWorkspace);
      
      // Update user
      if (user) {
        setUser({
          ...user,
          currentWorkspaceId: newWorkspace._id,
          workspaces: [...(user.workspaces || []), {
            workspaceId: newWorkspace._id,
            role: 'owner',
            joinedAt: new Date()
          }]
        });
      }
      
      // Invalidate to ensure consistency with server
      await utils.workspace.list.invalidate();
    }
  });
  
  // Refetch workspaces when user's currentWorkspaceId changes
  useEffect(() => {
    if (user?.currentWorkspaceId) {
      refetchWorkspaces();
    }
  }, [user?.currentWorkspaceId, refetchWorkspaces]);

  // Auto-select workspace on load
  useEffect(() => {
    if (!user) {
      setCurrentWorkspace(null);
      workspaceIdStore.clear();
      return;
    }
    
    // If user has a current workspace, select it
    if (user.currentWorkspaceId) {
      const workspace = workspaces.find((w: Workspace) => w._id === user.currentWorkspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
        workspaceIdStore.setCurrentWorkspaceId(workspace._id);
        return;
      } else if (workspaces.length === 0) {
        // Don't clear currentWorkspace if workspaces haven't loaded yet
        // This prevents the "No workspace" issue during initial load
        return;
      }
    }
    
    // Only clear or auto-select if we have workspace data
    if (workspaces.length === 0) {
      setCurrentWorkspace(null);
      workspaceIdStore.clear();
      return;
    }
    
    // Otherwise select the first workspace
    setCurrentWorkspace(workspaces[0]);
    workspaceIdStore.setCurrentWorkspaceId(workspaces[0]._id);
    
    // Update user's currentWorkspaceId if needed
    if (!user.currentWorkspaceId && workspaces[0]) {
      switchMutation.mutate({ workspaceId: workspaces[0]._id });
    }
  }, [user, workspaces]);
  
  // Sync workspace ID with store whenever it changes
  useEffect(() => {
    if (currentWorkspace) {
      workspaceIdStore.setCurrentWorkspaceId(currentWorkspace._id);
    } else {
      workspaceIdStore.clear();
    }
  }, [currentWorkspace]);
  
  const switchWorkspace = useCallback(async (workspaceId: string) => {
    await switchMutation.mutateAsync({ workspaceId });
  }, [switchMutation]);
  
  const createWorkspace = useCallback(async (name: string) => {
    return await createMutation.mutateAsync({ name });
  }, [createMutation]);
  
  const refreshWorkspacesFn = useCallback(async () => {
    await refetchWorkspaces();
  }, [refetchWorkspaces]);
  
  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace,
      workspaces,
      loading: loading || isLoadingWorkspaces || switchMutation.isPending || createMutation.isPending,
      switchWorkspace,
      createWorkspace,
      refreshWorkspaces: refreshWorkspacesFn,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ============================================
// Main Provider (conditionally renders)
// ============================================
export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  if (!APP_CONFIG.features.enableWorkspaces) {
    return (
      <WorkspaceContext.Provider value={noOpWorkspaceValue}>
        {children}
      </WorkspaceContext.Provider>
    );
  }
  
  return <WorkspaceContextProvider>{children}</WorkspaceContextProvider>;
}

// ============================================
// Hook
// ============================================
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  
  if (!APP_CONFIG.features.enableWorkspaces) {
    return null;
  }
  
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  
  return context;
}

// ============================================
// Re-export types
// ============================================
export type { WorkspaceContextValue, WorkspaceProviderProps };