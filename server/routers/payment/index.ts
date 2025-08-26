import { router } from '@/trpc/trpc';
import { getSubscription } from './get-subscription';
import { subscribe } from './subscribe';
import { cancel } from './cancel';
import { createPortalSession } from './create-portal-session';
import { 
  getPaymentMethods,
  createSetupIntent,
  setDefaultPaymentMethod,
  removePaymentMethod
} from './payment-methods';

export const paymentRouter = router({
  getSubscription,
  subscribe,
  cancel,
  createPortalSession,
  // Payment methods management
  getPaymentMethods,
  createSetupIntent,
  setDefaultPaymentMethod,
  removePaymentMethod,
});