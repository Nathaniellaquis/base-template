import { z } from 'zod';
import { getExperimentsCollection } from '@/config/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { ExperimentConfig, ExperimentMetrics } from '@shared';

const logger = createLogger('experiments:list');

const inputSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().default(50),
  skip: z.number().default(0),
});

export const listExperiments = {
  input: inputSchema,
  handler: async ({ input }: { input: z.infer<typeof inputSchema> }) => {
    try {
      const experiments = getExperimentsCollection();
      
      // Build query
      const query: any = {};
      
      if (input.search) {
        query.$or = [
          { name: { $regex: input.search, $options: 'i' } },
          { key: { $regex: input.search, $options: 'i' } },
          { description: { $regex: input.search, $options: 'i' } },
        ];
      }
      
      if (input.isActive !== undefined) {
        query.isActive = input.isActive;
      }
      
      // Get experiments with pagination
      const experimentsList = await experiments
        .find(query)
        .sort({ createdAt: -1 })
        .limit(input.limit)
        .skip(input.skip)
        .toArray();
      
      // Enrich with metrics
      const enrichedExperiments = experimentsList.map(exp => {
        // In a real implementation, metrics would come from an analytics service
        // For now, we'll generate sample metrics
        const metrics: ExperimentMetrics[] = exp.variants.map((variant: any) => ({
          experimentKey: exp.key,
          variant: variant.key,
          impressions: Math.floor(Math.random() * 10000),
          conversions: Math.floor(Math.random() * 500),
          conversionRate: Math.random() * 10,
          averageValue: Math.random() * 100,
          confidence: Math.random() * 100,
        }));
        
        return {
          ...exp,
          _id: exp._id.toString(),
          metrics,
        };
      });
      
      const total = await experiments.countDocuments(query);
      
      logger.info('Listed experiments', { 
        count: enrichedExperiments.length, 
        total,
        search: input.search 
      });
      
      return {
        experiments: enrichedExperiments,
        total,
        hasMore: input.skip + input.limit < total,
      };
    } catch (error) {
      logger.error('Failed to list experiments', { error });
      throw new Error('Failed to list experiments');
    }
  },
};