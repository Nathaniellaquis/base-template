/**
 * Experiment CRUD Operations
 * Business logic for experiment management
 */

import { ObjectId } from 'mongodb';
import { getExperimentsCollection } from '@/config/mongodb';
import { toObjectIdOrThrow } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { ExperimentConfig, ExperimentVariant } from '@shared';

const logger = createLogger('ExperimentService');

interface CreateExperimentInput {
  name: string;
  key: string;
  description?: string;
  isActive?: boolean;
  variants: ExperimentVariant[];
  defaultVariant: string;
  trafficAllocation?: {
    type: 'random' | 'sticky' | 'user_attribute';
    seed?: string;
  };
  targetingRules?: Array<{
    attribute: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  }>;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Create a new experiment
 */
export async function createExperiment(
  userId: string,
  input: CreateExperimentInput
): Promise<ExperimentConfig & { _id: string }> {
  const experiments = getExperimentsCollection();
  
  // Validate experiment key is unique
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
  
  // Create experiment document
  const experiment = {
    ...input,
    isActive: input.isActive || false,
    createdAt: new Date(),
    createdBy: userId,
    updatedAt: new Date(),
    updatedBy: userId,
  };
  
  const result = await experiments.insertOne(experiment);
  
  logger.info('Created experiment', {
    experimentId: result.insertedId.toString(),
    key: input.key,
    createdBy: userId,
  });
  
  return {
    ...experiment,
    _id: result.insertedId.toString(),
  };
}

/**
 * Update an experiment
 */
export async function updateExperiment(
  userId: string,
  experimentKey: string,
  updates: Partial<CreateExperimentInput>
): Promise<ExperimentConfig> {
  const experiments = getExperimentsCollection();
  
  // If updating variants, validate them
  if (updates.variants) {
    if (updates.defaultVariant || updates.variants) {
      const defaultVariant = updates.defaultVariant || 
        (await experiments.findOne({ key: experimentKey }))?.defaultVariant;
      
      const defaultExists = updates.variants.some(v => v.key === defaultVariant);
      if (!defaultExists) {
        throw new Error('Default variant must be one of the defined variants');
      }
    }
    
    const totalWeight = updates.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (totalWeight > 0 && totalWeight !== 100) {
      throw new Error('Variant weights must sum to 100');
    }
  }
  
  const result = await experiments.findOneAndUpdate(
    { key: experimentKey },
    { 
      $set: {
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId,
      }
    },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new Error('Experiment not found');
  }
  
  logger.info('Updated experiment', {
    experimentKey,
    updatedBy: userId,
  });
  
  return result;
}

/**
 * Update experiment status (activate/deactivate)
 */
export async function updateExperimentStatus(
  userId: string,
  experimentKey: string,
  isActive: boolean
): Promise<ExperimentConfig> {
  const experiments = getExperimentsCollection();
  
  const result = await experiments.findOneAndUpdate(
    { key: experimentKey },
    { 
      $set: {
        isActive,
        updatedAt: new Date(),
        updatedBy: userId,
      }
    },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new Error('Experiment not found');
  }
  
  logger.info('Updated experiment status', {
    experimentKey,
    isActive,
    updatedBy: userId,
  });
  
  return result;
}

/**
 * Get experiment by key
 */
export async function getExperiment(experimentKey: string): Promise<ExperimentConfig | null> {
  const experiments = getExperimentsCollection();
  const experiment = await experiments.findOne({ key: experimentKey });
  return experiment;
}

/**
 * List experiments with filtering
 */
export async function listExperiments(options: {
  isActive?: boolean;
  limit?: number;
  skip?: number;
} = {}): Promise<{ experiments: ExperimentConfig[]; total: number }> {
  const experiments = getExperimentsCollection();
  const { isActive, limit = 50, skip = 0 } = options;
  
  const query: any = {};
  if (isActive !== undefined) {
    query.isActive = isActive;
  }
  
  const [experimentsList, total] = await Promise.all([
    experiments
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray(),
    experiments.countDocuments(query)
  ]);
  
  return {
    experiments: experimentsList,
    total
  };
}

/**
 * Delete an experiment (soft delete)
 */
export async function deleteExperiment(
  userId: string,
  experimentKey: string
): Promise<void> {
  const experiments = getExperimentsCollection();
  
  const result = await experiments.updateOne(
    { key: experimentKey },
    { 
      $set: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: userId,
      }
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('Experiment not found');
  }
  
  logger.info('Deleted experiment', {
    experimentKey,
    deletedBy: userId,
  });
}