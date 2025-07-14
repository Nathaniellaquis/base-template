import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { queryClient, trpc, trpcClientConfig } from '../lib/api';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return (
    <trpc.Provider client={trpc.createClient(trpcClientConfig)} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}