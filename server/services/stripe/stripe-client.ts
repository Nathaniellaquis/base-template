import Stripe from 'stripe';
import { config } from '@/config';

// Initialize Stripe client
export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});