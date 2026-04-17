import { apiClient } from './api';
import type {
  Workspace,
  WorkspaceMember,
  CustomRole,
  CreateWorkspaceRequest,
  JoinWorkspaceRequest,
  InviteMemberRequest,
  ApiSuccessResponse,
} from '@/types';

export const workspaceService = {
  async getAll(): Promise<Workspace[]> {
    const res = await apiClient.get<ApiSuccessResponse<Workspace[]>>('/workspaces');
    return res.data;
  },

  async getById(id: string): Promise<Workspace> {
    const res = await apiClient.get<ApiSuccessResponse<Workspace>>(`/workspaces/${id}`);
    return res.data;
  },

  async create(data: CreateWorkspaceRequest): Promise<Workspace> {
    const res = await apiClient.post<ApiSuccessResponse<Workspace>>('/workspaces', data);
    return res.data;
  },

  async join(data: JoinWorkspaceRequest): Promise<Workspace> {
    const res = await apiClient.post<ApiSuccessResponse<Workspace>>('/workspaces/join', data);
    return res.data;
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await apiClient.get<ApiSuccessResponse<WorkspaceMember[]>>(
      `/workspaces/${workspaceId}/members`,
    );
    return res.data;
  },

  async inviteMember(workspaceId: string, data: InviteMemberRequest): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/members`, data);
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    await apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
  },

  async updateWorkspace(
    workspaceId: string,
    data: Partial<CreateWorkspaceRequest>,
  ): Promise<Workspace> {
    const res = await apiClient.patch<ApiSuccessResponse<Workspace>>(
      `/workspaces/${workspaceId}`,
      data,
    );
    return res.data;
  },

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    await workspaceService.removeMember(workspaceId, userId);
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}`);
  },

  async regenerateInviteCode(
    workspaceId: string,
  ): Promise<{ id: string; inviteCode: string }> {
    const res = await apiClient.post<
      ApiSuccessResponse<{ id: string; inviteCode: string }>
    >(`/workspaces/${workspaceId}/regenerate-invite`);
    return res.data;
  },

  async getCustomRoles(workspaceId: string): Promise<CustomRole[]> {
    const res = await apiClient.get<ApiSuccessResponse<CustomRole[]>>(
      `/workspaces/${workspaceId}/roles`,
    );
    return res.data;
  },

  async createCustomRole(
    workspaceId: string,
    data: { name: string; color?: string; permissions: string[] },
  ): Promise<CustomRole> {
    const res = await apiClient.post<ApiSuccessResponse<CustomRole>>(
      `/workspaces/${workspaceId}/roles`,
      data,
    );
    return res.data;
  },

  async updateCustomRole(
    workspaceId: string,
    roleId: string,
    data: { name?: string; color?: string; permissions?: string[] },
  ): Promise<CustomRole> {
    const res = await apiClient.patch<ApiSuccessResponse<CustomRole>>(
      `/workspaces/${workspaceId}/roles/${roleId}`,
      data,
    );
    return res.data;
  },

  async deleteCustomRole(workspaceId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/roles/${roleId}`);
  },

  async assignCustomRole(workspaceId: string, userId: string, roleId: string): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/members/${userId}/roles`, { roleId });
  },

  async revokeCustomRole(workspaceId: string, userId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}/roles/${roleId}`);
  },

  async getMemberCustomRoles(workspaceId: string, userId: string): Promise<CustomRole[]> {
    const res = await apiClient.get<ApiSuccessResponse<CustomRole[]>>(
      `/workspaces/${workspaceId}/members/${userId}/roles`,
    );
    return res.data;
  },

  async uploadWorkspaceIcon(workspaceId: string, file: File): Promise<{ iconUrl: string }> {
    const formData = new FormData();
    formData.append('icon', file);
    const res = await apiClient.upload<ApiSuccessResponse<{ iconUrl: string }>>(
      `/workspaces/${workspaceId}/icon`,
      formData,
    );
    return res.data;
  },
};
