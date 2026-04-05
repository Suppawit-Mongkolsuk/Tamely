import { prisma } from '../../index';
import {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  UpdateMemberRolePayload,
} from '../../types';
import { WorkspaceRole } from '@prisma/client';

export const createWorkspace = async (
  ownerId: string,
  data: CreateWorkspacePayload,
) => {
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      iconUrl: data.iconUrl,
      ownerId,
      members: {
        create: { userId: ownerId, role: WorkspaceRole.OWNER },
      },
    },
    include: { owner: { select: { id: true, Name: true, email: true } } },
  });

  return workspace;
};

export const getUserWorkspaces = async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, rooms: true } },
          owner: { select: { id: true, Name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
    joinedAt: m.joinedAt,
    memberCount: m.workspace._count.members,
    roomCount: m.workspace._count.rooms,
  }));
};

export const getWorkspaceById = async (
  workspaceId: string,
  userId: string,
) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: { select: { id: true, Name: true, email: true, avatarUrl: true } },
      _count: { select: { members: true, rooms: true, posts: true } },
    },
  });
  if (!workspace) throw new Error('Workspace not found');

  return { ...workspace, role: member.role };
};

export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  data: UpdateWorkspacePayload,
) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)
  ) {
    throw new Error('Only owner or admin can update workspace');
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
};

export const deleteWorkspace = async (
  workspaceId: string,
  userId: string,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) throw new Error('Workspace not found');
  if (workspace.ownerId !== userId) {
    throw new Error('Only the owner can delete this workspace');
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
};

export const getMembers = async (workspaceId: string, userId: string) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, Name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
};

export const addMemberByEmail = async (
  workspaceId: string,
  requesterId: string,
  email: string,
  role: WorkspaceRole = WorkspaceRole.MEMBER,
) => {
  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: requesterId } },
  });
  if (
    !requester ||
    (requester.role !== WorkspaceRole.OWNER &&
      requester.role !== WorkspaceRole.ADMIN)
  ) {
    throw new Error('Only owner or admin can add members');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found with this email');

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  if (existing) throw new Error('User is already a member');

  return prisma.workspaceMember.create({
    data: { workspaceId, userId: user.id, role },
    include: {
      user: {
        select: { id: true, Name: true, email: true, avatarUrl: true },
      },
    },
  });
};

export const joinByInviteCode = async (
  inviteCode: string,
  userId: string,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode },
  });
  if (!workspace) throw new Error('Invalid invite code');

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId },
    },
  });
  if (existing) throw new Error('You are already a member');

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId,
      role: WorkspaceRole.MEMBER,
    },
  });

  return workspace;
};

export const removeMember = async (
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) throw new Error('Workspace not found');

  if (targetUserId === workspace.ownerId) {
    throw new Error('Cannot remove the workspace owner');
  }

  if (requesterId !== targetUserId) {
    const requester = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: requesterId } },
    });
    if (
      !requester ||
      (requester.role !== WorkspaceRole.OWNER &&
        requester.role !== WorkspaceRole.ADMIN)
    ) {
      throw new Error('Only owner or admin can remove members');
    }
  }

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
};

export const updateMemberRole = async (
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
  data: UpdateMemberRolePayload,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) throw new Error('Workspace not found');

  if (workspace.ownerId !== requesterId) {
    throw new Error('Only the owner can change member roles');
  }

  if (targetUserId === workspace.ownerId) {
    throw new Error('Cannot change the owner role');
  }

  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { role: data.role },
    include: {
      user: {
        select: { id: true, Name: true, email: true, avatarUrl: true },
      },
    },
  });
};

export const regenerateInviteCode = async (
  workspaceId: string,
  userId: string,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) throw new Error('Workspace not found');
  if (workspace.ownerId !== userId) {
    throw new Error('Only the owner can regenerate the invite code');
  }

  const crypto = await import('crypto');
  const newCode = crypto.randomUUID();

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { inviteCode: newCode },
    select: { id: true, inviteCode: true },
  });
};
