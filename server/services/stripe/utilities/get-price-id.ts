import type { PlanType, BillingPeriod } from '@shared';
import { config } from '@/config';

/**
 * Get price ID for a plan/period combination
 */
export function getPriceId(plan: PlanType, period: BillingPeriod): string | null {
  if (plan === 'free') return null;
  
  const prices = config.stripe.prices;
  const priceMap: Record<string, string> = {
    'basic_monthly': prices.basic.monthly,
    'basic_yearly': prices.basic.yearly,
    'pro_monthly': prices.pro.monthly,
    'pro_yearly': prices.pro.yearly,
    'enterprise_monthly': prices.enterprise.monthly,
    'enterprise_yearly': prices.enterprise.yearly,
  };

  const key = `${plan}_${period}`;
  return priceMap[key] || null;
}