import { apiClient } from './api';
import type {
  AdminDashboardResponseData,
  AdminWorkspaceDeleteResponse,
  AdminUser,
  ApiSuccessResponse,
} from '@/types';

export const adminService = {
  async logout(): Promise<void> {
    try {
      await apiClient.post('/admin/logout');
    } catch {
      // no-op
    }
  },

  async getMe(): Promise<AdminUser> {
    const response = await apiClient.get<ApiSuccessResponse<AdminUser>>('/admin/me'); // ถ้า user ไม่ใช่ admin จะโดนบล็อกที่ backend และโยน error มา
    return response.data;
  },

  async getDashboard(range: '7d' | '30d' | 'all'): Promise<AdminDashboardResponseData> {
    const response = await apiClient.get<ApiSuccessResponse<AdminDashboardResponseData>>(
      '/admin/workspaces',
      { range },
    );
    return response.data;
  },

  async updateWorkspaceStatus(
    workspaceId: string,
    isActive: boolean,
    reason?: string,
  ): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    blockedReason?: string | null;
    blockedAt?: string | null;
    blockedByAdminUsername?: string | null;
    updatedAt: string;
  }> {
    const response = await apiClient.patch<
      ApiSuccessResponse<{
        id: string;
        name: string;
        isActive: boolean;
        blockedReason?: string | null;
        blockedAt?: string | null;
        blockedByAdminUsername?: string | null;
        updatedAt: string;
      }>
    >(`/admin/workspaces/${workspaceId}/status`, { isActive, reason });
    return response.data;
  },

  async deleteWorkspace(
    workspaceId: string,
    data: { workspaceName: string; password: string; reason?: string },
  ): Promise<AdminWorkspaceDeleteResponse> {
    const response = await apiClient.post<ApiSuccessResponse<AdminWorkspaceDeleteResponse>>(
      `/admin/workspaces/${workspaceId}/delete`,
      data,
    );
    return response.data;
  },
};
