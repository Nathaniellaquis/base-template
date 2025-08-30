/**
 * tRPC Client Configuration
 * All tRPC client configuration in one place
 */
import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '../../../server/trpc/app';
import { config, APP_CONFIG } from '../../config';
import { auth } from '../../config';
import { workspaceIdStore } from '@/providers/workspace';
import type { Auth } from 'firebase/auth';

// Create typed hooks
export const trpc = createTRPCReact<AppRouter>();

// Create query client with proper caching defaults
// Mutations return updated data, so caching is safe
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Cache for 5 minutes
      gcTime: 10 * 60 * 1000,         // Keep in memory for 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,    // Don't auto-refetch
      refetchOnMount: false,          // Use cache when available
      refetchOnReconnect: true,       // Refetch on reconnect
      networkMode: 'offlineFirst',   // Use cache when offline
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
      // Mutations should update cache via onSuccess
    },
  },
});

// Create tRPC client configuration
export const trpcClientConfig = {
  links: [
    httpBatchLink({
      url: `${config.api.url}/trpc`,
      transformer: superjson,
      headers: async () => {
        const token = await auth.currentUser?.getIdToken();
        const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
        
        // Add workspace header if workspaces are enabled
        if (APP_CONFIG.features.enableWorkspaces) {
          const workspaceId = workspaceIdStore.getCurrentWorkspaceId();
          if (workspaceId) {
            headers['x-workspace-id'] = workspaceId;
          }
        }
        
        return headers;
      },
      fetch: async (url, options) => {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            console.error('[TRPC] Response not OK:', response.status, response.statusText);
          }
          return response;
        } catch (error) {
          console.error('[TRPC] Fetch error:', error);
          throw error;
        }
      },
    }),
  ],
};

// Create vanilla client for use outside React
export const trpcClient = createTRPCClient<AppRouter>(trpcClientConfig);

// Export AppRouter type for use in other files
export type { AppRouter };

// Note: utils must be used inside components, not at top level
// const utils = trpc.useContext(); // ✅ Inside component
// const utils = trpc.useContext(); // ❌ Top level - will error