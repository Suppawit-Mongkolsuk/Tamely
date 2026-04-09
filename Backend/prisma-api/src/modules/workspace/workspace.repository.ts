import { prisma } from '../../index';
import { WorkspaceRole } from '@prisma/client';
import { TypePayloadCreateWorkspace, TypePayloadUpdateWorkspace } from './workspace.model';

/* ======================= SELECTS ======================= */

const ownerSelect = { id: true, Name: true, email: true, avatarUrl: true } as const;
const memberUserSelect = { id: true, Name: true, email: true, avatarUrl: true } as const;

/* ======================= CREATE ======================= */

export const create = async (
  ownerId: string,
  data: TypePayloadCreateWorkspace,
) => {
  return prisma.workspace.create({
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
};

/* ======================= READ ======================= */

export const findMembershipsByUser = async (userId: string) => {
  return prisma.workspaceMember.findMany({
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
};

export const findById = async (workspaceId: string) => {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: { select: ownerSelect },
      _count: { select: { members: true, rooms: true, posts: true } },
    },
  });
};

export const findByIdSimple = async (workspaceId: string) => {
  return prisma.workspace.findUnique({ where: { id: workspaceId } });
};

export const findByInviteCode = async (inviteCode: string) => {
  return prisma.workspace.findUnique({ where: { inviteCode } });
};

/* ======================= UPDATE ======================= */

export const update = async (
  workspaceId: string,
  data: TypePayloadUpdateWorkspace,
) => {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
};

export const updateInviteCode = async (workspaceId: string, newCode: string) => {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { inviteCode: newCode },
    select: { id: true, inviteCode: true },
  });
};

/* ======================= DELETE ======================= */

export const remove = async (workspaceId: string) => {
  return prisma.workspace.delete({ where: { id: workspaceId } });
};

/* ======================= MEMBERS ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

export const findAllMembers = async (workspaceId: string) => {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: memberUserSelect } },
    orderBy: { joinedAt: 'asc' },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const createMember = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  return prisma.workspaceMember.create({
    data: { workspaceId, userId, role },
    include: { user: { select: memberUserSelect } },
  });
};

export const deleteMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role },
    include: { user: { select: memberUserSelect } },
  });
};
