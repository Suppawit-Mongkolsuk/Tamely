import { prisma } from '../../index';
import { WorkspaceRole } from '@prisma/client';
import { TypePayloadCreateWorkspace, TypePayloadUpdateWorkspace } from './workspace.model';

/* ======================= SELECTS ======================= */

const ownerSelect = { id: true, Name: true, email: true, avatarUrl: true } as const;
const workspaceBaseSelect = {
  id: true,
  name: true,
  description: true,
  iconUrl: true,
  ownerId: true,
  inviteCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
const workspaceWithOwnerSelect = {
  ...workspaceBaseSelect,
  owner: { select: ownerSelect },
} as const;
const customRoleSelect = {
  id: true,
  name: true,
  color: true,
  position: true,
  permissions: true,
} as const;
const memberUserSelect = { Name: true, email: true, avatarUrl: true, lastSeenAt: true } as const;

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
    select: workspaceWithOwnerSelect,
  });
};

/* ======================= READ ======================= */

export const findMembershipsByUser = async (userId: string) => {
  return prisma.workspaceMember.findMany({
    where: { userId },
    select: {
      role: true,
      joinedAt: true,
      workspace: {
        select: {
          ...workspaceBaseSelect,
          _count: { select: { members: true, rooms: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
};

export const findById = async (workspaceId: string) => {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      ...workspaceWithOwnerSelect,
      _count: { select: { members: true, rooms: true, posts: true } },
    },
  });
};

export const findByIdSimple = async (workspaceId: string) => {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, ownerId: true },
  });
};

export const findByInviteCode = async (inviteCode: string) => {
  return prisma.workspace.findUnique({
    where: { inviteCode },
    select: workspaceBaseSelect,
  });
};

/* ======================= UPDATE ======================= */

export const update = async (
  workspaceId: string,
  data: TypePayloadUpdateWorkspace,
) => {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
    select: workspaceBaseSelect,
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
    select: { userId: true, role: true },
  });
};

export const findWorkspaceMemberDetailed = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: customRoleSelect,
              },
            },
          },
        },
      },
    },
  });
};

export const findAllMembers = async (workspaceId: string) => {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          ...memberUserSelect,
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: customRoleSelect,
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
};

export const createMember = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  return prisma.workspaceMember.create({
    data: { workspaceId, userId, role },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          ...memberUserSelect,
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: customRoleSelect,
              },
            },
          },
        },
      },
    },
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
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          ...memberUserSelect,
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: customRoleSelect,
              },
            },
          },
        },
      },
    },
  });
};
