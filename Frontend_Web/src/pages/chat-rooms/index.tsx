// ===== ChatRoomsPage — Orchestrator =====
import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow, ChatEmptyState } from './ChatWindow';
import { ChatDetailPanel } from './ChatDetailPanel';
import { InviteMemberDialog } from './InviteMemberDialog';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { LeaveRoomDialog } from './LeaveRoomDialog';
import {
  mockRooms,
  mockDirectMessages,
  mockRoomMessages,
  mockDmMessages,
  mockMembers,
  mockAvailableUsers,
} from './mock-data';
import type { ChatTab, Member } from './types';

export function ChatRoomsPage() {
  // --- Navigation ---
  const [activeTab, setActiveTab] = useState<ChatTab>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<string>('1');
  const [selectedDM, setSelectedDM] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Dialog states ---
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] =
    useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] =
    useState(false);
  const [isLeaveRoomDialogOpen, setIsLeaveRoomDialogOpen] = useState(false);

  // --- Invite dialog state ---
  const [selectedUsersToInvite, setSelectedUsersToInvite] = useState<string[]>(
    [],
  );
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');

  // --- Remove member state ---
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  // --- Derived data ---
  const currentRoom = mockRooms.find((r) => r.id === selectedRoom);
  const currentDM = mockDirectMessages.find((dm) => dm.id === selectedDM);
  const currentMessages =
    activeTab === 'rooms' ? mockRoomMessages : mockDmMessages[selectedDM] || [];

  const currentMemberIds = mockMembers.map((m) => m.id);
  const availableUsers = mockAvailableUsers.filter(
    (user) => !currentMemberIds.includes(user.id),
  );

  // --- Handlers ---
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput('');
  };

  const handleSelectRoom = (id: string) => {
    setSelectedRoom(id);
    setSelectedDM('');
  };

  const handleSelectDM = (id: string) => {
    setSelectedDM(id);
    setSelectedRoom('');
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsersToInvite((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleInviteMembers = () => {
    console.log('Inviting users:', selectedUsersToInvite);
    setSelectedUsersToInvite([]);
    setInviteSearchQuery('');
    setIsInviteMemberDialogOpen(false);
  };

  const handleRemoveMember = () => {
    if (memberToRemove) {
      console.log('Removing member:', memberToRemove.name);
      setMemberToRemove(null);
      setIsRemoveMemberDialogOpen(false);
    }
  };

  const handleLeaveRoom = () => {
    console.log('Leaving room:', currentRoom?.name);
    setIsLeaveRoomDialogOpen(false);
  };

  const hasSelection = !!(selectedRoom || selectedDM);

  return (
    <div className="flex h-full bg-muted">
      {/* Left Sidebar */}
      <ChatSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rooms={mockRooms}
        directMessages={mockDirectMessages}
        selectedRoom={selectedRoom}
        selectedDM={selectedDM}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectRoom={handleSelectRoom}
        onSelectDM={handleSelectDM}
        isCreateRoomOpen={isCreateRoomDialogOpen}
        onCreateRoomOpenChange={setIsCreateRoomDialogOpen}
      />

      {/* Center — Chat Area */}
      {hasSelection ? (
        <>
          <ChatWindow
            activeTab={activeTab}
            currentRoom={currentRoom}
            currentDM={currentDM}
            messages={currentMessages}
            messageInput={messageInput}
            onMessageInputChange={setMessageInput}
            onSendMessage={handleSendMessage}
          />

          {/* Right Sidebar — Details */}
          <ChatDetailPanel
            activeTab={activeTab}
            currentRoom={currentRoom}
            currentDM={currentDM}
            members={mockMembers}
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

      {/* Dialogs */}
      <InviteMemberDialog
        open={isInviteMemberDialogOpen}
        onOpenChange={setIsInviteMemberDialogOpen}
        currentRoom={currentRoom}
        availableUsers={availableUsers}
        selectedUsers={selectedUsersToInvite}
        onToggleUser={toggleUserSelection}
        onClearSelection={() => setSelectedUsersToInvite([])}
        onInvite={handleInviteMembers}
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
