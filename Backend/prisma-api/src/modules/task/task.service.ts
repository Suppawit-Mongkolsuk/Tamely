import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
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

  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.CREATE_TASK);
  if (!allowed) throw new AppError(403, 'Insufficient permissions');

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

  if (
    data.assigneeId !== undefined &&
    data.assigneeId !== task.assigneeId &&
    !(await hasPermission(task.workspaceId, userId, PERMISSIONS.ASSIGN_TASK))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

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
    !(await hasPermission(task.workspaceId, userId, PERMISSIONS.DELETE_ANY_TASK))
  ) {
    throw new AppError(403, 'Not authorized to delete this task');
  }

  await taskRepository.remove(taskId);
};
