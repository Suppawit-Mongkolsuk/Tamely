import { useCallback, useState } from 'react';
import type { Member } from '@/types/chat-ui';

export function useChatDialogs() {
  const [isNewDMDialogOpen, setIsNewDMDialogOpen] = useState(false);
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [isLeaveRoomDialogOpen, setIsLeaveRoomDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [selectedUsersToInvite, setSelectedUsersToInvite] = useState<string[]>([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');

  const handleInviteDialogChange = useCallback((open: boolean) => {
    setIsInviteMemberDialogOpen(open);
    if (!open) {
      setSelectedUsersToInvite([]);
      setInviteSearchQuery('');
    }
  }, []);

  const openRemoveMemberDialog = useCallback((member: Member) => {
    setMemberToRemove(member);
    setIsRemoveMemberDialogOpen(true);
  }, []);

  const closeRemoveMemberDialog = useCallback(() => {
    setIsRemoveMemberDialogOpen(false);
    setMemberToRemove(null);
  }, []);

  const toggleInviteUser = useCallback((id: string) => {
    setSelectedUsersToInvite((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }, []);

  const clearInviteSelection = useCallback(() => {
    setSelectedUsersToInvite([]);
  }, []);

  return {
    isNewDMDialogOpen,
    setIsNewDMDialogOpen,
    isCreateRoomDialogOpen,
    setIsCreateRoomDialogOpen,
    isInviteMemberDialogOpen,
    setIsInviteMemberDialogOpen,
    handleInviteDialogChange,
    isRemoveMemberDialogOpen,
    setIsRemoveMemberDialogOpen,
    openRemoveMemberDialog,
    closeRemoveMemberDialog,
    isLeaveRoomDialogOpen,
    setIsLeaveRoomDialogOpen,
    memberToRemove,
    setMemberToRemove,
    selectedUsersToInvite,
    setSelectedUsersToInvite,
    toggleInviteUser,
    clearInviteSelection,
    inviteSearchQuery,
    setInviteSearchQuery,
  };
}
