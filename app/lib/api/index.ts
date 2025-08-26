/**
 * API Client Exports
 * Central location for all API configurations and clients
 */

// tRPC client and utilities
export { 
  trpc, 
  queryClient, 
  trpcClient, 
  trpcClientConfig 
} from './trpc';

// Type exports
export type { AppRouter } from '../../../server/trpc/app';