/**
 * RevenueCat Webhook Handler
 * Main endpoint for processing RevenueCat webhook events
 */

import type { RevenueCatWebhookPayload } from '@shared/revenuecat';
import crypto from 'crypto';
import { Router } from 'express';
import { logger } from '@/utils/logging';
import { handleWebhookEvent } from './handlers';

const router = Router();

/**
 * POST /webhooks/revenuecat
 * Process RevenueCat webhook events
 */
router.post('/webhooks/revenuecat', async (req, res) => {
    try {
        // Verify webhook signature if configured
        const signature = req.headers['x-revenuecat-signature'] as string;
        const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

        if (webhookSecret && !verifyWebhookSignature(req.body, signature, webhookSecret)) {
            logger.error('[RevenueCat Webhook] Invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Parse webhook payload
        const payload: RevenueCatWebhookPayload = req.body;
        const event = payload.event;

        logger.info('[RevenueCat Webhook] Processing event', { type: event.type, userId: event.app_user_id });

        // Process event asynchronously
        setImmediate(async () => {
            try {
                await handleWebhookEvent(event);
            } catch (error) {
                logger.error('[RevenueCat Webhook] Error processing event', { error });
                // Don't throw - we already returned 200 to RevenueCat
            }
        });

        // Always return 200 quickly to prevent retries
        res.status(200).json({ received: true });

    } catch (error) {
        logger.error('[RevenueCat Webhook] Unexpected error', { error });
        // Return 500 for actual server errors
        // RevenueCat will retry with exponential backoff
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Verify webhook signature from RevenueCat
 */
function verifyWebhookSignature(
    payload: any,
    signature: string | undefined,
    secret: string
): boolean {
    if (!signature) {
        console.warn('[RevenueCat Webhook] No signature provided');
        return false;
    }

    try {
        // RevenueCat uses HMAC-SHA256 for webhook signatures
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        // Constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('[RevenueCat Webhook] Signature verification failed:', error);
        return false;
    }
}

export default router;
