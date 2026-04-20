import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { chatService } from '@/services/chat.service';
import { dmService } from '@/services/dm.service';
import { CHAT_MESSAGE_PAGE_SIZE } from '@/lib/constants';
import type { MessageResponse } from '@/services/chat.service';
import type { DMMessageResponse } from '@/services/dm.service';
import type { ChatTab, DirectMessage, Message } from '@/types/chat-ui';
import type { Dispatch, SetStateAction } from 'react';

type ChatMessageResponse = MessageResponse | DMMessageResponse;

interface UseChatMessagesParams {
  myId: string;
  setDirectMessages: Dispatch<SetStateAction<DirectMessage[]>>;
  mapChatMessage: (message: ChatMessageResponse, myId: string) => Message;
}

export function useChatMessages({ // Hook นี้จะถูกใช้ใน ChatRoomDetail เพื่อจัดการ state ของข้อความในห้องแชทหรือ DM conversation ที่เปิดอยู่ รวมถึงฟังก์ชันสำหรับดึงข้อความจาก API, รีเซ็ตข้อความเมื่อเปลี่ยนห้องแชทหรือ DM, และโหลดข้อความเก่าเมื่อเลื่อนขึ้นไปด้านบนของหน้าข้อความ
  myId,
  setDirectMessages,
  mapChatMessage,
}: UseChatMessagesParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);

  const fetchRoomMessages = useCallback(
    async (roomId: string, offset = 0) => {
      if (offset === 0) setIsLoadingMessages(true);
      try {
        const res = await chatService.getMessages(roomId, {
          limit: CHAT_MESSAGE_PAGE_SIZE,
          offset,
        });
        const mapped = res.data.map((message) => mapChatMessage(message, myId));
        if (offset === 0) {
          setMessages(mapped);
        } else {
          setMessages((prev) => [...mapped, ...prev]);
        }
        setHasMore(res.total > offset + res.data.length);
        setMessageOffset(offset + res.data.length);
      } catch {
        toast.error('โหลดข้อความไม่สำเร็จ');
      } finally {
        if (offset === 0) setIsLoadingMessages(false);
      }
    },
    [mapChatMessage, myId],
  );

  const fetchDMMessages = useCallback( // ฟังก์ชันนี้จะถูกเรียกเมื่อมีการเปิด DM conversation เพื่อดึงข้อความใน DM นี้มาแสดง
    async (conversationId: string, offset = 0) => {
      if (offset === 0) setIsLoadingMessages(true); 
      try {
        const res = await dmService.getMessages(conversationId, {
          limit: CHAT_MESSAGE_PAGE_SIZE,
          offset,
        });
        const mapped = res.data.map((message) => mapChatMessage(message, myId));
        if (offset === 0) {
          setMessages(mapped);
          setDirectMessages((prev) =>
            prev.map((dm) => (dm.id === conversationId ? { ...dm, unread: 0 } : dm)),
          );
        } else {
          setMessages((prev) => [...mapped, ...prev]);
        }
        setHasMore(res.total > offset + res.data.length);
        setMessageOffset(offset + res.data.length);
      } catch {
        toast.error('โหลดข้อความ DM ไม่สำเร็จ');
      } finally {
        if (offset === 0) setIsLoadingMessages(false);
      }
    },
    [mapChatMessage, myId, setDirectMessages],
  );

  const resetMessages = useCallback(() => { // ฟังก์ชันนี้จะถูกเรียกเมื่อเปลี่ยนห้องแชทหรือ DM conversation เพื่อเคลียร์ข้อความเก่าออกจากหน้าและรีเซ็ตสถานะการโหลด
    setMessages([]);
    setHasMore(false);
    setMessageOffset(0);
  }, []);

  const loadMoreMessages = useCallback( // ฟังก์ชันนี้จะถูกเรียกเมื่อเลื่อนขึ้นไปด้านบนของหน้าข้อความเพื่อโหลดข้อความเก่าเพิ่มเติม
    async (activeTab: ChatTab, selectedRoom: string, selectedDM: string) => {
      if (activeTab === 'rooms' && selectedRoom) {
        await fetchRoomMessages(selectedRoom, messageOffset);// ถ้าอยู่ในห้องแชทปกติและมีห้องแชทที่ถูกเลือก → ดึงข้อความเก่าในห้องแชทนี้มาเพิ่ม
      } else if (activeTab === 'dms' && selectedDM) {
        await fetchDMMessages(selectedDM, messageOffset);// ถ้าอยู่ใน DM conversation และมี DM ที่ถูกเลือก → ดึงข้อความเก่าใน DM นี้มาเพิ่ม
      }
    },
    [fetchDMMessages, fetchRoomMessages, messageOffset],
  );

  return {
    messages,
    setMessages,
    isLoadingMessages,
    hasMore,
    messageOffset,
    fetchRoomMessages,
    fetchDMMessages,
    resetMessages,
    loadMoreMessages,
  };
}
