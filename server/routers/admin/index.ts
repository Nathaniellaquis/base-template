/**
 * Admin Router
 * Combines all admin sub-routers
 */

import { router } from '@/trpc/trpc';
import { adminNotificationsRouter } from './notifications';
import { adminUsersRouter } from './users';
import { adminSystemRouter } from './system';
import { adminExperimentsRouter } from './experiments';

export const adminRouter = router({
  // Notification management
  sendTestNotification: adminNotificationsRouter.sendTestNotification,
  getAllNotifications: adminNotificationsRouter.getAllNotifications,
  
  // User management
  getAllUsers: adminUsersRouter.getAllUsers,
  promoteToAdmin: adminUsersRouter.promoteToAdmin,
  
  // System stats
  getStats: adminSystemRouter.getStats,
  
  // Experiments management
  createExperiment: adminExperimentsRouter.createExperiment,
  updateExperiment: adminExperimentsRouter.updateExperiment,
  getAllExperiments: adminExperimentsRouter.getAllExperiments,
  deleteExperiment: adminExperimentsRouter.deleteExperiment,
  getExperimentMetrics: adminExperimentsRouter.getExperimentMetrics,
});