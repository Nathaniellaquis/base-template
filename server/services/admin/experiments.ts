/**
 * Admin Experiments Service
 * Business logic for admin experiment management
 */

import {
  createExperiment as createExp,
  updateExperiment as updateExp,
  listExperiments,
  deleteExperiment as deleteExp
} from '../experiment/crud';
import type { ExperimentConfig } from '@shared';

/**
 * Create experiment (admin wrapper)
 */
export async function createExperiment(input: {
  key: string;
  name: string;
  description?: string;
  variants: Array<{
    key: string;
    name: string;
    weight?: number;
  }>;
  defaultVariant: string;
  isActive?: boolean;
}): Promise<ExperimentConfig & { _id: string }> {
  // For admin operations, we'll use a system user ID
  const systemUserId = 'admin';
  
  return createExp(systemUserId, {
    ...input,
    isActive: input.isActive ?? true,
  });
}

/**
 * Update experiment (admin wrapper)
 */
export async function updateExperiment(
  key: string,
  updates: {
    name?: string;
    description?: string;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ExperimentConfig> {
  const systemUserId = 'admin';
  return updateExp(systemUserId, key, updates);
}

/**
 * Get all experiments
 */
export async function getAllExperiments(): Promise<ExperimentConfig[]> {
  const { experiments } = await listExperiments();
  return experiments;
}

/**
 * Delete experiment (admin wrapper)
 */
export async function deleteExperiment(key: string): Promise<void> {
  const systemUserId = 'admin';
  return deleteExp(systemUserId, key);
}