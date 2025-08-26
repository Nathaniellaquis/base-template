/**
 * Experiment Metrics Service
 * Business logic for tracking and analyzing experiment metrics
 */

import { ObjectId } from 'mongodb';
import { getExperimentsCollection, getDb } from '@/config/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { ExperimentVariant } from '@shared';

const logger = createLogger('ExperimentMetricsService');

interface VariantMetric {
  key: string;
  name: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
  uniqueExposures: number;
  uniqueConversions: number;
  confidence?: number;
}

interface ExperimentMetrics {
  experimentKey: string;
  totalExposures: number;
  totalConversions: number;
  conversionRate: number;
  variants: VariantMetric[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Track experiment exposure
 */
export async function trackExposure(
  experimentKey: string,
  variantKey: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const db = getDb();
  const exposures = db.collection('experiment_exposures');
  
  await exposures.insertOne({
    experimentKey,
    variantKey,
    userId,
    metadata,
    timestamp: new Date(),
  });
  
  logger.debug('Tracked exposure', {
    experimentKey,
    variantKey,
    userId
  });
}

/**
 * Track experiment conversion
 */
export async function trackConversion(
  experimentKey: string,
  variantKey: string,
  conversionType: string,
  userId?: string,
  value?: number,
  metadata?: Record<string, any>
): Promise<void> {
  const db = getDb();
  const conversions = db.collection('experiment_conversions');
  
  await conversions.insertOne({
    experimentKey,
    variantKey,
    conversionType,
    userId,
    value,
    metadata,
    timestamp: new Date(),
  });
  
  logger.debug('Tracked conversion', {
    experimentKey,
    variantKey,
    conversionType,
    userId,
    value
  });
}

/**
 * Get experiment metrics
 */
export async function getExperimentMetrics(
  experimentKey: string,
  dateRange?: { start: Date; end: Date }
): Promise<ExperimentMetrics> {
  const db = getDb();
  const experiments = getExperimentsCollection();
  const exposures = db.collection('experiment_exposures');
  const conversions = db.collection('experiment_conversions');
  
  // Get experiment configuration
  const experiment = await experiments.findOne({ key: experimentKey });
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  // Build date query
  const dateQuery = dateRange ? {
    timestamp: {
      $gte: dateRange.start,
      $lte: dateRange.end
    }
  } : {};
  
  // Get exposures by variant
  const exposureStats = await exposures.aggregate([
    { 
      $match: { 
        experimentKey,
        ...dateQuery
      } 
    },
    {
      $group: {
        _id: '$variantKey',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    }
  ]).toArray();
  
  // Get conversions by variant
  const conversionStats = await conversions.aggregate([
    { 
      $match: { 
        experimentKey,
        ...dateQuery
      } 
    },
    {
      $group: {
        _id: '$variantKey',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    }
  ]).toArray();
  
  // Map stats by variant
  const exposureMap = new Map(exposureStats.map(s => [s._id, s]));
  const conversionMap = new Map(conversionStats.map(s => [s._id, s]));
  
  // Calculate metrics for each variant
  const variantMetrics: VariantMetric[] = experiment.variants.map(variant => {
    const exposureData = exposureMap.get(variant.key) || { count: 0, uniqueUsers: [] };
    const conversionData = conversionMap.get(variant.key) || { count: 0, uniqueUsers: [] };
    
    const exposures = exposureData.count;
    const conversions = conversionData.count;
    const conversionRate = exposures > 0 ? (conversions / exposures) * 100 : 0;
    
    return {
      key: variant.key,
      name: variant.name,
      exposures,
      conversions,
      conversionRate,
      uniqueExposures: exposureData.uniqueUsers.filter(Boolean).length,
      uniqueConversions: conversionData.uniqueUsers.filter(Boolean).length,
    };
  });
  
  // Calculate totals
  const totalExposures = variantMetrics.reduce((sum, v) => sum + v.exposures, 0);
  const totalConversions = variantMetrics.reduce((sum, v) => sum + v.conversions, 0);
  const overallConversionRate = totalExposures > 0 
    ? (totalConversions / totalExposures) * 100 
    : 0;
  
  // Calculate statistical confidence if we have a control variant
  const controlVariant = variantMetrics.find(v => v.key === 'control');
  if (controlVariant && controlVariant.exposures > 30) {
    variantMetrics.forEach(variant => {
      if (variant.key !== 'control' && variant.exposures > 30) {
        variant.confidence = calculateConfidence(
          controlVariant.conversions,
          controlVariant.exposures,
          variant.conversions,
          variant.exposures
        );
      }
    });
  }
  
  return {
    experimentKey,
    totalExposures,
    totalConversions,
    conversionRate: overallConversionRate,
    variants: variantMetrics,
    dateRange
  };
}

/**
 * Calculate statistical confidence for A/B test
 */
function calculateConfidence(
  controlConversions: number,
  controlExposures: number,
  variantConversions: number,
  variantExposures: number
): number {
  // Simple Z-test for proportion difference
  const p1 = controlConversions / controlExposures;
  const p2 = variantConversions / variantExposures;
  const pooledP = (controlConversions + variantConversions) / (controlExposures + variantExposures);
  
  const standardError = Math.sqrt(
    pooledP * (1 - pooledP) * (1/controlExposures + 1/variantExposures)
  );
  
  if (standardError === 0) return 0;
  
  const zScore = Math.abs(p2 - p1) / standardError;
  
  // Convert z-score to confidence percentage
  // This is a simplified conversion
  if (zScore >= 2.58) return 99; // 99% confidence
  if (zScore >= 1.96) return 95; // 95% confidence
  if (zScore >= 1.64) return 90; // 90% confidence
  
  return Math.round(zScore * 35); // Rough approximation for lower values
}

/**
 * Get experiment performance summary
 */
export async function getExperimentSummary(experimentKey: string): Promise<{
  isActive: boolean;
  duration: number;
  totalExposures: number;
  avgConversionRate: number;
  bestVariant: string | null;
  recommendation: string;
}> {
  const experiments = getExperimentsCollection();
  const experiment = await experiments.findOne({ key: experimentKey });
  
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  const metrics = await getExperimentMetrics(experimentKey);
  
  // Find best performing variant
  const bestVariant = metrics.variants.reduce((best, current) => {
    return current.conversionRate > best.conversionRate ? current : best;
  }, metrics.variants[0]);
  
  // Calculate duration (assume 0 if no createdAt)
  const duration = 0; // Would need to be stored in the experiment document
  
  // Generate recommendation
  let recommendation = 'Continue running experiment';
  if (metrics.totalExposures < 1000) {
    recommendation = 'Need more data for statistical significance';
  } else if (bestVariant.confidence && bestVariant.confidence >= 95) {
    recommendation = `Deploy ${bestVariant.name} variant - 95% confidence`;
  } else if (duration > 30) {
    recommendation = 'Consider ending experiment - running for over 30 days';
  }
  
  return {
    isActive: experiment.isActive,
    duration,
    totalExposures: metrics.totalExposures,
    avgConversionRate: metrics.conversionRate,
    bestVariant: bestVariant.key,
    recommendation
  };
}