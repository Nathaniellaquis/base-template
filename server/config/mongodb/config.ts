/**
 * MongoDB Configuration
 * Database configuration and collection definitions
 */

import { config } from '@/config';

export interface MongoDBConfig {
  uri: string;
  dbName: string;
  collections: {
    users: string;
    onboarding: string;
    notifications: string;
    experiments: string;
    workspaces: string;
    workspace_invites: string;
  };
  options: {
    maxPoolSize: number;
    minPoolSize: number;
    connectTimeoutMS: number;
    serverSelectionTimeoutMS: number;
  };
}

export const mongodbConfig: MongoDBConfig = {
  uri: config.mongodb.uri,
  dbName: config.mongodb.dbName,
  collections: {
    users: config.mongodb.collections.user,
    onboarding: 'onboarding',
    notifications: 'notifications',
    experiments: 'experiments',
    workspaces: 'workspaces',
    workspace_invites: 'workspace_invites',
  },
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
  },
};

// Index definitions for each collection
export const indexDefinitions: Record<string, Array<{
  key: Record<string, 1 | -1>;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    background?: boolean;
  };
}>> = {
  users: [
    { key: { uid: 1 }, options: { unique: true } },
    { key: { email: 1 }, options: {} },

    { key: { role: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} },
    { key: { role: 1, createdAt: -1 }, options: {} },
  ],
  onboarding: [
    { key: { userId: 1 }, options: { unique: true } },
    { key: { completedAt: 1 }, options: {} },
  ],
  notifications: [
    { key: { userId: 1, createdAt: -1 }, options: {} },
    { key: { userId: 1, read: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} },
    { key: { userId: 1, read: 1, createdAt: -1 }, options: {} },
  ],
  experiments: [
    { key: { key: 1 }, options: { unique: true } },
    { key: { isActive: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} },
    { key: { isActive: 1, createdAt: -1 }, options: {} },
  ],
  workspace_invites: [
    { key: { code: 1 }, options: { unique: true } },
    { key: { workspaceId: 1 }, options: {} },
    { key: { active: 1, expiresAt: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} },
  ],
  workspaces: [
    { key: { 'members.userId': 1 }, options: {} },
    { key: { ownerId: 1 }, options: {} },
    { key: { 'members.userId': 1, _id: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} },
    { key: { name: 1 }, options: {} },
  ],
};