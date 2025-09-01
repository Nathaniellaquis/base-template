/**
 * Payment Router
 * Provides subscription status from RevenueCat
 * 
 * Note: Purchases happen client-side via RevenueCat SDKs
 * See docs/features/payment.md for complete flow documentation
 */

import { router } from '@/trpc/trpc';
import { getSubscriptionRevenueCat } from './get-subscription-revenuecat';

export const paymentRouter = router({
    getSubscription: getSubscriptionRevenueCat,
});