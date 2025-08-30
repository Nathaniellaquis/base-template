/**
 * Subscribe with RevenueCat
 * This is primarily for web purchases - mobile purchases happen directly through SDK
 */

import { protectedProcedure } from '@/trpc/trpc';
import type { SubscribeResult } from '@shared/payment';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const subscribeSchema = z.object({
    plan: z.enum(['basic', 'pro', 'enterprise']),
    period: z.enum(['monthly', 'yearly']),
    paymentMethodId: z.string().optional(), // Not used for RevenueCat
});

export const subscribeRevenueCat = protectedProcedure
    .input(subscribeSchema)
    .mutation(async ({ ctx, input }): Promise<SubscribeResult> => {
        const userId = ctx.user._id;
        const { plan, period } = input;

        try {
            console.log(`[Payment:Subscribe] User ${userId} subscribing to ${plan} ${period} via RevenueCat`);

            // For RevenueCat, purchases are handled by the SDK on client side
            // This endpoint is mainly for web purchases which use RevenueCat Web SDK

            // The actual purchase happens on the client side
            // This endpoint just returns success since RevenueCat handles everything

            // Note: In production, you might want to:
            // 1. Create a checkout session URL using RevenueCat's API
            // 2. Return that URL for the client to redirect to
            // 3. Or handle the purchase entirely on the client with RevenueCat Web SDK

            return {
                action: 'revenuecatPurchase',
                plan,
                period,
                // RevenueCat doesn't provide client secrets like Stripe
                // The purchase is handled entirely by their SDK
            };

        } catch (error) {
            console.error('[Payment:Subscribe] Error:', error);
            
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Failed to process subscription';

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: errorMessage,
            });
        }
    });
