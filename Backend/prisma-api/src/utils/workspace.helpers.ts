import { prisma } from '../index';
import { AppError } from '../types';

export const getWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { userId: true, role: true },
  });
};

export const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member) {
    throw new AppError(403, 'You are not a member of this workspace');
  }
  return member;
};
