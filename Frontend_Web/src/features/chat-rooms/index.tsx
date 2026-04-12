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
import { connectSocket } from '@/lib/socket';
import type { ChatRoom, Message, Member, ChatTab, DirectMessage } from '@/types/chat-ui';
import type { WorkspaceMember } from '@/types/workspace';
import { toast } from 'sonner';
import { useWebRTCContext } from '@/contexts/WebRTCContext';

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
  const d = new Date(m.createdAt);
  return {
    id: m.id,
    sender: m.sender.Name,
    avatar: m.sender.Name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
    content: m.content,
    timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toISOString().slice(0, 10), // "YYYY-MM-DD"
    isOwn: m.senderId === myId,
    type: (m.type as Message['type']) ?? 'TEXT',
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileSize: m.fileSize,
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
  const d = new Date(m.createdAt);
  return {
    id: m.id,
    sender: m.sender.Name,
    avatar: m.sender.Name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
    content: m.content,
    timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toISOString().slice(0, 10), // "YYYY-MM-DD"
    isOwn: m.senderId === myId,
    type: (m.type as Message['type']) ?? 'TEXT',
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileSize: m.fileSize,
    isRead: m.isRead,
  };
}

export function ChatRoomsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const wsId = currentWorkspace?.id;
  const myId = user?.id ?? '';
  const { callState, startCall } = useWebRTCContext();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDM, setSelectedDM] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTab>('rooms');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  // Loading & pagination state
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const LIMIT = 50;

  // DM state
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  // workspace members สำหรับแสดงในแท็บ DM (ทุกคนใน workspace)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  // online status map: userId → boolean
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [myWorkspaceRole, setMyWorkspaceRole] = useState<'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'>('MEMBER');
  const [isNewDMDialogOpen, setIsNewDMDialogOpen] = useState(false);

  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [isLeaveRoomDialogOpen, setIsLeaveRoomDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [selectedUsersToInvite, setSelectedUsersToInvite] = useState<string[]>([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');

  // Mobile navigation — แสดง 1 panel ต่อครั้งบนมือถือ
  // 'list' = ChatSidebar, 'chat' = ChatWindow, 'detail' = ChatDetailPanel
  type MobileView = 'list' | 'chat' | 'detail';
  const [mobileView, setMobileView] = useState<MobileView>('list');

  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const isFirstRoomLoad = useRef(true);

  const fetchRooms = useCallback(async () => {
    if (!wsId) return;
    try {
      const data = await chatService.getRooms(wsId);
      setRooms(data.map(mapRoom));
      // auto-select ห้องแรกเฉพาะครั้งแรกที่โหลด
      if (data.length > 0 && isFirstRoomLoad.current) {
        isFirstRoomLoad.current = false;
        setSelectedRoom(data[0].id);
      }
    } catch {
      toast.error('โหลดห้องแชทไม่สำเร็จ');
    }
  }, [wsId]);

  const fetchMessages = useCallback(
    async (roomId: string, offset = 0) => {
      if (offset === 0) setIsLoadingMessages(true);
      try {
        const res = await chatService.getMessages(roomId, { limit: LIMIT, offset });
        const mapped = res.data.map((m) => mapMessage(m, myId));
        if (offset === 0) {
          setMessages(mapped);
        } else {
          setMessages((prev) => [...mapped, ...prev]); // prepend ข้อความเก่า
        }
        setHasMore(res.total > offset + res.data.length);
        setMessageOffset(offset + res.data.length);
      } catch {
        toast.error('โหลดข้อความไม่สำเร็จ');
      } finally {
        if (offset === 0) setIsLoadingMessages(false);
      }
    },
    [myId, LIMIT],
  );

  const fetchRoomDetail = useCallback(async (roomId: string) => {
    try {
      const detail = await chatService.getRoomById(roomId);
      setMembers(
        (detail.members ?? []).map((m) => ({
          id: m.user.id,
          name: m.user.Name,
          role: (m.user.workspaceRole ?? 'MEMBER') as Member['role'],
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
      // ดึง role ของตัวเองก่อน filter ออก
      const me = data.find((m) => m.userId === myId);
      if (me) setMyWorkspaceRole(me.role as 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER');
      setWorkspaceMembers(data.filter((m) => m.userId !== myId));
    } catch { /* ignore */ }
  }, [wsId, myId]);

  const fetchDMMessages = useCallback(
    async (conversationId: string, offset = 0) => {
      if (offset === 0) setIsLoadingMessages(true);
      try {
        const res = await dmService.getMessages(conversationId, { limit: LIMIT, offset });
        const mapped = res.data.map((m) => mapDMMessage(m, myId));
        if (offset === 0) {
          setMessages(mapped);
          fetchDMs(); // refresh unread count หลัง fetch ครั้งแรก
        } else {
          setMessages((prev) => [...mapped, ...prev]); // prepend ข้อความเก่า
        }
        setHasMore(res.total > offset + res.data.length);
        setMessageOffset(offset + res.data.length);
      } catch {
        toast.error('โหลดข้อความ DM ไม่สำเร็จ');
      } finally {
        if (offset === 0) setIsLoadingMessages(false);
      }
    },
    [myId, fetchDMs, LIMIT],
  );

  // โหลดข้อความเพิ่มเติมเมื่อ scroll ขึ้นถึงด้านบน
  const handleLoadMore = useCallback(async () => {
    if (activeTab === 'rooms' && selectedRoom) {
      await fetchMessages(selectedRoom, messageOffset);
    } else if (activeTab === 'dms' && selectedDM) {
      await fetchDMMessages(selectedDM, messageOffset);
    }
  }, [activeTab, selectedRoom, selectedDM, messageOffset, fetchMessages, fetchDMMessages]);

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

    // ใช้ named handler เพื่อไม่ให้ off ลบ listener ของ hook อื่น
    const handleMessageReceived = (msg: MessageResponse) => {
      setMessages((prev) => [...prev, mapMessage(msg, myId)]);
    };
    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.emit('leave_room', selectedRoom);
      socket.off('message_received', handleMessageReceived);
    };
  }, [selectedRoom, fetchMessages, fetchRoomDetail, myId]);

  // Socket สำหรับ DM
  useEffect(() => {
    if (!selectedDM) return;
    fetchDMMessages(selectedDM);

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join_dm', selectedDM);

    const handleDMReceived = (msg: DMMessageResponse) => {
      setMessages((prev) => [...prev, mapDMMessage(msg, myId)]);
      setDirectMessages((prev) =>
        prev.map((dm) =>
          dm.id === selectedDM
            ? {
                ...dm,
                lastMessage: msg.content,
                lastMessageTime: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: 0, // user กำลังดูอยู่ → ถือว่าอ่านแล้วทันที
              }
            : dm,
        ),
      );
      // ถ้าข้อความไม่ใช่ของตัวเอง → mark as read ทันที
      // เพราะ user กำลังเห็นข้อความนี้อยู่ → trigger dm_read ให้ผู้ส่งเห็น "Read"
      if (msg.senderId !== myId) {
        dmService.markAsRead(selectedDM).catch(() => {});
      }
    };

    const handleDMRead = ({ conversationId }: { conversationId: string; readByUserId: string }) => {
      if (conversationId !== selectedDM) return;
      setMessages((prev) => prev.map((m) => (m.isOwn ? { ...m, isRead: true } : m)));
    };

    socket.on('dm_received', handleDMReceived);
    socket.on('dm_read', handleDMRead);

    return () => {
      socket.emit('leave_dm', selectedDM);
      socket.off('dm_received', handleDMReceived);
      socket.off('dm_read', handleDMRead);
    };
  }, [selectedDM, fetchDMMessages, myId]);

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

  const resetMessages = () => {
    setMessages([]);
    setHasMore(false);
    setMessageOffset(0);
  };

  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    // clear selection ของ tab อีกฝั่งเพื่อไม่ให้ข้อความ/chat window ค้างอยู่
    if (tab === 'rooms') {
      setSelectedDM('');
      resetMessages();
    } else {
      setSelectedRoom('');
      resetMessages();
    }
  };

  const handleSelectRoom = (id: string) => {
    if (id === selectedRoom) {
      setMobileView('chat'); // กดซ้ำห้องเดิม → ไปหน้าแชท (สำหรับ mobile)
      return;
    }
    setSelectedRoom(id);
    setSelectedDM('');
    resetMessages();
    setMobileView('chat');
  };

  const handleSelectDM = (id: string) => {
    if (id === selectedDM) {
      setMobileView('chat');
      return;
    }
    setSelectedDM(id);
    setSelectedRoom('');
    resetMessages();
    setMobileView('chat');
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

  const handleCreateRoom = async (name: string, allowedRoles: string[]) => {
    if (!wsId) return;
    const room = await chatService.createRoom(wsId, { name, allowedRoles });
    setRooms((prev) => [...prev, mapRoom(room)]);
    setIsCreateRoomDialogOpen(false);
    handleSelectRoom(room.id);
  };

  const handleRemoveMember = async () => {
    if (!selectedRoom || !memberToRemove) return;
    try {
      await chatService.leaveRoom(selectedRoom, memberToRemove.id);
      // ลบ member ออกจาก local state ทันที
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setMemberToRemove(null);
      setIsRemoveMemberDialogOpen(false);
      toast.success(`นำ ${memberToRemove.name} ออกจากห้องแล้ว`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'นำสมาชิกออกไม่สำเร็จ');
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom || !myId) return;
    const roomIdToLeave = selectedRoom;
    try {
      await chatService.leaveRoom(roomIdToLeave, myId);
    } catch {
      // ignore — backend ใช้ deleteMany แล้ว ไม่ throw
    }
    // ลบห้องออกจาก state + clear selection
    setRooms((prev) => prev.filter((r) => r.id !== roomIdToLeave));
    setSelectedRoom('');
    resetMessages();
    setIsLeaveRoomDialogOpen(false);
    toast.success('ออกจากห้องแล้ว');
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (activeTab === 'dms' && selectedDM) {
        await dmService.deleteMessage(messageId);
      } else if (activeTab === 'rooms' && selectedRoom) {
        await chatService.deleteMessage(messageId);
      }
      // ลบออกจาก UI
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('ลบข้อความแล้ว');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบข้อความไม่สำเร็จ');
    }
  };

  const handleSendFile = async (file: File) => {
    try {
      const socket = socketRef.current;
      if (activeTab === 'dms' && selectedDM) {
        // REST upload — socket broadcast จะทำที่ server
        const msg = await dmService.sendFileMessage(selectedDM, file);
        // ถ้า socket ไม่ connected ให้เพิ่มเอง
        if (!socket?.connected) {
          setMessages((prev) => [...prev, mapDMMessage(msg, myId)]);
        }
      } else if (activeTab === 'rooms' && selectedRoom) {
        const msg = await chatService.sendRoomFile(selectedRoom, file);
        // socket broadcast จะทำที่ server แต่ถ้าไม่ connected ให้เพิ่มเอง
        if (!socket?.connected) {
          setMessages((prev) => [...prev, mapMessage(msg, myId)]);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งไฟล์ไม่สำเร็จ');
    }
  };

  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const currentDM = directMessages.find((d) => d.id === selectedDM);
  const hasSelection = !!selectedRoom || !!selectedDM;
  const isCallBusy = callState.status !== 'idle' && callState.status !== 'ended';

  // Visibility classes สำหรับ mobile:
  // Desktop (md+): ทุก panel แสดงพร้อมกัน
  // Mobile: แสดงตาม mobileView
  const sidebarVisible = mobileView === 'list';
  const windowVisible = mobileView === 'chat';
  const detailVisible = mobileView === 'detail';

  return (
    <div className="flex h-full bg-muted">
      {/* ChatSidebar — full width บน mobile, w-80 บน desktop */}
      <div className={`${sidebarVisible ? 'flex' : 'hidden'} md:flex w-full md:w-80 shrink-0`}>
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
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
          onCreateRoom={handleCreateRoom}
          onOpenDMWithUser={handleOpenNewDM}
        />
      </div>

      {hasSelection ? (
        <>
          {/* ChatWindow — full width บน mobile เมื่อ view=chat */}
          <div className={`${windowVisible ? 'flex' : 'hidden'} md:flex flex-1 min-w-0`}>
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
              isLoading={isLoadingMessages}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onBack={() => setMobileView('list')}
              onShowDetail={() => setMobileView('detail')}
              onStartVoiceCall={
                currentDM
                  ? () => void startCall(currentDM.userId, currentDM.id, 'audio', currentDM.userName, currentDM.avatarUrl)
                  : undefined
              }
              disableCallActions={
                !currentDM || isCallBusy
              }
            />
          </div>
          {/* ChatDetailPanel — full width บน mobile เมื่อ view=detail */}
          <div className={`${detailVisible ? 'flex' : 'hidden'} md:flex w-full md:w-80 shrink-0`}>
            <ChatDetailPanel
              activeTab={activeTab}
              currentRoom={currentRoom}
              currentDM={currentDM}
              members={members}
              messages={messages}
              myWorkspaceRole={myWorkspaceRole}
              onInviteMember={() => setIsInviteMemberDialogOpen(true)}
              onRemoveMember={(member) => {
                setMemberToRemove(member);
                setIsRemoveMemberDialogOpen(true);
              }}
              onLeaveRoom={() => setIsLeaveRoomDialogOpen(true)}
              onlineStatus={onlineStatus}
              dmUserDetail={currentDM ? workspaceMembers.find((m) => m.userId === currentDM.userId) ?? null : null}
              onBack={() => setMobileView('chat')}
            />
          </div>
        </>
      ) : (
        <div className="hidden md:flex flex-1">
          <ChatEmptyState activeTab={activeTab} />
        </div>
      )}

      <InviteMemberDialog
        open={isInviteMemberDialogOpen}
        onOpenChange={(open) => {
          setIsInviteMemberDialogOpen(open);
          if (!open) { setSelectedUsersToInvite([]); setInviteSearchQuery(''); }
        }}
        currentRoom={currentRoom}
        // workspace members ที่ยังไม่ได้อยู่ในห้องนี้
        availableUsers={workspaceMembers
          .filter((m) => !members.some((rm) => rm.id === m.userId))
          .map((m) => ({
            id: m.userId,
            name: m.user.Name,
            avatar: m.user.Name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
            status: (onlineStatus[m.userId] ? 'online' : 'offline') as 'online' | 'offline',
          }))}
        selectedUsers={selectedUsersToInvite}
        onToggleUser={(id) =>
          setSelectedUsersToInvite((p) =>
            p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
          )
        }
        onClearSelection={() => setSelectedUsersToInvite([])}
        onInvite={async () => {
          if (!selectedRoom) return;
          await Promise.all(
            selectedUsersToInvite.map((userId) =>
              chatService.addRoomMember(selectedRoom, userId),
            ),
          );
          // รีโหลด room detail เพื่ออัปเดต members list
          await fetchRoomDetail(selectedRoom);
          setSelectedUsersToInvite([]);
          setIsInviteMemberDialogOpen(false);
          toast.success(`เชิญสมาชิก ${selectedUsersToInvite.length} คน สำเร็จ`);
        }}
        searchQuery={inviteSearchQuery}
        onSearchChange={setInviteSearchQuery}
      />

      <RemoveMemberDialog
        open={isRemoveMemberDialogOpen}
        onOpenChange={setIsRemoveMemberDialogOpen}
        currentRoom={currentRoom}
        member={memberToRemove}
        onConfirm={handleRemoveMember}
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
