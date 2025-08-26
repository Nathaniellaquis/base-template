import { trpc } from '@/providers/trpc';

export function useSavedPayments() {
  const utils = trpc.useContext();
  
  // Query for payment methods
  const { data: paymentMethods, isLoading } = trpc.payment.getPaymentMethods.useQuery(
    undefined,
    {
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Mutations
  const setDefaultMethod = trpc.payment.setDefaultPaymentMethod.useMutation({
    onSuccess: () => {
      // Invalidate and refetch payment methods
      utils.payment.getPaymentMethods.invalidate();
    },
  });
  
  const removeMethod = trpc.payment.removePaymentMethod.useMutation({
    onSuccess: () => {
      // Invalidate and refetch payment methods
      utils.payment.getPaymentMethods.invalidate();
    },
  });

  return {
    paymentMethods: paymentMethods || [],
    setDefault: (id: string) => setDefaultMethod.mutate({ paymentMethodId: id }),
    remove: (id: string) => removeMethod.mutate({ paymentMethodId: id }),
    isLoading,
    refetch: () => utils.payment.getPaymentMethods.invalidate(),
  };
}