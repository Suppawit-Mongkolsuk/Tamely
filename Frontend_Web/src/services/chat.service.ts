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
    user: { id: string; Name: string; email: string; avatarUrl?: string | null };
  }[];
}

export interface MessageResponse {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; Name: string; avatarUrl?: string | null };
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
    data: { name: string; description?: string; isPrivate?: boolean },
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

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await apiClient.delete(`/rooms/${roomId}/members/${userId}`);
  },
};
