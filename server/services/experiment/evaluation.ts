/**
 * Experiment Evaluation Service
 * Business logic for evaluating experiments and determining variants
 */

import { getExperimentsCollection } from '@/config/mongodb';
import { createLogger } from '@/utils/logging/logger';
import { createHash } from 'crypto';
import type { ExperimentConfig, ExperimentVariant } from '@shared';

const logger = createLogger('ExperimentEvaluationService');

interface EvaluationContext {
  userId?: string;
  attributes?: Record<string, any>;
  forceVariant?: string;
}

/**
 * Evaluate experiment and get variant for a user
 */
export async function evaluateExperiment(
  experimentKey: string,
  context: EvaluationContext = {}
): Promise<{
  variant: string;
  experiment: ExperimentConfig;
  reason: string;
}> {
  const experiments = getExperimentsCollection();
  const experiment = await experiments.findOne({ key: experimentKey });
  
  if (!experiment) {
    throw new Error(`Experiment not found: ${experimentKey}`);
  }
  
  const config = experiment;
  
  // Check if experiment is active
  if (!config.isActive) {
    return {
      variant: config.defaultVariant,
      experiment: config,
      reason: 'Experiment is not active'
    };
  }
  
  // Check date range if specified
  const now = new Date();
  if (config.startDate && now < config.startDate) {
    return {
      variant: config.defaultVariant,
      experiment: config,
      reason: 'Experiment has not started yet'
    };
  }
  
  if (config.endDate && now > config.endDate) {
    return {
      variant: config.defaultVariant,
      experiment: config,
      reason: 'Experiment has ended'
    };
  }
  
  // Check force variant
  if (context.forceVariant) {
    const validVariant = config.variants.find(v => v.key === context.forceVariant);
    if (validVariant) {
      return {
        variant: context.forceVariant,
        experiment: config,
        reason: 'Forced variant'
      };
    }
  }
  
  // Evaluate targeting rules
  if (config.targetingRules && config.targetingRules.length > 0) {
    const meetsTargeting = evaluateTargetingRules(
      config.targetingRules,
      context.attributes || {}
    );
    
    if (!meetsTargeting) {
      return {
        variant: config.defaultVariant,
        experiment: config,
        reason: 'Does not meet targeting criteria'
      };
    }
  }
  
  // Determine variant based on traffic allocation
  const variant = allocateVariant(
    config,
    context.userId || generateAnonymousId()
  );
  
  return {
    variant: variant.key,
    experiment: config,
    reason: 'Allocated by traffic rules'
  };
}

/**
 * Get variant without evaluation (for server-side rendering)
 */
export function getVariant(
  experiment: ExperimentConfig,
  variantKey: string
): ExperimentVariant | null {
  return experiment.variants.find(v => v.key === variantKey) || null;
}

/**
 * Evaluate targeting rules
 */
function evaluateTargetingRules(
  rules: Array<{
    attribute: string;
    operator: string;
    value: any;
  }>,
  attributes: Record<string, any>
): boolean {
  return rules.every(rule => {
    const attrValue = attributes[rule.attribute];
    
    switch (rule.operator) {
      case 'equals':
        return attrValue === rule.value;
      
      case 'contains':
        return typeof attrValue === 'string' && 
               attrValue.includes(rule.value);
      
      case 'greater_than':
        return typeof attrValue === 'number' && 
               attrValue > rule.value;
      
      case 'less_than':
        return typeof attrValue === 'number' && 
               attrValue < rule.value;
      
      case 'in':
        return Array.isArray(rule.value) && 
               rule.value.includes(attrValue);
      
      case 'not_in':
        return Array.isArray(rule.value) && 
               !rule.value.includes(attrValue);
      
      default:
        return false;
    }
  });
}

/**
 * Allocate variant based on traffic rules
 */
function allocateVariant(
  experiment: ExperimentConfig,
  identifier: string
): ExperimentVariant {
  const allocation = experiment.trafficAllocation || { type: 'random' };
  
  switch (allocation.type) {
    case 'sticky':
      return getStickyVariant(experiment, identifier);
    
    case 'user_attribute':
      // This would require additional context
      // For now, fall back to sticky
      return getStickyVariant(experiment, identifier);
    
    case 'random':
    default:
      return getRandomVariant(experiment);
  }
}

/**
 * Get sticky variant based on user identifier
 */
function getStickyVariant(
  experiment: ExperimentConfig,
  identifier: string
): ExperimentVariant {
  const seed = experiment.trafficAllocation?.seed || experiment.key;
  const hash = createHash('md5')
    .update(`${seed}:${identifier}`)
    .digest('hex');
  
  // Convert hash to number between 0 and 1
  const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  
  // Allocate based on variant weights
  const variants = experiment.variants;
  let cumulativeWeight = 0;
  
  for (const variant of variants) {
    const weight = variant.weight || (100 / variants.length);
    cumulativeWeight += weight / 100;
    
    if (hashValue <= cumulativeWeight) {
      return variant;
    }
  }
  
  // Fallback to last variant
  return variants[variants.length - 1];
}

/**
 * Get random variant
 */
function getRandomVariant(experiment: ExperimentConfig): ExperimentVariant {
  const variants = experiment.variants;
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (const variant of variants) {
    const weight = variant.weight || (100 / variants.length);
    cumulativeWeight += weight / 100;
    
    if (random <= cumulativeWeight) {
      return variant;
    }
  }
  
  // Fallback to last variant
  return variants[variants.length - 1];
}

/**
 * Generate anonymous identifier
 */
function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user is in experiment
 */
export async function isUserInExperiment(
  experimentKey: string,
  userId: string
): Promise<boolean> {
  const db = await import('@/db').then(m => m.getDb());
  const exposures = db.collection('experiment_exposures');
  
  const exposure = await exposures.findOne({
    experimentKey,
    userId
  });
  
  return !!exposure;
}

/**
 * Get all active experiments for evaluation
 */
export async function getActiveExperiments(): Promise<ExperimentConfig[]> {
  const experiments = getExperimentsCollection();
  const now = new Date();
  
  const activeExperiments = await experiments.find({
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: { $exists: false } },
          { startDate: { $lte: now } }
        ]
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: now } }
        ]
      }
    ]
  }).toArray();
  
  return activeExperiments;
}