export interface ChatRoom {
  id: string;
  name: string;
  description?: string | null;
  workspaceId: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export interface Message {
  id: string;
  content: string;
  type: string;
  roomId: string;
  senderId: string;
  sender: {
    id: string;
    Name: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  roomId: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
