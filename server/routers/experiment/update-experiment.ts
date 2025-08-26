import { z } from 'zod';
import { getExperimentsCollection } from '@/config/mongodb';
import { toObjectIdOrThrow } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';

const logger = createLogger('experiments:update');

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
  experimentId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  variants: z.array(variantSchema).min(2).optional(),
  defaultVariant: z.string().optional(),
  trafficAllocation: trafficAllocationSchema.optional(),
  targetingRules: z.array(targetingRuleSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const updateExperiment = {
  input: inputSchema,
  handler: async ({ ctx, input }: { ctx: any; input: z.infer<typeof inputSchema> }) => {
    try {
      const experiments = getExperimentsCollection();
      
      const experimentId = toObjectIdOrThrow(input.experimentId, 'experimentId');
      
      // Get the experiment first
      const experiment = await experiments.findOne({ _id: experimentId });
      if (!experiment) {
        throw new Error('Experiment not found');
      }
      
      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: ctx.user._id.toString(),
      };
      
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.variants) {
        // Validate variant weights sum to 100 if provided
        const totalWeight = input.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
        if (totalWeight > 0 && totalWeight !== 100) {
          throw new Error('Variant weights must sum to 100');
        }
        updateData.variants = input.variants;
      }
      if (input.defaultVariant) {
        // Validate default variant exists in current or new variants
        const variants = input.variants || experiment.variants;
        const defaultVariantExists = variants.some((v: any) => v.key === input.defaultVariant);
        if (!defaultVariantExists) {
          throw new Error('Default variant must be one of the defined variants');
        }
        updateData.defaultVariant = input.defaultVariant;
      }
      if (input.trafficAllocation) updateData.trafficAllocation = input.trafficAllocation;
      if (input.targetingRules) updateData.targetingRules = input.targetingRules;
      if (input.startDate) updateData.startDate = input.startDate;
      if (input.endDate) updateData.endDate = input.endDate;
      
      // Update experiment
      const result = await experiments.updateOne(
        { _id: experimentId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Failed to update experiment');
      }
      
      logger.info('Updated experiment', {
        experimentId: input.experimentId,
        key: experiment.key,
        updatedBy: ctx.user.email,
        fields: Object.keys(updateData).filter(k => !['updatedAt', 'updatedBy'].includes(k)),
      });
      
      // Return updated experiment
      const updated = await experiments.findOne({ _id: experimentId });
      return {
        ...updated,
        _id: updated!._id.toString(),
      };
    } catch (error) {
      logger.error('Failed to update experiment', {
        experimentId: input.experimentId,
        error,
      });
      throw error;
    }
  },
};