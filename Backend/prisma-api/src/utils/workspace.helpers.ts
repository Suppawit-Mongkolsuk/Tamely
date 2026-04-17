import { prisma } from '../index';
import { AppError } from '../types';

export const getWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { userId: true, role: true },
  });
};

export const assertWorkspaceActive = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, isActive: true },
  });

  if (!workspace) {
    throw new AppError(404, 'Workspace not found');
  }

  if (!workspace.isActive) {
    throw new AppError(423, 'Workspace is currently blocked by admin');
  }

  return workspace;
};

export const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member) {
    throw new AppError(403, 'You are not a member of this workspace');
  }
  await assertWorkspaceActive(workspaceId);
  return member;
};
