import { useCallback, useEffect, useRef } from 'react';
import { connectSocket } from '@/lib/socket';
import { chatService } from '@/services/chat.service';
import { dmService } from '@/services/dm.service';
import type { MessageResponse } from '@/services/chat.service';
import type { DMMessageResponse } from '@/services/dm.service';
import type { ChatRoom, DirectMessage, Message } from '@/types/chat-ui';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

type ChatMessageResponse = MessageResponse | DMMessageResponse;

interface UseChatSocketsParams {
  selectedRoom: string;
  selectedDM: string;
  myId: string;
  fetchRoomMessages: (roomId: string, offset?: number) => Promise<void>;
  fetchRoomDetail: (roomId: string) => Promise<void>;
  fetchDMMessages: (conversationId: string, offset?: number) => Promise<void>;
  setRooms: Dispatch<SetStateAction<ChatRoom[]>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setDirectMessages: Dispatch<SetStateAction<DirectMessage[]>>;
  mapChatMessage: (message: ChatMessageResponse, myId: string) => Message;
  updateRoomPreview: (
    list: ChatRoom[],
    roomId: string,
    message: Pick<MessageResponse, 'content' | 'createdAt' | 'sender'>,
    myId: string,
    openedRoomId?: string,
  ) => ChatRoom[];
  updateDMPreview: (
    list: DirectMessage[],
    message: DMMessageResponse,
    myId: string,
    openedConversationId?: string,
  ) => DirectMessage[];
}

export function useChatSockets({
  selectedRoom,
  selectedDM,
  myId,
  fetchRoomMessages,
  fetchRoomDetail,
  fetchDMMessages,
  setRooms,
  setMessages,
  setDirectMessages,
  mapChatMessage,
  updateRoomPreview,
  updateDMPreview,
}: UseChatSocketsParams): { socketRef: MutableRefObject<ReturnType<typeof connectSocket> | null> } {
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
  const roomReadSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleMarkRoomAsRead = useCallback((roomId: string) => {
    if (roomReadSyncTimeoutRef.current) {
      clearTimeout(roomReadSyncTimeoutRef.current);
    }

    roomReadSyncTimeoutRef.current = setTimeout(() => {
      chatService.markRoomAsRead(roomId).catch((err) => {
        console.warn('[ChatRooms] Failed to mark room as read:', err);
      });
    }, 300);
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    void fetchRoomMessages(selectedRoom);
    void fetchRoomDetail(selectedRoom);

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join_room', selectedRoom);

    const handleMessageReceived = (msg: MessageResponse) => {
      if (!msg.roomId) return;

      setRooms((prev) => updateRoomPreview(prev, msg.roomId!, msg, myId, selectedRoom));

      if (msg.roomId !== selectedRoom) return;
      setMessages((prev) => [...prev, mapChatMessage(msg, myId)]);
      if (msg.sender.id !== myId) {
        scheduleMarkRoomAsRead(selectedRoom);
      }
    };

    const handleReconnect = () => {
      socket.emit('join_room', selectedRoom);
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('connect', handleReconnect);
    };
  }, [
    selectedRoom,
    fetchRoomMessages,
    fetchRoomDetail,
    setMessages,
    setRooms,
    updateRoomPreview,
    myId,
    mapChatMessage,
    scheduleMarkRoomAsRead,
  ]);

  useEffect(() => {
    return () => {
      if (roomReadSyncTimeoutRef.current) {
        clearTimeout(roomReadSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedDM) return;
    void fetchDMMessages(selectedDM);

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join_dm', selectedDM);

    const handleDMReceived = (msg: DMMessageResponse) => {
      setDirectMessages((prev) => updateDMPreview(prev, msg, myId, selectedDM));

      if (msg.conversationId !== selectedDM) {
        return;
      }

      setMessages((prev) => [...prev, mapChatMessage(msg, myId)]);
      if (msg.sender.id !== myId) {
        dmService.markAsRead(selectedDM).catch((err) => {
          console.warn('[ChatRooms] Failed to mark DM as read:', err);
        });
      }
    };

    const handleDMRead = ({ conversationId }: { conversationId: string; readByUserId: string }) => {
      if (conversationId !== selectedDM) return;
      setMessages((prev) => prev.map((message) => (message.isOwn ? { ...message, isRead: true } : message)));
    };

    const handleReconnect = () => {
      socket.emit('join_dm', selectedDM);
    };

    socket.on('dm_received', handleDMReceived);
    socket.on('dm_read', handleDMRead);
    socket.on('connect', handleReconnect);

    return () => {
      socket.emit('leave_dm', selectedDM);
      socket.off('dm_received', handleDMReceived);
      socket.off('dm_read', handleDMRead);
      socket.off('connect', handleReconnect);
    };
  }, [
    selectedDM,
    fetchDMMessages,
    setDirectMessages,
    updateDMPreview,
    myId,
    setMessages,
    mapChatMessage,
  ]);

  return { socketRef };
}
