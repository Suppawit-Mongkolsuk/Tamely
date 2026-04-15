import { AppError } from '../../types';
import { TypePayloadCreateTask, TypePayloadUpdateTask } from './task.model';
import * as taskRepository from './task.repository';

/* ======================= CREATE ======================= */

export const createTask = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreateTask,
) => {
  const member = await taskRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  return taskRepository.create(workspaceId, userId, {
    title: data.title,
    description: data.description,
    date: new Date(data.date),
    priority: data.priority ?? 'MEDIUM',
    assigneeId: data.assigneeId,
  });
};

/* ======================= READ ======================= */

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
  const member = await taskRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  // ทุก role เห็นเฉพาะ task ที่ถูก assign ให้ตัวเอง
  return taskRepository.findMany(workspaceId, {
    ...filters,
    assigneeId: userId,
  });
};

/* ======================= UPDATE ======================= */

export const updateTask = async (
  taskId: string,
  userId: string,
  data: TypePayloadUpdateTask,
) => {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new AppError(404, 'Task not found');

  const member = await taskRepository.findWorkspaceMember(task.workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

  return taskRepository.update(taskId, updateData);
};

/* ======================= DELETE ======================= */

export const deleteTask = async (taskId: string, userId: string) => {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new AppError(404, 'Task not found');

  const member = await taskRepository.findWorkspaceMember(task.workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  if (
    task.createdById !== userId &&
    task.assigneeId !== userId &&
    member.role !== 'OWNER' &&
    member.role !== 'ADMIN'
  ) {
    throw new AppError(403, 'Not authorized to delete this task');
  }

  await taskRepository.remove(taskId);
};
