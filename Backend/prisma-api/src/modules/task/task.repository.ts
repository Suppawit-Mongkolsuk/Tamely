import { prisma } from '../../index';
import { TaskStatus, TaskCreator } from '@prisma/client';

/* ======================= SELECTS ======================= */

const assigneeSelect = { id: true, Name: true, avatarUrl: true } as const;
const creatorSelect = { id: true, Name: true } as const;

/* ======================= WORKSPACE MEMBER ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

/* ======================= CREATE ======================= */

export const create = async (
  workspaceId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    date: Date;
    priority: string;
    assigneeId?: string;
  },
) => {
  return prisma.task.create({
    data: {
      workspaceId,
      title: data.title,
      description: data.description,
      date: data.date,
      priority: data.priority as any,
      status: TaskStatus.TODO,
      assigneeId: data.assigneeId ?? userId,
      createdById: userId,
      createdBy: TaskCreator.USER,
    },
    include: {
      assignee: { select: assigneeSelect },
      createdByUser: { select: creatorSelect },
    },
  });
};

/* ======================= READ ======================= */

export const findMany = async (
  workspaceId: string,
  filters: {
    month?: number;
    year?: number;
    status?: string;
    priority?: string;
  },
) => {
  const where: Record<string, unknown> = { workspaceId };

  if (filters.month && filters.year) {
    const start = new Date(filters.year, filters.month - 1, 1);
    const end = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: assigneeSelect },
      createdByUser: { select: creatorSelect },
    },
    orderBy: { date: 'asc' },
  });
};

export const findById = async (taskId: string) => {
  return prisma.task.findUnique({ where: { id: taskId } });
};

/* ======================= UPDATE ======================= */

export const update = async (taskId: string, data: Record<string, unknown>) => {
  return prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignee: { select: assigneeSelect },
      createdByUser: { select: creatorSelect },
    },
  });
};

/* ======================= DELETE ======================= */

export const remove = async (taskId: string) => {
  return prisma.task.delete({ where: { id: taskId } });
};
