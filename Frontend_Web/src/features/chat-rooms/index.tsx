import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSidebar } from '@/components/chat-rooms/ChatSidebar';
import { ChatWindow, ChatEmptyState } from '@/components/chat-rooms/ChatWindow';
import { ChatDetailPanel } from '@/components/chat-rooms/ChatDetailPanel';
import { InviteMemberDialog } from '@/components/chat-rooms/InviteMemberDialog';
import { RemoveMemberDialog } from '@/components/chat-rooms/RemoveMemberDialog';
import { LeaveRoomDialog } from '@/components/chat-rooms/LeaveRoomDialog';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuthContext } from '@/contexts';
import { chatService } from '@/services/chat.service';
import type { RoomResponse, MessageResponse } from '@/services/chat.service';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { ChatRoom, Message, Member, ChatTab } from '@/types/chat-ui';
import { toast } from 'sonner';

function mapRoom(r: RoomResponse): ChatRoom {
  return {
    id: r.id,
    name: r.name,
    workspace: '',
    unread: 0,
    lastMessage: r.description ?? '',
    lastMessageTime: new Date(r.createdAt).toLocaleDateString(),
  };
}

function mapMessage(m: MessageResponse, myId: string): Message {
  return {
    id: m.id,
    sender: m.sender.Name,
    avatar: m.sender.Name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
    content: m.content,
    timestamp: new Date(m.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    isOwn: m.senderId === myId,
  };
}

export function ChatRoomsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const wsId = currentWorkspace?.id;
  const myId = user?.id ?? '';

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDM, setSelectedDM] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTab>('rooms');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [isLeaveRoomDialogOpen, setIsLeaveRoomDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [selectedUsersToInvite, setSelectedUsersToInvite] = useState<string[]>([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');

  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!wsId) return;
    try {
      const data = await chatService.getRooms(wsId);
      setRooms(data.map(mapRoom));
      if (data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0].id);
      }
    } catch {
      toast.error('โหลดห้องแชทไม่สำเร็จ');
    }
  }, [wsId, selectedRoom]);

  const fetchMessages = useCallback(
    async (roomId: string) => {
      try {
        const res = await chatService.getMessages(roomId, { limit: 50 });
        setMessages(res.data.map((m) => mapMessage(m, myId)));
      } catch {
        toast.error('โหลดข้อความไม่สำเร็จ');
      }
    },
    [myId],
  );

  const fetchRoomDetail = useCallback(async (roomId: string) => {
    try {
      const detail = await chatService.getRoomById(roomId);
      setMembers(
        (detail.members ?? []).map((m) => ({
          id: m.user.id,
          name: m.user.Name,
          role: 'member' as const,
          status: 'online' as const,
          avatar: m.user.Name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
        })),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (!selectedRoom) return;
    fetchMessages(selectedRoom);
    fetchRoomDetail(selectedRoom);

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join_room', selectedRoom);

    socket.on('message_received', (msg: MessageResponse) => {
      setMessages((prev) => [...prev, mapMessage(msg, myId)]);
    });

    return () => {
      socket.emit('leave_room', selectedRoom);
      socket.off('message_received');
    };
  }, [selectedRoom, fetchMessages, fetchRoomDetail, myId]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoom) return;
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('send_message', {
        roomId: selectedRoom,
        content: messageInput,
      });
    } else {
      chatService.sendMessage(selectedRoom, messageInput).then((msg) => {
        setMessages((prev) => [...prev, mapMessage(msg, myId)]);
      });
    }
    setMessageInput('');
  };

  const handleSelectRoom = (id: string) => {
    setSelectedRoom(id);
    setSelectedDM('');
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom || !myId) return;
    try {
      await chatService.leaveRoom(selectedRoom, myId);
      setSelectedRoom('');
      fetchRooms();
      setIsLeaveRoomDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ออกจากห้องไม่สำเร็จ');
    }
  };

  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const hasSelection = !!selectedRoom;

  return (
    <div className="flex h-full bg-muted">
      <ChatSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rooms={rooms}
        directMessages={[]}
        selectedRoom={selectedRoom}
        selectedDM={selectedDM}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectRoom={handleSelectRoom}
        onSelectDM={(id: string) => setSelectedDM(id)}
        isCreateRoomOpen={isCreateRoomDialogOpen}
        onCreateRoomOpenChange={setIsCreateRoomDialogOpen}
      />

      {hasSelection ? (
        <>
          <ChatWindow
            activeTab={activeTab}
            currentRoom={currentRoom}
            currentDM={undefined}
            messages={messages}
            messageInput={messageInput}
            onMessageInputChange={setMessageInput}
            onSendMessage={handleSendMessage}
          />
          <ChatDetailPanel
            activeTab={activeTab}
            currentRoom={currentRoom}
            currentDM={undefined}
            members={members}
            onInviteMember={() => setIsInviteMemberDialogOpen(true)}
            onRemoveMember={(member) => {
              setMemberToRemove(member);
              setIsRemoveMemberDialogOpen(true);
            }}
            onLeaveRoom={() => setIsLeaveRoomDialogOpen(true)}
          />
        </>
      ) : (
        <ChatEmptyState activeTab={activeTab} />
      )}

      <InviteMemberDialog
        open={isInviteMemberDialogOpen}
        onOpenChange={setIsInviteMemberDialogOpen}
        currentRoom={currentRoom}
        availableUsers={[]}
        selectedUsers={selectedUsersToInvite}
        onToggleUser={(id) =>
          setSelectedUsersToInvite((p) =>
            p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
          )
        }
        onClearSelection={() => setSelectedUsersToInvite([])}
        onInvite={() => {
          setSelectedUsersToInvite([]);
          setIsInviteMemberDialogOpen(false);
        }}
        searchQuery={inviteSearchQuery}
        onSearchChange={setInviteSearchQuery}
      />

      <RemoveMemberDialog
        open={isRemoveMemberDialogOpen}
        onOpenChange={setIsRemoveMemberDialogOpen}
        currentRoom={currentRoom}
        member={memberToRemove}
        onConfirm={() => {
          setMemberToRemove(null);
          setIsRemoveMemberDialogOpen(false);
        }}
        onCancel={() => {
          setIsRemoveMemberDialogOpen(false);
          setMemberToRemove(null);
        }}
      />

      <LeaveRoomDialog
        open={isLeaveRoomDialogOpen}
        onOpenChange={setIsLeaveRoomDialogOpen}
        currentRoom={currentRoom}
        onConfirm={handleLeaveRoom}
      />
    </div>
  );
}
