// ===== Calendar Service =====
// จัดการ Tasks

import { apiClient } from './api';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types';

export const calendarService = {
  async getTasks(workspaceId: string): Promise<Task[]> {
    return apiClient.get(`/workspaces/${workspaceId}/tasks`);
  },

  async createTask(workspaceId: string, data: CreateTaskRequest): Promise<Task> {
    return apiClient.post(`/workspaces/${workspaceId}/tasks`, data);
  },

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    return apiClient.patch(`/tasks/${taskId}`, data);
  },

  async deleteTask(taskId: string): Promise<void> {
    return apiClient.delete(`/tasks/${taskId}`);
  },
};
