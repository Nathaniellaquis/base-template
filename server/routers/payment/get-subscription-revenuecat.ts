/**
 * Get Subscription Status from RevenueCat
 * Fetches current subscription information
 */

import { syncUserWithRevenueCat } from '@/services/revenuecat';
import { protectedProcedure } from '@/trpc/trpc';
import { logger } from '@/utils/logging';
import { TRPCError } from '@trpc/server';

// Define the response type locally
interface SubscriptionResponse {
    isActive: boolean;
    plan: string;
    status: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: string;
    features: string[];
    source?: string;
}

export const getSubscriptionRevenueCat = protectedProcedure.query(
    async ({ ctx }): Promise<SubscriptionResponse> => {
        const userId = ctx.user._id!; // Non-null assertion since protectedProcedure ensures user exists

        try {
            logger.info('[Payment:GetSubscription] Fetching subscription', { userId });

            // Sync with RevenueCat to get latest subscription status
            const subscription = await syncUserWithRevenueCat(userId);

            if (!subscription) {
                // No subscription found - user is on free plan
                return {
                    isActive: false,
                    plan: 'free',
                    status: 'none',
                    features: [],
                };
            }

            // Map subscription status to response
            return {
                isActive: subscription.status === 'active' || subscription.status === 'trialing',
                plan: subscription.plan || 'free',
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
                cancelAtPeriodEnd: subscription.willRenew === false,
                trialEnd: subscription.trialEnd?.toISOString(),
                features: getFeaturesByPlan(subscription.plan || 'free'),
                source: subscription.source as any,
            };

        } catch (error) {
            logger.error('[Payment:GetSubscription] Error fetching subscription', { error });
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch subscription status',
            });
        }
    }
);

// Helper to get features by plan
function getFeaturesByPlan(plan: string): string[] {
    const features: Record<string, string[]> = {
        free: [
            '1 project',
            '1 team member',
            '1GB storage',
            'Community support',
        ],
        basic: [
            '10 projects',
            '3 team members',
            '10GB storage',
            'Email support',
            'Basic analytics',
        ],
        pro: [
            'Unlimited projects',
            '10 team members',
            '100GB storage',
            'Priority support',
            'Advanced analytics',
            'API access',
        ],
        enterprise: [
            'Everything in Pro',
            'Unlimited team members',
            'Unlimited storage',
            'Dedicated support',
            'Custom integrations',
            'SLA guarantee',
        ],
    };

    return features[plan] || features.free;
}
