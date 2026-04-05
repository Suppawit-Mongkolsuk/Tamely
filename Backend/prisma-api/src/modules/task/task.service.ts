import { prisma } from '../../index';
import { CreateTaskPayload, UpdateTaskPayload } from '../../types';
import { TaskStatus, TaskCreator } from '@prisma/client';

const assigneeSelect = { id: true, Name: true, avatarUrl: true } as const;
const creatorSelect = { id: true, Name: true } as const;

export const createTask = async (
  workspaceId: string,
  userId: string,
  data: CreateTaskPayload,
) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  return prisma.task.create({
    data: {
      workspaceId,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      priority: data.priority ?? 'MEDIUM',
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

export const getTasks = async (
  workspaceId: string,
  userId: string,
  filters: {
    month?: number;
    year?: number;
    status?: string;
    priority?: string;
  },
) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');

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

export const updateTask = async (
  taskId: string,
  userId: string,
  data: UpdateTaskPayload,
) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: task.workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

  return prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: { select: assigneeSelect },
      createdByUser: { select: creatorSelect },
    },
  });
};

export const deleteTask = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: task.workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  if (
    task.createdById !== userId &&
    task.assigneeId !== userId &&
    member.role !== 'OWNER' &&
    member.role !== 'ADMIN'
  ) {
    throw new Error('Not authorized to delete this task');
  }

  await prisma.task.delete({ where: { id: taskId } });
};
