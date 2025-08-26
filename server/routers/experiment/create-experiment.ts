import { z } from 'zod';
import { getExperimentsCollection } from '@/config/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { ExperimentConfig } from '@shared';

const logger = createLogger('experiments:create');

const variantSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  payload: z.any().optional(),
});

const trafficAllocationSchema = z.object({
  type: z.enum(['random', 'sticky', 'user_attribute']),
  seed: z.string().optional(),
});

const targetingRuleSchema = z.object({
  attribute: z.string(),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
  value: z.any(),
});

const inputSchema = z.object({
  name: z.string(),
  key: z.string().regex(/^[a-z0-9_]+$/),
  description: z.string().optional(),
  isActive: z.boolean().default(false),
  variants: z.array(variantSchema).min(2),
  defaultVariant: z.string(),
  trafficAllocation: trafficAllocationSchema.optional(),
  targetingRules: z.array(targetingRuleSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const createExperiment = {
  input: inputSchema,
  handler: async ({ ctx, input }: { ctx: any; input: z.infer<typeof inputSchema> }) => {
    try {
      const experiments = getExperimentsCollection();
      
      // Check if experiment key already exists
      const existing = await experiments.findOne({ key: input.key });
      if (existing) {
        throw new Error('Experiment with this key already exists');
      }
      
      // Validate default variant exists
      const defaultVariantExists = input.variants.some(v => v.key === input.defaultVariant);
      if (!defaultVariantExists) {
        throw new Error('Default variant must be one of the defined variants');
      }
      
      // Validate variant weights sum to 100 if provided
      const totalWeight = input.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
      if (totalWeight > 0 && totalWeight !== 100) {
        throw new Error('Variant weights must sum to 100');
      }
      
      // Create experiment
      const experiment: ExperimentConfig & { createdAt: Date; createdBy: string } = {
        ...input,
        createdAt: new Date(),
        createdBy: ctx.user._id.toString(),
      };
      
      const result = await experiments.insertOne(experiment);
      
      logger.info('Created experiment', {
        experimentId: result.insertedId.toString(),
        key: input.key,
        createdBy: ctx.user.email,
      });
      
      return {
        ...experiment,
        _id: result.insertedId.toString(),
      };
    } catch (error) {
      logger.error('Failed to create experiment', { 
        key: input.key,
        error 
      });
      throw error;
    }
  },
};