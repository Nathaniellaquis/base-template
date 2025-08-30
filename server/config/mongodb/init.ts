/**
 * MongoDB Initialization
 * Handles database connection and index creation
 */

import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { mongodbConfig, indexDefinitions } from './config';
import { createLogger } from '../../utils/logging/logger';
import type { User, OnboardingDocument, NotificationDocument, ExperimentConfig, Workspace, WorkspaceInvite } from '@shared';

// MongoDB document types (with ObjectId for _id)
type UserDocument = Omit<User, '_id'> & { _id?: ObjectId };

const logger = createLogger('MongoDB');

// Global variables to store connection
let client: MongoClient | null = null;
let db: Db | null = null;

// Create indexes for all collections
async function createIndexes(database: Db): Promise<void> {
  try {
    // Create indexes for each collection
    for (const [collectionName, indexes] of Object.entries(indexDefinitions)) {
      const collection = database.collection(collectionName);
      
      for (const index of indexes) {
        await collection.createIndex(index.key, index.options);
      }
      
      logger.info(`Indexes created for ${collectionName} collection`);
    }
    
    logger.info('All database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    // Don't throw - indexes are not critical for app startup
  }
}

// Connect to MongoDB
export async function connectDB(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(mongodbConfig.uri, {
      maxPoolSize: mongodbConfig.options.maxPoolSize,
      minPoolSize: mongodbConfig.options.minPoolSize,
      connectTimeoutMS: mongodbConfig.options.connectTimeoutMS,
      serverSelectionTimeoutMS: mongodbConfig.options.serverSelectionTimeoutMS,
    });
    await client.connect();

    db = client.db(mongodbConfig.dbName);
    
    // Create indexes in background
    createIndexes(db).catch(error => {
      logger.error('Background index creation failed:', error);
    });
    
    logger.info(`Connected to MongoDB database: ${mongodbConfig.dbName}`);
    return db;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get database instance
export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

// Collection getters with proper typing
export function getUserCollection(): Collection<UserDocument> {
  return getDb().collection<UserDocument>(mongodbConfig.collections.users);
}

export function getOnboardingCollection(): Collection<OnboardingDocument> {
  return getDb().collection<OnboardingDocument>(mongodbConfig.collections.onboarding);
}

export function getNotificationsCollection(): Collection<NotificationDocument> {
  return getDb().collection<NotificationDocument>(mongodbConfig.collections.notifications);
}

export function getExperimentsCollection(): Collection<ExperimentConfig> {
  return getDb().collection<ExperimentConfig>(mongodbConfig.collections.experiments);
}

export function getWorkspaceCollection(): Collection<Workspace> {
  return getDb().collection<Workspace>(mongodbConfig.collections.workspaces);
}

export function getWorkspaceInvitesCollection(): Collection<WorkspaceInvite> {
  return getDb().collection<WorkspaceInvite>(mongodbConfig.collections.workspace_invites);
}

// Graceful shutdown
export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
}

// Health check
export async function checkConnection(): Promise<boolean> {
  if (!db) return false;
  
  try {
    await db.admin().ping();
    return true;
  } catch {
    return false;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});