// ===== useChat Hook =====
// จัดการ chat state

import { useState, useCallback } from 'react';
import { chatService } from '@/services';
import type { ChatRoom, Message, SendMessageRequest } from '@/types';

export function useChat(workspaceId?: string) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const data = await chatService.getRooms(workspaceId);
      setRooms(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const fetchMessages = useCallback(async (roomId: string, cursor?: string) => {
    setIsLoading(true);
    try {
      const data = await chatService.getMessages(roomId, cursor);
      if (cursor) {
        // append older messages
        setMessages((prev) => [...prev, ...data.messages]);
      } else {
        setMessages(data.messages);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (data: SendMessageRequest) => {
    const message = await chatService.sendMessage(data);
    setMessages((prev) => [message, ...prev]);
    return message;
  }, []);

  return {
    rooms,
    messages,
    isLoading,
    fetchRooms,
    fetchMessages,
    sendMessage,
  };
}
