import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ChatRoom, ChatTab, DirectMessage } from '@/types/chat-ui';

export type MobileView = 'list' | 'chat' | 'detail';

interface UseChatSelectionParams {
  setRooms: Dispatch<SetStateAction<ChatRoom[]>>;
  setDirectMessages: Dispatch<SetStateAction<DirectMessage[]>>;
  onResetMessages: () => void;
}

export function useChatSelection({
  setRooms,
  setDirectMessages,
  onResetMessages,
}: UseChatSelectionParams) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDM, setSelectedDM] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTab>('rooms');
  const [mobileView, setMobileView] = useState<MobileView>('list');

  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    if (tab === 'rooms') {
      setSelectedDM('');
    } else {
      setSelectedRoom('');
    }
    onResetMessages();
  };

  const handleSelectRoom = (id: string) => {
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

  const handleSelectDM = (id: string) => {
    if (id === selectedDM) {
      setMobileView('chat');
      return;
    }

    setDirectMessages((prev) =>
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
