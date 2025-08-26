import { z } from 'zod';
import { getExperimentsCollection } from '@/config/mongodb';
import { toObjectIdOrThrow } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { ExperimentMetrics } from '@shared';

const logger = createLogger('experiments:get');

const inputSchema = z.object({
  experimentId: z.string(),
});

export const getExperiment = {
  input: inputSchema,
  handler: async ({ input }: { input: z.infer<typeof inputSchema> }) => {
    try {
      const experiments = getExperimentsCollection();
      
      const experimentId = toObjectIdOrThrow(input.experimentId, 'experimentId');
      const experiment = await experiments.findOne({ _id: experimentId });
      
      if (!experiment) {
        throw new Error('Experiment not found');
      }
      
      // Enrich with metrics (sample data for now)
      const metrics: ExperimentMetrics[] = experiment.variants.map((variant: any) => ({
        experimentKey: experiment.key,
        variant: variant.key,
        impressions: Math.floor(Math.random() * 10000),
        conversions: Math.floor(Math.random() * 500),
        conversionRate: Math.random() * 10,
        averageValue: Math.random() * 100,
        confidence: Math.random() * 100,
      }));
      
      logger.info('Retrieved experiment', { 
        experimentId: input.experimentId,
        key: experiment.key 
      });
      
      return {
        ...experiment,
        _id: experiment._id.toString(),
        metrics,
      };
    } catch (error) {
      logger.error('Failed to get experiment', { 
        experimentId: input.experimentId,
        error 
      });
      throw error;
    }
  },
};