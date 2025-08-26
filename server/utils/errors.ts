import { TRPCError } from '@trpc/server';

/**
 * Simple error helpers for consistent error handling
 */

// Common TRPC errors - use these instead of creating new TRPCError everywhere
export const errors = {
  notFound: (entity: string) => 
    new TRPCError({
      code: 'NOT_FOUND',
      message: `${entity} not found`,
    }),

  unauthorized: (message = 'Unauthorized') =>
    new TRPCError({
      code: 'UNAUTHORIZED',
      message,
    }),

  badRequest: (message: string) =>
    new TRPCError({
      code: 'BAD_REQUEST',
      message,
    }),

  internal: (message = 'Internal server error') =>
    new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    }),
};