import { z } from 'zod';
import { getExperimentsCollection } from '@/config/mongodb';
import { toObjectIdOrThrow } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';

const logger = createLogger('experiments:update-status');

const inputSchema = z.object({
  experimentId: z.string(),
  isActive: z.boolean(),
});

export const updateExperimentStatus = {
  input: inputSchema,
  handler: async ({ ctx, input }: { ctx: any; input: z.infer<typeof inputSchema> }) => {
    try {
      const experiments = getExperimentsCollection();
      
      const experimentId = toObjectIdOrThrow(input.experimentId, 'experimentId');
      
      // Get the experiment first to check it exists
      const experiment = await experiments.findOne({ _id: experimentId });
      if (!experiment) {
        throw new Error('Experiment not found');
      }
      
      // Update status
      const result = await experiments.updateOne(
        { _id: experimentId },
        {
          $set: {
            isActive: input.isActive,
            updatedAt: new Date(),
            updatedBy: ctx.user._id.toString(),
          },
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Failed to update experiment');
      }
      
      logger.info('Updated experiment status', {
        experimentId: input.experimentId,
        key: experiment.key,
        isActive: input.isActive,
        updatedBy: ctx.user.email,
      });
      
      return {
        success: true,
        isActive: input.isActive,
      };
    } catch (error) {
      logger.error('Failed to update experiment status', {
        experimentId: input.experimentId,
        error,
      });
      throw error;
    }
  },
};