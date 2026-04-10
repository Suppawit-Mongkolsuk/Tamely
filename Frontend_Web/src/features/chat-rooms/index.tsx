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
import { dmService } from '@/services/dm.service';
import { workspaceService } from '@/services/workspace.service';
import type { RoomResponse, MessageResponse } from '@/services/chat.service';
import type { DMConversationResponse, DMMessageResponse } from '@/services/dm.service';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import type { ChatRoom, Message, Member, ChatTab, DirectMessage } from '@/types/chat-ui';
import type { WorkspaceMember } from '@/types/workspace';
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

function mapDMConversation(conv: DMConversationResponse, myId: string): DirectMessage {
  // อีกฝ่ายคือ user ที่ไม่ใช่เรา
  const other = conv.userAId === myId ? conv.userB : conv.userA;
  const initials = other.Name.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const lastMsg = conv.lastMessage;
  return {
    id: conv.id,
    userId: other.id,
    userName: other.Name,
    avatar: initials,
    avatarUrl: other.avatarUrl,
    status: 'offline' as const,
    unread: conv.unreadCount,
    lastMessage: lastMsg?.content ?? '',
    lastMessageTime: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }) : '',
  };
}

function mapDMMessage(m: DMMessageResponse, myId: string): Message {
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
    type: (m.type as Message['type']) ?? 'TEXT',
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileSize: m.fileSize,
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

  // DM state
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  // workspace members สำหรับแสดงในแท็บ DM (ทุกคนใน workspace)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  // online status map: userId → boolean
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [isNewDMDialogOpen, setIsNewDMDialogOpen] = useState(false);

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

  const fetchDMs = useCallback(async () => {
    if (!wsId) return;
    try {
      const data = await dmService.getConversations(wsId);
      setDirectMessages(data.map((c) => mapDMConversation(c, myId)));
    } catch {
      toast.error('โหลด DM ไม่สำเร็จ');
    }
  }, [wsId, myId]);

  const fetchWorkspaceMembers = useCallback(async () => {
    if (!wsId) return;
    try {
      const data = await workspaceService.getMembers(wsId);
      // ไม่แสดงตัวเอง
      setWorkspaceMembers(data.filter((m) => m.userId !== myId));
    } catch { /* ignore */ }
  }, [wsId, myId]);

  const fetchDMMessages = useCallback(
    async (conversationId: string) => {
      try {
        const res = await dmService.getMessages(conversationId, { limit: 50 });
        setMessages(res.data.map((m) => mapDMMessage(m, myId)));
        // refresh unread count หลัง fetch
        fetchDMs();
      } catch {
        toast.error('โหลดข้อความ DM ไม่สำเร็จ');
      }
    },
    [myId, fetchDMs],
  );

  useEffect(() => {
    fetchRooms();
    // โหลด workspace members ทันทีเพื่อให้ presence tracking ทำงานได้ก่อน switch tab
    fetchWorkspaceMembers();
  }, [fetchRooms, fetchWorkspaceMembers]);

  // โหลด DM list เมื่อ switch ไป DM tab
  useEffect(() => {
    if (activeTab === 'dms') {
      fetchDMs();
    }
  }, [activeTab, fetchDMs]);

  // Online presence — subscribe events ทันทีที่ socket connect
  // และ query initial status เมื่อมี workspaceMembers
  useEffect(() => {
    const socket = connectSocket(); // ensure connected

    const queryInitialStatus = () => {
      if (workspaceMembers.length === 0) return;
      const userIds = workspaceMembers.map((m) => m.userId);
      socket.emit('get_online_status', userIds, (statusMap: Record<string, boolean>) => {
        setOnlineStatus(statusMap);
      });
    };

    // subscribe online/offline events (ทำตลอดเวลา ไม่ต้องรอ tab)
    const handleOnline = ({ userId }: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: true }));
    };
    const handleOffline = ({ userId }: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: false }));
    };

    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

    // ถ้า socket connected แล้ว query ทันที ถ้าไม่ให้ query หลัง connect
    if (socket.connected) {
      queryInitialStatus();
    } else {
      socket.once('connect', queryInitialStatus);
    }

    return () => {
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
      socket.off('connect', queryInitialStatus);
    };
  }, [workspaceMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket สำหรับ Room
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

  // Socket สำหรับ DM
  useEffect(() => {
    if (!selectedDM) return;
    fetchDMMessages(selectedDM);

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join_dm', selectedDM);

    socket.on('dm_received', (msg: DMMessageResponse) => {
      setMessages((prev) => [...prev, mapDMMessage(msg, myId)]);
      // อัพเดต unread ใน sidebar
      setDirectMessages((prev) =>
        prev.map((dm) =>
          dm.id === selectedDM
            ? { ...dm, lastMessage: msg.content, lastMessageTime: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            : dm,
        ),
      );
    });

    return () => {
      socket.emit('leave_dm', selectedDM);
      socket.off('dm_received');
    };
  }, [selectedDM, fetchDMMessages, myId]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const socket = socketRef.current;

    if (activeTab === 'dms' && selectedDM) {
      // ส่ง DM
      if (socket?.connected) {
        socket.emit('send_dm', { conversationId: selectedDM, content: messageInput });
      } else {
        dmService.sendMessage(selectedDM, messageInput).then((msg) => {
          setMessages((prev) => [...prev, mapDMMessage(msg, myId)]);
        });
      }
    } else if (selectedRoom) {
      // ส่ง Room message
      if (socket?.connected) {
        socket.emit('send_message', { roomId: selectedRoom, content: messageInput });
      } else {
        chatService.sendMessage(selectedRoom, messageInput).then((msg) => {
          setMessages((prev) => [...prev, mapMessage(msg, myId)]);
        });
      }
    }
    setMessageInput('');
  };

  const handleSelectRoom = (id: string) => {
    setSelectedRoom(id);
    setSelectedDM('');
    setMessages([]);
  };

  const handleSelectDM = (id: string) => {
    setSelectedDM(id);
    setSelectedRoom('');
    setMessages([]);
  };

  const handleOpenNewDM = async (targetUserId: string) => {
    if (!wsId) return;
    try {
      const conv = await dmService.openConversation(wsId, targetUserId);
      const dm = mapDMConversation(conv, myId);
      setDirectMessages((prev) => {
        const exists = prev.find((d) => d.id === conv.id);
        return exists ? prev : [dm, ...prev];
      });
      setActiveTab('dms');
      handleSelectDM(conv.id);
      setIsNewDMDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เปิด DM ไม่สำเร็จ');
    }
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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (activeTab === 'dms' && selectedDM) {
        await dmService.deleteMessage(messageId);
      }
      // ลบออกจาก UI
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('ลบข้อความแล้ว');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบข้อความไม่สำเร็จ');
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedDM) return;
    try {
      // REST upload — socket broadcast จะทำที่ server
      const msg = await dmService.sendFileMessage(selectedDM, file);
      // ไม่ต้อง setMessages ที่นี่ เพราะ socket dm_received จะ broadcast มาให้
      // แต่ถ้า socket ไม่ connected ให้เพิ่มเอง
      const socket = socketRef.current;
      if (!socket?.connected) {
        setMessages((prev) => [...prev, mapDMMessage(msg, myId)]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งไฟล์ไม่สำเร็จ');
    }
  };

  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const currentDM = directMessages.find((d) => d.id === selectedDM);
  const hasSelection = !!selectedRoom || !!selectedDM;

  return (
    <div className="flex h-full bg-muted">
      <ChatSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rooms={rooms}
        directMessages={directMessages}
        workspaceMembers={workspaceMembers}
        onlineStatus={onlineStatus}
        selectedRoom={selectedRoom}
        selectedDM={selectedDM}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectRoom={handleSelectRoom}
        onSelectDM={handleSelectDM}
        isCreateRoomOpen={isCreateRoomDialogOpen}
        onCreateRoomOpenChange={setIsCreateRoomDialogOpen}
        onOpenDMWithUser={handleOpenNewDM}
      />

      {hasSelection ? (
        <>
          <ChatWindow
            activeTab={activeTab}
            currentRoom={currentRoom}
            currentDM={currentDM}
            messages={messages}
            messageInput={messageInput}
            onMessageInputChange={setMessageInput}
            onSendMessage={handleSendMessage}
            onlineStatus={onlineStatus}
            onDeleteMessage={handleDeleteMessage}
            onSendFile={handleSendFile}
          />
          <ChatDetailPanel
            activeTab={activeTab}
            currentRoom={currentRoom}
            currentDM={currentDM}
            members={members}
            messages={messages}
            onInviteMember={() => setIsInviteMemberDialogOpen(true)}
            onRemoveMember={(member) => {
              setMemberToRemove(member);
              setIsRemoveMemberDialogOpen(true);
            }}
            onLeaveRoom={() => setIsLeaveRoomDialogOpen(true)}
            onlineStatus={onlineStatus}
            dmUserDetail={currentDM ? workspaceMembers.find((m) => m.userId === currentDM.userId) ?? null : null}
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
