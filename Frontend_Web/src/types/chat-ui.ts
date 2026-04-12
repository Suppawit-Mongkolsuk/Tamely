// ===== Chat Rooms — Shared Types =====

export interface ChatRoom {
  id: string;
  name: string;
  workspace: string;
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
}

export interface DirectMessage {
  id: string;             // conversationId
  userId: string;         // ID ของอีกฝ่าย
  userName: string;       // ชื่อของอีกฝ่าย
  avatar: string;         // initials avatar
  avatarUrl?: string | null;
  status: 'online' | 'away' | 'offline';
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  timestamp: string;   // เวลา เช่น "22:54"
  date: string;        // ISO date string สำหรับคำนวณ date separator เช่น "2025-04-07"
  isOwn: boolean;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  isRead?: boolean;    // read receipt (DM เท่านั้น)
}

export interface Member {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  status: 'online' | 'away' | 'offline';
  avatar: string;
}

export type ChatTab = 'rooms' | 'dms';
