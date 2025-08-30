import { ObjectId } from 'mongodb';
import { TRPCError } from '@trpc/server';
import { getDb } from '@/config/mongodb';
import type { WorkspaceInvite } from '@shared';

/**
 * Generates a unique 4-digit invite code
 */
function generateInviteCode(): string {
  // Generate a 4-digit number (1000-9999)
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Creates a workspace invite
 */
export async function generateWorkspaceInvite({
  workspaceId,
  userId,
  expiresInDays = 7,
  maxUses,
}: {
  workspaceId: string;
  userId: string;
  expiresInDays?: number;
  maxUses?: number;
}): Promise<WorkspaceInvite> {
  const db = await getDb();
  
  // Verify workspace exists
  const workspace = await db.collection('workspaces').findOne({
    _id: new ObjectId(workspaceId),
  });

  if (!workspace) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Workspace not found',
    });
  }

  // Verify user has permission to invite
  const member = workspace.members.find(
    (m: any) => m.userId === userId
  );

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to generate invites',
    });
  }

  // Generate a unique 4-digit code
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    code = generateInviteCode();
    const existing = await db.collection('workspace_invites').findOne({ 
      code,
      active: true 
    });
    if (!existing) {
      break;
    }
    attempts++;
  }
  
  if (attempts === maxAttempts) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate unique invite code',
    });
  }

  // Create invite
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (expiresInDays * 24 * 60 * 60 * 1000));
  
  const invite: Omit<WorkspaceInvite, '_id'> = {
    code: code!,
    workspaceId,
    createdBy: userId,
    createdAt: now,
    expiresAt,
    maxUses,
    usedCount: 0,
    usedBy: [],
    active: true,
  };

  const result = await db.collection('workspace_invites').insertOne(invite);

  return {
    _id: result.insertedId.toString(),
    ...invite,
  };
}