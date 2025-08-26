import { protectedProcedure } from '@/trpc/trpc';
import { z } from 'zod';
import { stripe } from '@/services/stripe/stripe-client';
import { TRPCError } from '@trpc/server';
import { createLogger } from '@/utils/logging/logger';
import { ObjectId } from 'mongodb';

const logger = createLogger('Payment-Methods');

export const getPaymentMethods = protectedProcedure
  .query(async ({ ctx }) => {
    try {
      const { user } = ctx;
      
      if (!user.stripeCustomerId) {
        return { paymentMethods: [] };
      }

      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });
      
      // Note: We could also fetch other types like 'us_bank_account', 'sepa_debit', etc.
      // For now, we only support cards

      // Get default payment method
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      const defaultPaymentMethodId = 
        typeof customer !== 'string' && !customer.deleted
          ? customer.invoice_settings?.default_payment_method
          : null;

      // Transform payment methods for frontend
      const methods = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card' as const, // We're only fetching card types, so this is always 'card'
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      }));

      return { paymentMethods: methods };
    } catch (error) {
      logger.error('Failed to fetch payment methods', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch payment methods',
      });
    }
  });

export const createSetupIntent = protectedProcedure
  .mutation(async ({ ctx }) => {
    try {
      const { user } = ctx;
      
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user._id!.toString() },
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        const { getUserCollection } = await import('@/db');
        const usersCollection = getUserCollection();
        await usersCollection.updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { stripeCustomerId: customerId } }
        );
      }

      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      return {
        setupIntentClientSecret: setupIntent.client_secret!,
        customerId,
      };
    } catch (error) {
      logger.error('Failed to create setup intent', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create setup intent',
      });
    }
  });

export const setDefaultPaymentMethod = protectedProcedure
  .input(z.object({
    paymentMethodId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      const { user } = ctx;
      const { paymentMethodId } = input;
      
      if (!user.stripeCustomerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No Stripe customer found',
        });
      }

      // Update default payment method
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Also update subscription default payment method if exists
      if (user.subscription?.id) {
        await stripe.subscriptions.update(user.subscription.id, {
          default_payment_method: paymentMethodId,
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to set default payment method', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update default payment method',
      });
    }
  });

export const removePaymentMethod = protectedProcedure
  .input(z.object({
    paymentMethodId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      const { user } = ctx;
      const { paymentMethodId } = input;
      
      if (!user.stripeCustomerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No Stripe customer found',
        });
      }

      // Check if this is the only payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      if (paymentMethods.data.length === 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove the only payment method. Add another one first.',
        });
      }

      // Check if this is the default payment method
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      const isDefault = 
        typeof customer !== 'string' && 
        !customer.deleted &&
        customer.invoice_settings?.default_payment_method === paymentMethodId;

      if (isDefault) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove default payment method. Set another as default first.',
        });
      }

      // Detach payment method
      await stripe.paymentMethods.detach(paymentMethodId);

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      logger.error('Failed to remove payment method', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove payment method',
      });
    }
  });