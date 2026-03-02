// ===== Chat Service =====
// จัดการ ChatRoom, Messages

import { apiClient } from './api';
import type { ChatRoom, Message, SendMessageRequest } from '@/types';

export const chatService = {
  async getRooms(workspaceId: string): Promise<ChatRoom[]> {
    return apiClient.get(`/workspaces/${workspaceId}/rooms`);
  },

  async getMessages(roomId: string, cursor?: string): Promise<{ messages: Message[]; nextCursor?: string }> {
    const params = cursor ? { cursor } : undefined;
    return apiClient.get(`/rooms/${roomId}/messages`, params);
  },

  async sendMessage(data: SendMessageRequest): Promise<Message> {
    return apiClient.post(`/rooms/${data.chatRoomId}/messages`, data);
  },

  async deleteMessage(roomId: string, messageId: string): Promise<void> {
    return apiClient.delete(`/rooms/${roomId}/messages/${messageId}`);
  },
};
