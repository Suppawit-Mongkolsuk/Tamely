import { useCallback } from 'react';
import { toast } from 'sonner';
import { chatService } from '@/services/chat.service';
import { dmService } from '@/services/dm.service';
import { connectSocket } from '@/lib/socket';
import { toggleConversationMute } from '@/lib/notification-prefs';
import type { MessageResponse, RoomResponse } from '@/services/chat.service';
import type { DMConversationResponse, DMMessageResponse } from '@/services/dm.service';
import type { ChatRoom, DirectMessage, Member, Message } from '@/types/chat-ui';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

interface UseChatActionsParams {
  wsId: string | undefined;
  myId: string;
  activeTab: 'rooms' | 'dms';
  selectedRoom: string;
  selectedDM: string;
  canCreateRoom: boolean;
  socketRef: MutableRefObject<ReturnType<typeof connectSocket> | null>;
  mapRoom: (room: RoomResponse) => ChatRoom;
  mapDMConversation: (conversation: DMConversationResponse, myId: string) => DirectMessage;
  mapChatMessage: (message: DMMessageResponse | MessageResponse, myId: string) => Message;
  updateRoomPreview: (
    list: ChatRoom[],
    roomId: string,
    message: Pick<MessageResponse, 'content' | 'createdAt' | 'sender'>,
    myId: string,
    openedRoomId?: string,
  ) => ChatRoom[];
  setRooms: Dispatch<SetStateAction<ChatRoom[]>>;
  setDirectMessages: Dispatch<SetStateAction<DirectMessage[]>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setMutedIds: Dispatch<SetStateAction<Set<string>>>;
  setMembers: Dispatch<SetStateAction<Member[]>>;
  resetMessages: () => void;
  setSelectedRoom: Dispatch<SetStateAction<string>>;
  handleTabChange: (tab: 'rooms' | 'dms') => void;
  handleSelectDM: (id: string) => void;
  handleSelectRoom: (id: string) => void;
  closeCreateRoomDialog: () => void;
  closeRemoveMemberDialog: () => void;
  closeLeaveRoomDialog: () => void;
  memberToRemove: Member | null;
}

export function useChatActions({
  wsId,
  myId,
  activeTab,
  selectedRoom,
  selectedDM,
  canCreateRoom,
  socketRef,
  mapRoom,
  mapDMConversation,
  mapChatMessage,
  updateRoomPreview,
  setRooms,
  setDirectMessages,
  setMessages,
  setMutedIds,
  setMembers,
  resetMessages,
  setSelectedRoom,
  handleTabChange,
  handleSelectDM,
  handleSelectRoom,
  closeCreateRoomDialog,
  closeRemoveMemberDialog,
  closeLeaveRoomDialog,
  memberToRemove,
}: UseChatActionsParams) {
  const handleSendMessage = useCallback( // ฟังก์ชันนี้จะถูกเรียกเมื่อส่งข้อความใหม่ในห้องแชทหรือ DM conversation ที่เลือกอยู่ โดยจะเช็คก่อนว่ามีการเชื่อมต่อ WebSocket อยู่หรือไม่ ถ้ามีจะส่งข้อความผ่าน WebSocket เพื่อให้ผู้ใช้คนอื่นที่อยู่ในห้องแชทหรือ DM conversation เดียวกันได้รับข้อความแบบ real-time แต่ถ้าไม่มีการเชื่อมต่อ WebSocket จะส่งข้อความผ่าน API ปกติ และอัปเดตข้อความในหน้าให้ทันที
    (messageInput: string, clearInput: () => void) => {
      if (!messageInput.trim()) return;
      const socket = socketRef.current;

      if (activeTab === 'dms' && selectedDM) { // ถ้าอยู่ใน tab ของ DM และมี DM conversation ที่ถูกเลือกอยู่
        if (socket?.connected) {
          socket.emit('send_dm', { conversationId: selectedDM, content: messageInput }); // ส่งข้อความผ่าน WebSocket โดยระบุ conversationId ของ DM conversation ที่จะส่งข้อความไป และเนื้อหาของข้อความ
        } else {
          void dmService.sendMessage(selectedDM, messageInput).then((msg) => {// เมื่อส่งข้อความผ่าน API แล้ว ให้รีเฟรช preview ของ DM conversation ที่ถูกส่งข้อความไป และเพิ่มข้อความใหม่เข้าไปใน list ของข้อความที่แสดงในหน้า
            setMessages((prev) => [...prev, mapChatMessage(msg, myId)]);
          });
        }
      } else if (selectedRoom) {
        if (socket?.connected) {
          socket.emit('send_message', { roomId: selectedRoom, content: messageInput });
        } else {
          void chatService.sendMessage(selectedRoom, messageInput).then((msg) => {
            setRooms((prev) => updateRoomPreview(prev, selectedRoom, msg, myId, selectedRoom));
            setMessages((prev) => [...prev, mapChatMessage(msg, myId)]);
          });
        }
      }

      clearInput();
    },
    [
      activeTab,
      mapChatMessage,
      myId,
      selectedDM,
      selectedRoom,
      setMessages,
      setRooms,
      socketRef,
      updateRoomPreview,
    ],
  );

  const handleOpenNewDM = useCallback(async (targetUserId: string) => {
    if (!wsId) return;
    try {
      const conv = await dmService.openConversation(wsId, targetUserId);
      const dm = mapDMConversation(conv, myId);
      setDirectMessages((prev) => {
        const exists = prev.find((item) => item.id === conv.id);
        return exists ? prev : [dm, ...prev];
      });
      handleTabChange('dms');
      handleSelectDM(conv.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เปิด DM ไม่สำเร็จ');
    }
  }, [wsId, mapDMConversation, myId, setDirectMessages, handleTabChange, handleSelectDM]);

  const handleCreateRoom = useCallback(async (name: string, allowedRoles: string[]) => {
    if (!wsId) return;
    if (!canCreateRoom) {
      toast.error('เฉพาะ Admin และ Owner เท่านั้นที่สร้างห้องได้');
      closeCreateRoomDialog();
      return;
    }
    const room = await chatService.createRoom(wsId, { name, allowedRoles });
    setRooms((prev) => [...prev, mapRoom(room)]);
    closeCreateRoomDialog();
    handleSelectRoom(room.id);
  }, [wsId, canCreateRoom, closeCreateRoomDialog, setRooms, mapRoom, handleSelectRoom]);

  const handleRemoveMember = useCallback(async () => {
    if (!selectedRoom || !memberToRemove) return;
    try {
      await chatService.leaveRoom(selectedRoom, memberToRemove.id);
      setMembers((prev) => prev.filter((member) => member.id !== memberToRemove.id));
      closeRemoveMemberDialog();
      toast.success(`นำ ${memberToRemove.name} ออกจากห้องแล้ว`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'นำสมาชิกออกไม่สำเร็จ');
    }
  }, [selectedRoom, memberToRemove, setMembers, closeRemoveMemberDialog]);

  const handleLeaveRoom = useCallback(async () => {
    if (!selectedRoom || !myId) return;
    const roomIdToLeave = selectedRoom;
    try {
      await chatService.leaveRoom(roomIdToLeave, myId);
    } catch {
      // ignore
    }
    setRooms((prev) => prev.filter((room) => room.id !== roomIdToLeave));
    setSelectedRoom('');
    resetMessages();
    closeLeaveRoomDialog();
    toast.success('ออกจากห้องแล้ว');
  }, [selectedRoom, myId, setRooms, setSelectedRoom, resetMessages, closeLeaveRoomDialog]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      if (activeTab === 'dms' && selectedDM) {
        await dmService.deleteMessage(messageId);
      } else if (activeTab === 'rooms' && selectedRoom) {
        await chatService.deleteMessage(messageId);
      }
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      toast.success('ลบข้อความแล้ว');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบข้อความไม่สำเร็จ');
    }
  }, [activeTab, selectedDM, selectedRoom, setMessages]);

  const handleToggleMute = useCallback(() => {
    const conversationId = selectedDM || selectedRoom;
    if (!conversationId) return;
    toggleConversationMute(myId, conversationId);
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conversationId)) next.delete(conversationId);
      else next.add(conversationId);
      return next;
    });
  }, [selectedDM, selectedRoom, myId, setMutedIds]);

  const handleClearChat = useCallback(async () => {
    if (!selectedDM) return;
    await dmService.clearMessages(selectedDM);
    setMessages([]);
    toast.success('ลบแชททั้งหมดแล้ว');
  }, [selectedDM, setMessages]);

  const handleSendFile = useCallback(async (file: File) => {
    try {
      const socket = socketRef.current;
      if (activeTab === 'dms' && selectedDM) {
        const msg = await dmService.sendFileMessage(selectedDM, file);
        if (!socket?.connected) {
          setMessages((prev) => [...prev, mapChatMessage(msg, myId)]);
        }
      } else if (activeTab === 'rooms' && selectedRoom) {
        const msg = await chatService.sendRoomFile(selectedRoom, file);
        if (!socket?.connected) {
          setMessages((prev) => [...prev, mapChatMessage(msg, myId)]);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งไฟล์ไม่สำเร็จ');
    }
  }, [activeTab, selectedDM, selectedRoom, socketRef, setMessages, mapChatMessage, myId]);

  return {
    handleSendMessage,
    handleOpenNewDM,
    handleCreateRoom,
    handleRemoveMember,
    handleLeaveRoom,
    handleDeleteMessage,
    handleToggleMute,
    handleClearChat,
    handleSendFile,
  };
}
