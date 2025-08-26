import { router, adminProcedure } from '@/trpc/trpc';
import { listExperiments } from './list-experiments';
import { getExperiment } from './get-experiment';
import { createExperiment } from './create-experiment';
import { updateExperimentStatus } from './update-experiment-status';
import { updateExperiment } from './update-experiment';
import { getExperimentMetrics } from './get-experiment-metrics';

export const experimentRouter = router({
  // List all experiments with optional search
  listExperiments: adminProcedure
    .input(listExperiments.input)
    .query(listExperiments.handler),
    
  // Get single experiment details
  getExperiment: adminProcedure
    .input(getExperiment.input)
    .query(getExperiment.handler),
    
  // Create new experiment
  createExperiment: adminProcedure
    .input(createExperiment.input)
    .mutation(createExperiment.handler),
    
  // Update experiment status (activate/deactivate)
  updateExperimentStatus: adminProcedure
    .input(updateExperimentStatus.input)
    .mutation(updateExperimentStatus.handler),
    
  // Update experiment configuration
  updateExperiment: adminProcedure
    .input(updateExperiment.input)
    .mutation(updateExperiment.handler),
    
  // Get detailed metrics for an experiment
  getExperimentMetrics: adminProcedure
    .input(getExperimentMetrics.input)
    .query(getExperimentMetrics.handler),
});