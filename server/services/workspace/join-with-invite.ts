import { getDb } from '@/config/mongodb';
import type { Workspace, WorkspaceInvite, WorkspaceMember } from '@shared';
import { TRPCError } from '@trpc/server';
import { ObjectId, WithId } from 'mongodb';

/**
 * Joins a workspace using an invite code
 */
export async function joinWorkspaceWithInvite({
  userId,
  code,
}: {
  userId: string;
  code: string;
}): Promise<Workspace> {
  const db = await getDb();

  // Find and validate invite
  const invite = await db.collection('workspace_invites').findOne({
    code: code,
    active: true,
  }) as WithId<WorkspaceInvite> | null;

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

  // Check if user already used this invite
  if (invite.usedBy.includes(userId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'You have already used this invite code',
    });
  }

  // Get workspace
  const workspace = await db.collection('workspaces').findOne({
    _id: new ObjectId(invite.workspaceId),
  });

  if (!workspace) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'The workspace for this invite no longer exists',
    });
  }

  // Check if user is already a member
  const existingMember = workspace.members.find(
    (m: WorkspaceMember) => m.userId === userId
  );

  if (existingMember) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'You are already a member of this workspace',
    });
  }

  // Add user to workspace
  const newMember: WorkspaceMember = {
    userId,
    role: 'member',
    joinedAt: new Date(),
  };

  await db.collection('workspaces').updateOne(
    { _id: new ObjectId(invite.workspaceId) },
    {
      $push: { members: newMember },
      $set: { updatedAt: new Date() }
    } as any
  );

  // Update user's workspace list
  const userWorkspaceEntry = {
    workspaceId: invite.workspaceId,
    role: 'member' as const,
    joinedAt: new Date(),
  };

  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: {
        workspaces: userWorkspaceEntry
      },
      $set: {
        currentWorkspaceId: invite.workspaceId, // Set as current workspace
      }
    } as any
  );

  // Update invite usage
  await db.collection('workspace_invites').updateOne(
    { _id: invite._id } as any,
    {
      $inc: { usedCount: 1 },
      $push: { usedBy: userId },
      $set: {
        // Deactivate if max uses reached
        active: !invite.maxUses || (invite.usedCount + 1) < invite.maxUses
      }
    } as any
  );

  // Return updated workspace
  const updatedWorkspace = await db.collection('workspaces').findOne({
    _id: new ObjectId(invite.workspaceId),
  });

  return {
    _id: updatedWorkspace!._id.toString(),
    name: updatedWorkspace!.name,
    ownerId: updatedWorkspace!.ownerId,
    members: updatedWorkspace!.members,

    subscription: updatedWorkspace!.subscription,
    createdAt: updatedWorkspace!.createdAt,
    updatedAt: updatedWorkspace!.updatedAt,
  };
}