import { apiClient } from './api';
import type { ApiSuccessResponse } from '@/types';

export interface RoomResponse {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  isPrivate: boolean;
  createdById: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; Name: string; avatarUrl?: string | null };
  members?: {
    user: { id: string; Name: string; avatarUrl?: string | null; workspaceRole?: string };
  }[];
}

export interface MessageResponse {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; Name: string; avatarUrl?: string | null };
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

interface MessagesListResponse {
  success: boolean;
  data: MessageResponse[];
  total: number;
  limit: number;
  offset: number;
}

export const chatService = {
  async getRooms(workspaceId: string): Promise<RoomResponse[]> {
    const res = await apiClient.get<ApiSuccessResponse<RoomResponse[]>>(
      `/workspaces/${workspaceId}/rooms`,
    );
    return res.data;
  },

  async getRoomById(roomId: string): Promise<RoomResponse> {
    const res = await apiClient.get<ApiSuccessResponse<RoomResponse>>(
      `/rooms/${roomId}`,
    );
    return res.data;
  },

  async getMessages(
    roomId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ data: MessageResponse[]; total: number }> {
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    if (options?.offset) params.offset = String(options.offset);
    const res = await apiClient.get<MessagesListResponse>(
      `/rooms/${roomId}/messages`,
      params,
    );
    return { data: res.data, total: res.total };
  },

  async sendMessage(
    roomId: string,
    content: string,
  ): Promise<MessageResponse> {
    const res = await apiClient.post<ApiSuccessResponse<MessageResponse>>(
      `/rooms/${roomId}/messages`,
      { content },
    );
    return res.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`);
  },

  async createRoom(
    workspaceId: string,
    data: {
      name: string;
      description?: string;
      isPrivate?: boolean;
      allowedRoles?: string[]; // [] = ALL, ['ADMIN','MODERATOR'] = specific roles
    },
  ): Promise<RoomResponse> {
    const res = await apiClient.post<ApiSuccessResponse<RoomResponse>>(
      `/workspaces/${workspaceId}/rooms`,
      data,
    );
    return res.data;
  },

  async joinRoom(roomId: string): Promise<void> {
    await apiClient.post(`/rooms/${roomId}/join`);
  },

  async addRoomMember(roomId: string, userId: string): Promise<void> {
    await apiClient.post(`/rooms/${roomId}/members`, { userId });
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await apiClient.delete(`/rooms/${roomId}/members/${userId}`);
  },

  async sendRoomFile(roomId: string, file: File): Promise<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.upload<ApiSuccessResponse<MessageResponse>>(
      `/rooms/${roomId}/upload`,
      formData,
    );
    return res.data;
  },
};
