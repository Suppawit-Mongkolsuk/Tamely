import { useState, useCallback } from 'react';
import { chatService } from '@/services/chat.service';
import type { RoomResponse, MessageResponse } from '@/services/chat.service';

export function useChat(workspaceId?: string) {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
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

  const fetchMessages = useCallback(async (roomId: string, offset?: number) => {
    setIsLoading(true);
    try {
      const data = await chatService.getMessages(roomId, {
        limit: 50,
        offset,
      });
      if (offset) {
        setMessages((prev) => [...data.data, ...prev]);
      } else {
        setMessages(data.data);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (roomId: string, content: string) => {
    const message = await chatService.sendMessage(roomId, content);
    setMessages((prev) => [...prev, message]);
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
