import Stripe from 'stripe';
import { User } from '@shared';

export interface WebhookHandlerResult {
  success: boolean;
  message?: string;
  error?: Error;
}

export type WebhookHandler<T = any> = (
  event: Stripe.Event,
  data: T
) => Promise<WebhookHandlerResult>;

export interface WebhookHandlerContext {
  userId?: string;
  user?: User;
  customerId?: string;
}