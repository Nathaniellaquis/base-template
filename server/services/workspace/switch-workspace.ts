import { connectDB } from '@/config/mongodb';
import { ObjectId } from 'mongodb';

export async function switchWorkspace(
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; workspaceId: string }> {
  const db = await connectDB();
  
  // Verify user is member
  const workspace = await db.collection('workspaces').findOne({
    _id: new ObjectId(workspaceId),
    'members.userId': userId
  });
  
  if (!workspace) {
    throw new Error('Workspace not found or access denied');
  }
  
  // Update user's current workspace
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { currentWorkspaceId: workspaceId } }
  );
  
  return { success: true, workspaceId };
}