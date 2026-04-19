import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatSidebar } from '@/components/chat-rooms/ChatSidebar';
import { ChatWindow, ChatEmptyState } from '@/components/chat-rooms/ChatWindow';
import { ChatDetailPanel } from '@/components/chat-rooms/ChatDetailPanel';
import { InviteMemberDialog } from '@/components/chat-rooms/InviteMemberDialog';
import { RemoveMemberDialog } from '@/components/chat-rooms/RemoveMemberDialog';
import { LeaveRoomDialog } from '@/components/chat-rooms/LeaveRoomDialog';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { chatService } from '@/services/chat.service';
import { dmService } from '@/services/dm.service';
import type { RoomResponse, MessageResponse } from '@/services/chat.service';
import type { DMConversationResponse, DMMessageResponse } from '@/services/dm.service';
import { canDo, PERMISSIONS } from '@/lib/permissions';
import { formatTime, getInitials } from '@/lib/utils';
import type { ChatRoom, Message, Member, DirectMessage } from '@/types/chat-ui';
import { toast } from 'sonner';
import { useWebRTCContext } from '@/contexts/WebRTCContext';
import { useChatActions } from './useChatActions';
import { useChatDialogs } from './useChatDialogs';
import { useChatMessages } from './useChatMessages';
import { useChatPresence } from './useChatPresence';
import { useChatSelection } from './useChatSelection';
import { useChatSockets } from './useChatSockets';

function mapRoom(r: RoomResponse): ChatRoom {
  return {
    id: r.id,
    name: r.name,
    workspace: '',
    unread: r.unreadCount ?? 0,
    lastMessage: r.description ?? '',
    lastMessageTime: new Date(r.createdAt).toLocaleDateString(),
  };
}

function formatRoomPreviewTime(createdAt: string): string {
  return formatTime(createdAt);
}

function updateRoomPreview(
  list: ChatRoom[],
  roomId: string,
  message: Pick<MessageResponse, 'content' | 'createdAt' | 'sender'>,
  myId: string,
  openedRoomId?: string,
): ChatRoom[] {
  return list.map((room) => {
    if (room.id !== roomId) return room;

    const isOpened = openedRoomId === roomId;
    const shouldIncrementUnread = message.sender.id !== myId && !isOpened;

    return {
      ...room,
      lastMessage: message.content,
      lastMessageTime: formatRoomPreviewTime(message.createdAt),
      unread: isOpened ? 0 : room.unread + (shouldIncrementUnread ? 1 : 0),
    };
  });
}

type ChatMessageResponse = MessageResponse | DMMessageResponse;

function mapChatMessage(m: ChatMessageResponse, myId: string): Message {
  const d = new Date(m.createdAt);
  return {
    id: m.id,
    sender: m.sender.Name,
    avatar: getInitials(m.sender.Name),
    avatarUrl: m.sender.avatarUrl,
    content: m.content,
    timestamp: formatTime(d),
    date: d.toISOString().slice(0, 10), // "YYYY-MM-DD"
    isOwn: m.sender.id === myId,
    type: (m.type as Message['type']) ?? 'TEXT',
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileSize: m.fileSize,
    isRead: 'isRead' in m ? (m.isRead ?? false) : undefined,
  };
}

function mapDMConversation(conv: DMConversationResponse, myId: string): DirectMessage {
  // อีกฝ่ายคือ user ที่ไม่ใช่เรา
  const other = conv.userA.id === myId ? conv.userB : conv.userA;
  const initials = getInitials(other.Name);

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
    lastMessageTime: lastMsg ? formatTime(lastMsg.createdAt) : '',
  };
}

function updateDMPreview(
  list: DirectMessage[],
  msg: DMMessageResponse,
  myId: string,
  openedConversationId?: string,
): DirectMessage[] {
  return list.map((dm) => {
    if (dm.id !== msg.conversationId) return dm;

    const isOpened = openedConversationId === msg.conversationId;
    const shouldIncrementUnread = msg.sender.id !== myId && !isOpened;

    return {
      ...dm,
      lastMessage: msg.content,
      lastMessageTime: formatTime(msg.createdAt),
      unread: isOpened ? 0 : dm.unread + (shouldIncrementUnread ? 1 : 0),
    };
  });
}

export function ChatRoomsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const wsId = currentWorkspace?.id;
  const myId = user?.id ?? '';
  const { callState, startCall } = useWebRTCContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  // DM state
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  // mute state — re-render เมื่อ toggle
  const [mutedIds, setMutedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`tamely_muted_${myId}`);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const isFirstRoomLoad = useRef(true);
  const canCreateRoom = canDo(currentWorkspace, PERMISSIONS.MANAGE_CHANNELS);
  const { workspaceMembers, onlineStatus, myWorkspaceRole } = useChatPresence(wsId, myId);
  const {
    isCreateRoomDialogOpen,
    setIsCreateRoomDialogOpen,
    isInviteMemberDialogOpen,
    handleInviteDialogChange,
    isRemoveMemberDialogOpen,
    setIsRemoveMemberDialogOpen,
    openRemoveMemberDialog,
    closeRemoveMemberDialog,
    isLeaveRoomDialogOpen,
    setIsLeaveRoomDialogOpen,
    memberToRemove,
    selectedUsersToInvite,
    toggleInviteUser,
    clearInviteSelection,
    inviteSearchQuery,
    setInviteSearchQuery,
  } = useChatDialogs();

  const {
    messages,
    setMessages,
    isLoadingMessages,
    hasMore,
    fetchRoomMessages,
    fetchDMMessages,
    resetMessages,
    loadMoreMessages,
  } = useChatMessages({
    myId,
    setDirectMessages,
    mapChatMessage,
  });

  const {
    activeTab,
    mobileView,
    selectedDM,
    selectedRoom,
    setMobileView,
    setSelectedRoom,
    handleTabChange,
    handleSelectDM,
    handleSelectRoom,
  } = useChatSelection({
    setRooms,
    setDirectMessages,
    onResetMessages: resetMessages,
  });

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

  const fetchRoomDetail = useCallback(async (roomId: string) => {
    try {
      const detail = await chatService.getRoomById(roomId);
      setMembers(
        (detail.members ?? []).map((m) => ({
          id: m.user.id,
          name: m.user.Name,
          role: (m.user.workspaceRole ?? 'MEMBER') as Member['role'],
          status: 'online' as const,
          avatar: getInitials(m.user.Name),
          avatarUrl: m.user.avatarUrl,
          customRoles: m.user.customRoles ?? [],
        })),
      );
    } catch (err) {
      console.warn('[ChatRooms] Failed to fetch room detail:', err);
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

  const { socketRef } = useChatSockets({
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
  });

  // โหลดข้อความเพิ่มเติมเมื่อ scroll ขึ้นถึงด้านบน
  const handleLoadMore = useCallback(async () => {
    await loadMoreMessages(activeTab, selectedRoom, selectedDM);
  }, [activeTab, loadMoreMessages, selectedDM, selectedRoom]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // โหลด DM list เมื่อ switch ไป DM tab
  useEffect(() => {
    if (activeTab === 'dms') {
      fetchDMs();
    }
  }, [activeTab, fetchDMs]);

  // เปิดห้อง/DM จาก URL params (?room=id หรือ ?dm=id) — ใช้เมื่อ navigate มาจาก toast
  useEffect(() => {
    const roomId = searchParams.get('room');
    const dmId = searchParams.get('dm');
    if (!roomId && !dmId) return;

    if (roomId) {
      handleSelectRoom(roomId);
      setSearchParams({}, { replace: true });
    } else if (dmId) {
      handleTabChange('dms');
      // DM list อาจยังไม่โหลด — โหลดก่อนแล้วค่อย select
      fetchDMs().then(() => {
        handleSelectDM(dmId);
        setSearchParams({}, { replace: true });
      });
    }
  // ทำงานครั้งเดียวตอน params เปลี่ยน — ไม่ต้องใส่ handler ใน deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const {
    handleSendMessage,
    handleOpenNewDM,
    handleCreateRoom,
    handleRemoveMember,
    handleLeaveRoom,
    handleDeleteMessage,
    handleToggleMute,
    handleClearChat,
    handleSendFile,
  } = useChatActions({
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
    closeCreateRoomDialog: () => setIsCreateRoomDialogOpen(false),
    closeRemoveMemberDialog,
    closeLeaveRoomDialog: () => setIsLeaveRoomDialogOpen(false),
    memberToRemove,
  });

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
          canCreateRoom={canCreateRoom}
          onOpenDMWithUser={handleOpenNewDM}
          mutedIds={mutedIds}
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
              onSendMessage={() => handleSendMessage(messageInput, () => setMessageInput(''))}
              onlineStatus={onlineStatus}
              onDeleteMessage={handleDeleteMessage}
              onSendFile={handleSendFile}
              isLoading={isLoadingMessages}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onBack={() => setMobileView('list')}
              onShowDetail={() => setMobileView('detail')}
              workspaceId={wsId}
              onStartVoiceCall={
                currentDM
                  ? () => void startCall(currentDM.userId, currentDM.id, 'audio', currentDM.userName, currentDM.avatarUrl)
                  : undefined
              }
              onClearChat={currentDM ? handleClearChat : undefined}
              isMuted={mutedIds.has(selectedDM || selectedRoom)}
              onToggleMute={handleToggleMute}
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
              onInviteMember={() => handleInviteDialogChange(true)}
              onRemoveMember={openRemoveMemberDialog}
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
        onOpenChange={handleInviteDialogChange}
        currentRoom={currentRoom}
        // workspace members ที่ยังไม่ได้อยู่ในห้องนี้
        availableUsers={workspaceMembers
          .filter((m) => !members.some((rm) => rm.id === m.userId))
          .map((m) => ({
            id: m.userId,
            name: m.user.Name,
            avatar: getInitials(m.user.Name),
            avatarUrl: m.user.avatarUrl,
            status: (onlineStatus[m.userId] ? 'online' : 'offline') as 'online' | 'offline',
          }))}
        selectedUsers={selectedUsersToInvite}
        onToggleUser={toggleInviteUser}
        onClearSelection={clearInviteSelection}
        onInvite={async () => {
          if (!selectedRoom) return;
          await Promise.all(
            selectedUsersToInvite.map((userId) =>
              chatService.addRoomMember(selectedRoom, userId),
            ),
          );
          // รีโหลด room detail เพื่ออัปเดต members list
          await fetchRoomDetail(selectedRoom);
          clearInviteSelection();
          handleInviteDialogChange(false);
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
        onCancel={closeRemoveMemberDialog}
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
