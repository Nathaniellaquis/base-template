import { ObjectId } from 'mongodb';
import { getDb } from '@/config/mongodb';
import { TRPCError } from '@trpc/server';
import type { WorkspaceInvite } from '@shared';

/**
 * Validates a workspace invite code
 */
export async function validateWorkspaceInvite(code: string) {
  const db = await getDb();
  
  // Find invite by code
  const invite = await db.collection<WorkspaceInvite>('workspace_invites').findOne({
    code: code,
    active: true,
  });

  if (!invite) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Invalid or expired invite code',
    });
  }

  // Check if expired
  if (new Date() > new Date(invite.expiresAt)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'This invite code has expired',
    });
  }

  // Check if max uses reached
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'This invite code has reached its maximum uses',
    });
  }

  // Get workspace details
  const workspace = await db.collection('workspaces').findOne(
    { _id: new ObjectId(invite.workspaceId) },
    { projection: { name: 1, members: 1 } }
  );

  if (!workspace) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'The workspace for this invite no longer exists',
    });
  }

  return {
    inviteId: invite._id.toString(),
    workspaceId: workspace._id.toString(),
    workspaceName: workspace.name,
    memberCount: workspace.members.length,
  };
}