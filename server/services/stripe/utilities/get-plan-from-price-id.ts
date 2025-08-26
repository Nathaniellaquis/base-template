import { config } from '@/config';

/**
 * Map Stripe price ID to plan type
 */
export function getPlanFromPriceId(priceId: string): 'free' | 'basic' | 'pro' | 'enterprise' {
  const prices = config.stripe.prices;
  
  // Map your Stripe price IDs to plan types
  const priceMap: Record<string, 'basic' | 'pro' | 'enterprise'> = {
    [prices.basic.monthly]: 'basic',
    [prices.basic.yearly]: 'basic',
    [prices.pro.monthly]: 'pro',
    [prices.pro.yearly]: 'pro',
    [prices.enterprise.monthly]: 'enterprise',
    [prices.enterprise.yearly]: 'enterprise',
  };

  return priceMap[priceId] || 'free';
}