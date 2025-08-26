/**
 * Admin Experiments Router
 * Handles admin operations related to experiments
 */

import { router, adminProcedure } from '@/trpc/trpc';
import { z } from 'zod';
import {
  createExperiment,
  updateExperiment,
  getAllExperiments,
  deleteExperiment
} from '@/services/admin/experiments';
import {
  getExperimentMetrics
} from '@/services/experiment/metrics';

const createExperimentSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  variants: z.array(z.object({
    key: z.string(),
    name: z.string(),
    weight: z.number().optional(),
  })),
  defaultVariant: z.string(),
  isActive: z.boolean().default(true),
});

const updateExperimentSchema = z.object({
  key: z.string(),
  updates: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }),
});

const getExperimentMetricsSchema = z.object({
  experimentKey: z.string(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
});

export const adminExperimentsRouter = router({
  // Create experiment
  createExperiment: adminProcedure
    .input(createExperimentSchema)
    .mutation(async ({ ctx, input }) => {
      return createExperiment(input);
    }),
  
  // Update experiment
  updateExperiment: adminProcedure
    .input(updateExperimentSchema)
    .mutation(async ({ ctx, input }) => {
      return updateExperiment(input.key, input.updates);
    }),
  
  // Get all experiments
  getAllExperiments: adminProcedure
    .query(async ({ ctx }) => {
      return getAllExperiments();
    }),
  
  // Delete experiment
  deleteExperiment: adminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return deleteExperiment(input.key);
    }),
  
  // Get experiment metrics
  getExperimentMetrics: adminProcedure
    .input(getExperimentMetricsSchema)
    .query(async ({ ctx, input }) => {
      return getExperimentMetrics(input.experimentKey, input.dateRange);
    }),
});