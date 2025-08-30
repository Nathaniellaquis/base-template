/**
 * Payment Router
 * All payment-related tRPC procedures using RevenueCat
 */

import { router } from '@/trpc/trpc';

// RevenueCat implementations
import { cancelRevenueCat } from './cancel-revenuecat';
import { getSubscriptionRevenueCat } from './get-subscription-revenuecat';
import { subscribeRevenueCat } from './subscribe-revenuecat';

export const paymentRouter = router({
    // Subscription management
    getSubscription: getSubscriptionRevenueCat,
    subscribe: subscribeRevenueCat,
    cancel: cancelRevenueCat,
});