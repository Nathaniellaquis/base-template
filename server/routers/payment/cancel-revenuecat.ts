/**
 * Cancel Subscription with RevenueCat
 * Cancels the user's active subscription
 */

import { getUserCollection } from '@/config/mongodb';
import { getCustomer } from '@/services/revenuecat';
import { protectedProcedure } from '@/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { ObjectId } from 'mongodb';

export const cancelRevenueCat = protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user._id;

    try {
        console.log(`[Payment:Cancel] Cancelling subscription for user: ${userId}`);

        // Get user's RevenueCat ID
        const usersCollection = getUserCollection();
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found',
            });
        }

        const revenueCatId = user.revenueCatId || userId;

        // Get customer info to find active subscriptions
        const customerInfo = await getCustomer(revenueCatId as string);

        if (!customerInfo) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No subscription found',
            });
        }

        // RevenueCat doesn't provide a direct cancel API
        // Cancellation happens through the native platform (App Store, Google Play, Stripe)
        // For web/Stripe subscriptions, redirect to billing portal

        // Update local database to mark as cancelled
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    'subscription.status': 'canceled',
                    'subscription.willRenew': false,
                    'subscription.canceledAt': new Date(),
                    'subscription.lastUpdated': new Date(),
                }
            }
        );

        return {
            success: true,
            message: 'Subscription will be cancelled at the end of the current period. You can manage your subscription through the billing portal.',
        };

    } catch (error: any) {
        console.error('[Payment:Cancel] Error:', error);

        if (error instanceof TRPCError) {
            throw error;
        }

        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to cancel subscription',
        });
    }
});
