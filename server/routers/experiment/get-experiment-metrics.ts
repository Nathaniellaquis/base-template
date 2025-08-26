import { z } from 'zod';
import { getExperimentsCollection } from '@/config/mongodb';
import { toObjectIdOrThrow } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { ExperimentMetrics } from '@shared';

const logger = createLogger('experiments:metrics');

const inputSchema = z.object({
  experimentId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export const getExperimentMetrics = {
  input: inputSchema,
  handler: async ({ input }: { input: z.infer<typeof inputSchema> }) => {
    try {
      const experiments = getExperimentsCollection();
      
      const experimentId = toObjectIdOrThrow(input.experimentId, 'experimentId');
      const experiment = await experiments.findOne({ _id: experimentId });
      
      if (!experiment) {
        throw new Error('Experiment not found');
      }
      
      // In a real implementation, this would query an analytics service
      // For now, we'll generate sample metrics with time series data
      const variants = experiment.variants;
      const metrics: ExperimentMetrics[] = [];
      const timeSeries: any[] = [];
      
      // Generate metrics for each variant
      for (const variant of variants) {
        const impressions = Math.floor(Math.random() * 10000) + 1000;
        const conversions = Math.floor(Math.random() * impressions * 0.1);
        const conversionRate = (conversions / impressions) * 100;
        
        metrics.push({
          experimentKey: experiment.key,
          variant: variant.key,
          impressions,
          conversions,
          conversionRate,
          averageValue: Math.random() * 100 + 50,
          confidence: Math.random() * 100,
        });
        
        // Generate time series data
        const days = 30;
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          timeSeries.push({
            date: date.toISOString().split('T')[0],
            variant: variant.key,
            impressions: Math.floor(Math.random() * 500),
            conversions: Math.floor(Math.random() * 50),
            conversionRate: Math.random() * 15,
          });
        }
      }
      
      // Calculate statistical significance (simplified)
      const control = metrics.find(m => m.variant === experiment.defaultVariant);
      const variants_with_significance = metrics.map(m => {
        if (m.variant === experiment.defaultVariant) {
          return { ...m, significance: 'control' };
        }
        
        // Simplified significance calculation
        const difference = m.conversionRate - (control?.conversionRate || 0);
        const significance = Math.abs(difference) > 2 ? 'significant' : 'not_significant';
        
        return {
          ...m,
          difference: difference.toFixed(2) + '%',
          significance,
        };
      });
      
      logger.info('Retrieved experiment metrics', {
        experimentId: input.experimentId,
        key: experiment.key,
        variantCount: variants.length,
      });
      
      return {
        experiment: {
          _id: experiment._id.toString(),
          name: experiment.name,
          key: experiment.key,
        },
        metrics: variants_with_significance,
        timeSeries,
        summary: {
          totalImpressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
          totalConversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
          overallConversionRate: (
            metrics.reduce((sum, m) => sum + m.conversions, 0) / 
            metrics.reduce((sum, m) => sum + m.impressions, 0) * 100
          ).toFixed(2),
          bestPerformer: metrics.reduce((best, m) => 
            m.conversionRate > best.conversionRate ? m : best
          ).variant,
        },
      };
    } catch (error) {
      logger.error('Failed to get experiment metrics', {
        experimentId: input.experimentId,
        error,
      });
      throw error;
    }
  },
};