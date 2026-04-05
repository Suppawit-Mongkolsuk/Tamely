import { apiClient } from './api';
import type { ApiSuccessResponse } from '@/types';

export interface TaskResponse {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  date: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  createdBy: 'USER' | 'AI';
  assignee?: { id: string; Name: string; avatarUrl?: string | null };
  createdByUser?: { id: string; Name: string };
  createdAt: string;
  updatedAt: string;
}

export const calendarService = {
  async getTasks(
    workspaceId: string,
    filters?: { month?: number; year?: number; status?: string },
  ): Promise<TaskResponse[]> {
    const params: Record<string, string> = {};
    if (filters?.month) params.month = String(filters.month);
    if (filters?.year) params.year = String(filters.year);
    if (filters?.status) params.status = filters.status;
    const res = await apiClient.get<ApiSuccessResponse<TaskResponse[]>>(
      `/workspaces/${workspaceId}/tasks`,
      params,
    );
    return res.data;
  },

  async createTask(
    workspaceId: string,
    data: {
      title: string;
      description?: string;
      date: string;
      priority?: string;
      assigneeId?: string;
    },
  ): Promise<TaskResponse> {
    const res = await apiClient.post<ApiSuccessResponse<TaskResponse>>(
      `/workspaces/${workspaceId}/tasks`,
      data,
    );
    return res.data;
  },

  async updateTask(
    taskId: string,
    data: Record<string, unknown>,
  ): Promise<TaskResponse> {
    const res = await apiClient.patch<ApiSuccessResponse<TaskResponse>>(
      `/tasks/${taskId}`,
      data,
    );
    return res.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },
};
