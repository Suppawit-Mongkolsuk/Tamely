import { apiClient } from './api';
import type { ApiSuccessResponse } from '@/types';

// ===== Response Types =====

export interface DMUserInfo {
  id: string;
  Name: string;
  avatarUrl?: string | null;
}

export interface DMMessageResponse {
  id: string;
  conversationId?: string;  // เพิ่มโดย socket gateway เพื่อ client routing
  content: string;
  type: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  isRead?: boolean;
  createdAt: string;
  sender: DMUserInfo;
}

export interface DMConversationResponse {
  id: string;
  userA: DMUserInfo;
  userB: DMUserInfo;
  unreadCount: number;
  lastMessage: DMMessageResponse | null;
}

interface DMMessagesListResponse {
  success: boolean;
  data: DMMessageResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ===== Service =====

export const dmService = {
  /**
   * เปิด DM กับ user อีกคน (หรือ return conversation ที่มีอยู่แล้ว)
   */
  async openConversation(workspaceId: string, targetUserId: string): Promise<DMConversationResponse> {
    const res = await apiClient.post<ApiSuccessResponse<DMConversationResponse>>(
      `/workspaces/${workspaceId}/dm/open`,
      { targetUserId },
    );
    return res.data;
  },

  /**
   * ดึง list ของ DM conversations ทั้งหมดของ user ใน workspace
   */
  async getConversations(workspaceId: string): Promise<DMConversationResponse[]> {
    const res = await apiClient.get<ApiSuccessResponse<DMConversationResponse[]>>(
      `/workspaces/${workspaceId}/dm`,
    );
    return res.data;
  },

  /**
   * ดึงข้อความใน DM conversation
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; offset?: number; before?: string },
  ): Promise<{ data: DMMessageResponse[]; total: number }> {
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    if (options?.offset) params.offset = String(options.offset);
    if (options?.before) params.before = options.before;

    const res = await apiClient.get<DMMessagesListResponse>(
      `/dm/${conversationId}/messages`,
      params,
    );
    return { data: res.data, total: res.total };
  },

  /**
   * ส่งข้อความ DM ผ่าน REST (fallback เมื่อ socket ไม่ connected)
   */
  async sendMessage(conversationId: string, content: string): Promise<DMMessageResponse> {
    const res = await apiClient.post<ApiSuccessResponse<DMMessageResponse>>(
      `/dm/${conversationId}/messages`,
      { content },
    );
    return res.data;
  },

  /**
   * Mark messages ใน conversation ว่าอ่านแล้ว
   */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.patch(`/dm/${conversationId}/read`);
  },

  /**
   * ลบข้อความ DM
   */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/dm/messages/${messageId}`);
  },

  /**
   * ลบข้อความทั้งหมดใน DM conversation (clear chat)
   */
  async clearMessages(conversationId: string): Promise<void> {
    await apiClient.delete(`/dm/${conversationId}/messages`);
  },

  /**
   * อัปโหลดไฟล์/รูปภาพ ในแชท DM (multipart/form-data)
   * รองรับทั้ง Web (File object) — Mobile จะใช้ endpoint เดียวกันด้วย FormData
   */
  async sendFileMessage(
    conversationId: string,
    file: File,
    content?: string,
  ): Promise<DMMessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (content) formData.append('content', content);

    const res = await apiClient.upload<ApiSuccessResponse<DMMessageResponse>>(
      `/dm/${conversationId}/upload`,
      formData,
    );
    return res.data;
  },
};
