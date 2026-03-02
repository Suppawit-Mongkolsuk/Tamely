// ===== Workspace Service =====
// จัดการ CRUD Workspace, สมาชิก, คำเชิญ

import { apiClient } from './api';
import type {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceRequest,
  JoinWorkspaceRequest,
  InviteMemberRequest,
} from '@/types';

export const workspaceService = {
  async getAll(): Promise<Workspace[]> {
    return apiClient.get('/workspaces');
  },

  async getById(id: string): Promise<Workspace> {
    return apiClient.get(`/workspaces/${id}`);
  },

  async create(data: CreateWorkspaceRequest): Promise<Workspace> {
    return apiClient.post('/workspaces', data);
  },

  async join(data: JoinWorkspaceRequest): Promise<Workspace> {
    return apiClient.post('/workspaces/join', data);
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return apiClient.get(`/workspaces/${workspaceId}/members`);
  },

  async inviteMember(workspaceId: string, data: InviteMemberRequest): Promise<void> {
    return apiClient.post(`/workspaces/${workspaceId}/invite`, data);
  },

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    return apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },
};
