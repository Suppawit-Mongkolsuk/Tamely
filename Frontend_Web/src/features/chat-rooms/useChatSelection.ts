import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ChatRoom, ChatTab, DirectMessage } from '@/types/chat-ui';

export type MobileView = 'list' | 'chat' | 'detail';

interface UseChatSelectionParams {
  setRooms: Dispatch<SetStateAction<ChatRoom[]>>;
  setDirectMessages: Dispatch<SetStateAction<DirectMessage[]>>;
  onResetMessages: () => void;
}

export function useChatSelection({ // Hook นี้จะถูกใช้ใน ChatRoomsPage เพื่อจัดการ state ของห้องแชทและ DM conversation ที่ถูกเลือก รวมถึงฟังก์ชันสำหรับเปลี่ยน tab ระหว่างห้องแชทและ DM, เลือกห้องแชทหรือ DM conversation, และรีเซ็ตข้อความเมื่อเปลี่ยนการเลือก
  setRooms,
  setDirectMessages,
  onResetMessages,
}: UseChatSelectionParams) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDM, setSelectedDM] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTab>('rooms');
  const [mobileView, setMobileView] = useState<MobileView>('list');

  const handleTabChange = (tab: ChatTab) => { // ฟังก์ชันนี้จะถูกเรียกเมื่อเปลี่ยน tab ระหว่างห้องแชทและ DM เพื่อรีเซ็ตการเลือกห้องแชทหรือ DM และรีเซ็ตข้อความในหน้า
    setActiveTab(tab);
    if (tab === 'rooms') {
      setSelectedDM('');
    } else {
      setSelectedRoom('');
    }
    onResetMessages();
  };

  const handleSelectRoom = (id: string) => { // ฟังก์ชันนี้จะถูกเรียกเมื่อเลือกห้องแชท เพื่อรีเซ็ตข้อความในหน้าและตั้งค่า unread ของห้องแชทที่ถูกเลือก
    if (id === selectedRoom) {
      setMobileView('chat');
      return;
    }

    setRooms((prev) =>
      prev.map((room) =>
        room.id === id ? { ...room, unread: 0 } : room,
      ),
    );
    setSelectedRoom(id);
    setSelectedDM('');
    onResetMessages();
    setMobileView('chat');
  };

  const handleSelectDM = (id: string) => {  // ฟังก์ชันนี้จะถูกเรียกเมื่อเลือก DM conversation เพื่อรีเซ็ตข้อความในหน้าและตั้งค่า unread ของ DM conversation ที่ถูกเลือก
    if (id === selectedDM) {
      setMobileView('chat');
      return;
    }

    setDirectMessages((prev) => // อัปเดตสถานะ unread ของ DM conversation ที่ถูกเลือกเป็น 0 เพราะถือว่าเปิดอ่านแล้ว
      prev.map((dm) => (dm.id === id ? { ...dm, unread: 0 } : dm)),
    );
    setSelectedDM(id);
    setSelectedRoom('');
    onResetMessages();
    setMobileView('chat');
  };

  return {
    activeTab,
    mobileView,
    selectedDM,
    selectedRoom,
    setActiveTab,
    setMobileView,
    setSelectedDM,
    setSelectedRoom,
    handleTabChange,
    handleSelectDM,
    handleSelectRoom,
  };
}
