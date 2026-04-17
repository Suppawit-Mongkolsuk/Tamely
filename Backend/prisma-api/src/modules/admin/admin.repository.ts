import { AdminWorkspaceActionType } from '@prisma/client';
import { prisma } from '../../index';

const adminDashboardWorkspaceSelect = {
  id: true,
  name: true,
  description: true,
  iconUrl: true,
  inviteCode: true,
  isActive: true,
  blockedReason: true,
  blockedAt: true,
  blockedByAdminUsername: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: {
      id: true,
      Name: true,
      email: true,
    },
  },
  _count: {
    select: {
      members: true,
      rooms: true,
    },
  },
} as const;

const adminAuditLogSelect = {
  id: true,
  workspaceId: true,
  workspaceNameSnapshot: true,
  action: true,
  adminUsername: true,
  reason: true,
  previousIsActive: true,
  nextIsActive: true,
  createdAt: true,
} as const;

const adminWorkspaceStatusSelect = {
  id: true,
  name: true,
  isActive: true,
} as const;

const adminWorkspaceUpdateSelect = {
  id: true,
  name: true,
  isActive: true,
  blockedReason: true,
  blockedAt: true,
  blockedByAdminUsername: true,
  updatedAt: true,
} as const;

export const findDashboardWorkspaces = async () => {
  return prisma.workspace.findMany({
    select: adminDashboardWorkspaceSelect,
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const findAiUsageSummary = async (usageStartDate?: Date) => {
  return prisma.aiQuery.groupBy({
    by: ['workspaceId'],
    ...(usageStartDate
      ? {
          where: {
            createdAt: {
              gte: usageStartDate,
            },
          },
        }
      : {}),
    _count: {
      _all: true,
    },
    _sum: {
      tokensUsed: true,
    },
    _max: {
      createdAt: true,
    },
  });
};

export const findRecentAuditLogs = async (take = 20) => {
  return prisma.adminWorkspaceAuditLog.findMany({
    select: adminAuditLogSelect,
    orderBy: {
      createdAt: 'desc',
    },
    take,
  });
};

export const findWorkspaceStatusById = async (workspaceId: string) => {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: adminWorkspaceStatusSelect,
  });
};

export const updateWorkspaceStatusWithAudit = async (params: {
  workspaceId: string;
  workspaceName: string;
  previousIsActive: boolean;
  isActive: boolean;
  adminUsername: string;
  reason: string | null;
}) => {
  const [workspace] = await prisma.$transaction([
    prisma.workspace.update({
      where: { id: params.workspaceId },
      data: {
        isActive: params.isActive,
        blockedReason: params.isActive ? null : params.reason,
        blockedAt: params.isActive ? null : new Date(),
        blockedByAdminUsername: params.isActive ? null : params.adminUsername,
      },
      select: adminWorkspaceUpdateSelect,
    }),
    prisma.adminWorkspaceAuditLog.create({
      data: {
        workspaceId: params.workspaceId,
        workspaceNameSnapshot: params.workspaceName,
        action: params.isActive ? AdminWorkspaceActionType.UNBLOCK : AdminWorkspaceActionType.BLOCK,
        adminUsername: params.adminUsername,
        reason: params.reason,
        previousIsActive: params.previousIsActive,
        nextIsActive: params.isActive,
      },
    }),
  ]);

  return workspace;
};

export const deleteWorkspaceWithAudit = async (params: {
  workspaceId: string;
  workspaceName: string;
  previousIsActive: boolean;
  adminUsername: string;
  reason: string | null;
}) => {
  await prisma.$transaction([
    prisma.adminWorkspaceAuditLog.create({
      data: {
        workspaceId: params.workspaceId,
        workspaceNameSnapshot: params.workspaceName,
        action: AdminWorkspaceActionType.DELETE,
        adminUsername: params.adminUsername,
        reason: params.reason,
        previousIsActive: params.previousIsActive,
        nextIsActive: false,
      },
    }),
    prisma.workspace.delete({
      where: { id: params.workspaceId },
    }),
  ]);
};
