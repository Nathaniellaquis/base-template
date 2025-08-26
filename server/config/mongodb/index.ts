/**
 * MongoDB Module
 * Centralized MongoDB configuration and exports
 */

// Export configuration
export { mongodbConfig, indexDefinitions } from './config';
export type { MongoDBConfig } from './config';

// Export database operations
export {
  connectDB,
  getDb,
  closeDB,
  checkConnection,
  getUserCollection,
  getOnboardingCollection,
  getNotificationsCollection,
  getExperimentsCollection,
} from './init';

// Re-export commonly used MongoDB types
export type {
  Collection,
  Db,
  MongoClient,
  Filter,
  FindOptions,
  UpdateFilter,
  UpdateOptions,
  DeleteOptions,
  InsertOneResult,
  UpdateResult,
  DeleteResult,
  WithId,
  OptionalId,
} from 'mongodb';