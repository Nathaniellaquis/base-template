import { config } from '@/config';
import { Context } from '@/trpc/context';

/**
 * Workspace Scoping Utilities
 * 
 * Provides data scoping based on workspace feature flag
 */

/**
 * Add workspace or user scope to database queries
 */
export function addDataScope<T extends Record<string, any>>(
  query: T,
  ctx: Context
): T & { userId?: string; workspaceId?: string } {
  // If workspaces disabled or no workspace context, scope to user
  if (!config.enableWorkspaces || !ctx.workspaceId) {
    return {
      ...query,
      userId: ctx.user?._id
    };
  }
  
  // With workspaces enabled, scope to workspace instead
  return {
    ...query,
    workspaceId: ctx.workspaceId
  };
}

/**
 * Check if user has permission in workspace (when enabled)
 */
export function hasWorkspacePermission(
  ctx: Context,
  permission: string
): boolean {
  // If workspaces disabled, user always has permission
  if (!config.enableWorkspaces) {
    return true;
  }
  
  // No workspace context means no permission
  if (!ctx.workspace || !ctx.user) {
    return false;
  }
  
  // Find user's role in workspace
  const member = ctx.workspace.members.find(m => m.userId === ctx.user!._id);
  if (!member) {
    return false;
  }
  
  // For now, simple role checks (can be expanded with ROLE_PERMISSIONS)
  switch (permission) {
    case 'workspace:update':
    case 'members:invite':
      return member.role === 'owner' || member.role === 'admin';
    case 'workspace:delete':
    case 'billing:manage':
      return member.role === 'owner';
    default:
      return false;
  }
}