// ===== Chat Types =====

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: ChatRoomType;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
  memberCount: number;
}

export type ChatRoomType = 'text' | 'voice' | 'announcement';

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  chatRoomId: string;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  attachments?: Attachment[];
  replyTo?: Message;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface SendMessageRequest {
  content: string;
  chatRoomId: string;
  type?: MessageType;
  replyToId?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
