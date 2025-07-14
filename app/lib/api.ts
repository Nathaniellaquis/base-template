/**
 * tRPC Client Configuration
 * All tRPC client configuration in one place
 */
import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '../../server/trpc/app';
import { apiConfig } from '../config';
import { auth } from '../config/firebase';

// Create typed hooks
export const trpc = createTRPCReact<AppRouter>();

// Create query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create tRPC client configuration
export const trpcClientConfig = {
  links: [
    httpBatchLink({
      url: `${apiConfig.baseUrl}/trpc`,
      transformer: superjson,
      headers: async () => {
        const token = await auth.currentUser?.getIdToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
};

// Create vanilla client for use outside React
export const trpcClient = createTRPCClient<AppRouter>(trpcClientConfig);

// Note: utils must be used inside components, not at top level
// const utils = trpc.useUtils(); // ✅ Inside component
// const utils = trpc.useContext(); // ❌ Top level - will error