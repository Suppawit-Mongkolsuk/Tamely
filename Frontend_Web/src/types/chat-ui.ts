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
  id: string;
  userId: string;
  userName: string;
  avatar: string;
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
  timestamp: string;
  isOwn: boolean;
}

export interface Member {
  id: string;
  name: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'online' | 'away' | 'offline';
  avatar: string;
}

export type ChatTab = 'rooms' | 'dms';
