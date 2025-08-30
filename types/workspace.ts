/**
 * Workspace types - only exist when workspace feature is enabled
 */

import type { Subscription } from './payment';

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface Workspace {
  _id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];

  // Billing - workspaces own subscriptions when feature enabled

  subscription?: Subscription;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceRole = WorkspaceMember['role'];

// Permission helpers
export type WorkspacePermission =
  | 'workspace:update'
  | 'workspace:delete'
  | 'members:invite'
  | 'members:remove'
  | 'members:update_role'
  | 'billing:manage';

export const ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  owner: [
    'workspace:update',
    'workspace:delete',
    'members:invite',
    'members:remove',
    'members:update_role',
    'billing:manage',
  ],
  admin: [
    'workspace:update',
    'members:invite',
    'members:remove',
    'members:update_role',
  ],
  member: [],
};

// Workspace invite types
export interface WorkspaceInvite {
  _id: string;
  code: string;              // 4 digit numeric code
  workspaceId: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;           // 7 days default
  maxUses?: number;          // Optional usage limit
  usedCount: number;
  usedBy: string[];          // User IDs who used the invite
  active: boolean;
}