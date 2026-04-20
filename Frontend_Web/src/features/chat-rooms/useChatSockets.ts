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
}: UseChatSocketsParams): { socketRef: MutableRefObject<ReturnType<typeof connectSocket> | null> } { // คืนค่า socketRef เพื่อให้ component ที่ใช้ hook 
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null); // เก็บ reference ของ WebSocket connection เพื่อใช้ในการส่งคำสั่งต่างๆ เช่น join room, leave room เป็นต้น และเพื่อป้องกันการสร้าง connection ใหม่ซ้ำๆ เมื่อ component re-render
  const roomReadSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);// ใช้สำหรับ การเรียก API mark room as read เมื่อมีข้อความใหม่เข้ามา เพื่อป้องกันการเรียก API ซ้ำๆ ในกรณีที่มีข้อความเข้ามาหลายๆ ข้อความในเวลาใกล้เคียงกัน

  const scheduleMarkRoomAsRead = useCallback((roomId: string) => { // หน่วงเวลา 300ms ก่อน mark ห้องว่าอ่านแล้ว
    if (roomReadSyncTimeoutRef.current) {// ถ้ามี timeout ที่กำลังรออยู่ ให้เคลียร์ออกก่อน เพื่อหน่วงเวลาใหม่
      clearTimeout(roomReadSyncTimeoutRef.current);
    }

    roomReadSyncTimeoutRef.current = setTimeout(() => {
      chatService.markRoomAsRead(roomId).catch((err) => {
        console.warn('[ChatRooms] Failed to mark room as read:', err);
      });
    }, 300);
  }, []);

  useEffect(() => { // เชื่อมต่อ WebSocket และตั้ง listener สำหรับข้อความใหม่เมื่อมีการเลือกห้องแชท
    if (!selectedRoom) return; // ถ้าไม่มีห้องแชทที่ถูกเลือก ให้ข้ามการตั้งค่า WebSocket ไปเลย
    void fetchRoomMessages(selectedRoom);// โหลดข้อความในห้องแชทที่ถูกเลือกมาแสดงใน chat panel
    void fetchRoomDetail(selectedRoom);// โหลดรายละเอียดของห้องแชทที่ถูกเลือกมาแสดงใน chat panel

    const socket = connectSocket(); // สร้าง WebSocket connection ใหม่
    socketRef.current = socket; // เก็บไว้ใน ref
    socket.emit('join_room', selectedRoom);// แจ้ง server ว่าเข้าร่วมห้องแชทนี้ เพื่อที่จะได้รับข้อความใหม่ที่ส่งเข้ามาในห้องนี้แบบ real-time

    const handleMessageReceived = (msg: MessageResponse) => { // ตอนมีข้อความาใหม่ 
      if (!msg.roomId) return; // ข้อความที่เข้ามาต้องมี roomId ถึงจะประมวลผลต่อได้

      setRooms((prev) => updateRoomPreview(prev, msg.roomId!, msg, myId, selectedRoom)); //อัปเดต preview ของห้องใน sidebar

      if (msg.roomId !== selectedRoom) return; // ถ้าข้อความที่เข้ามาไม่ใช่ของห้องที่เปิดอยู่ ให้ข้ามการอัปเดตข้อความใน chat panel ไปเลย
      setMessages((prev) => [...prev, mapChatMessage(msg, myId)]);
      if (msg.sender.id !== myId) { // ถ้าข้อความที่เข้ามาไม่ได้ส่งโดยตัวเอง ให้เรียก API mark room as read เพื่ออัปเดตสถานะการอ่านของห้องนี้ (เช่น ให้รู้ว่ามีข้อความใหม่เข้ามาแล้ว)
        scheduleMarkRoomAsRead(selectedRoom);
      }
    };

    const handleReconnect = () => { // ตอนที่ WebSocket reconnect ใหม่ ให้ join room นี้อีกครั้งเพื่อที่จะได้รับข้อความใหม่ต่อไป
      socket.emit('join_room', selectedRoom);
    };

    socket.on('message_received', handleMessageReceived);//    ถ้ามี event message_received → ให้รัน handleMessageReceived
    socket.on('connect', handleReconnect); // ถ้า WebSocket reconnect ใหม่ → ให้รัน handleReconnect เพื่อ join room นี้อีกครั้ง

    return () => { // ล้างเมื่อ component ถูก unmount หรือมีการเปลี่ยนห้องแชทที่ถูกเลือก
      socket.off('message_received', handleMessageReceived); // เคลียร์ listener ออกเมื่อ component ถูก unmount หรือมีการเปลี่ยนห้องแชทที่ถูกเลือก เพื่อป้องกันการรับข้อความซ้ำๆ จากหลายๆ ห้องที่เปิดอยู่พร้อมกัน
      socket.off('connect', handleReconnect); // เคลียร์ listener ออกเมื่อ component ถูก unmount หรือมีการเปลี่ยนห้องแชทที่ถูกเลือก เพื่อป้องกันการรับข้อความซ้ำๆ จากหลายๆ ห้องที่เปิดอยู่พร้อมกัน
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

  useEffect(() => {// clear timeout ตอน unmount
    return () => {
      if (roomReadSyncTimeoutRef.current) {
        clearTimeout(roomReadSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => { // ส่วน dm เเชท 
    if (!selectedDM) return;
    void fetchDMMessages(selectedDM); // โหลดข้อความใน DM conversation ที่ถูกเลือกมาแสดงใน chat panel

    const socket = connectSocket();// เชื่อมต่อ WebSocket สำหรับ DM conversation
    socketRef.current = socket;
    socket.emit('join_dm', selectedDM);//oin ห้อง DM

    const handleDMReceived = (msg: DMMessageResponse) => { // มี Dm ใหม่เข้ามา
      setDirectMessages((prev) => updateDMPreview(prev, msg, myId, selectedDM)); // อัปเดต preview ของ DM ใน sidebar

      if (msg.conversationId !== selectedDM) { //ถ้าข้อความนี้ไม่ได้อยู่ใน DM ที่กำลังเปิดอยู่ ก็หยุด
        return;
      }

      setMessages((prev) => [...prev, mapChatMessage(msg, myId)]); //ถ้าเป็น DM ที่กำลังเปิดอยู่ → เพิ่มข้อความลงหน้า
      if (msg.sender.id !== myId) { // ถ้าข้อความที่เข้ามาไม่ได้ส่งโดยตัวเอง ให้เรียก API mark DM as read เพื่ออัปเดตสถานะการอ่านของ DM นี้ (เช่น ให้รู้ว่ามีข้อความใหม่เข้ามาแล้ว)
        dmService.markAsRead(selectedDM).catch((err) => { 
          console.warn('[ChatRooms] Failed to mark DM as read:', err);
        });
      }
    };

    const handleDMRead = ({ conversationId }: { conversationId: string; readByUserId: string }) => { // ข้อความใน DM ถูกอ่าน
      if (conversationId !== selectedDM) return;
      setMessages((prev) => prev.map((message) => (message.isOwn ? { ...message, isRead: true } : message))); // อัปเดตสถานะการอ่านของข้อความใน DM ที่เปิดอยู่ (เช่น ให้เห็นเครื่องหมายถูกว่าอ่านแล้ว)
    };

    const handleReconnect = () => { // ตอนที่ WebSocket reconnect ใหม่ ให้ join DM conversation นี้อีกครั้งเพื่อที่จะได้รับข้อความใหม่ต่อไป
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
