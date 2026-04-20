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

  const handleInviteDialogChange = useCallback((open: boolean) => { // ฟังก์ชันนี้จะถูกเรียกเมื่อเปิดหรือปิด dialog สำหรับเชิญสมาชิกใหม่เข้าห้องแชท
    setIsInviteMemberDialogOpen(open);
    if (!open) {
      setSelectedUsersToInvite([]);
      setInviteSearchQuery('');
    }
  }, []);

  const openRemoveMemberDialog = useCallback((member: Member) => { // ฟังก์ชันนี้จะถูกเรียกเมื่อคลิกปุ่มลบสมาชิกในรายการสมาชิกของห้องแชท
    setMemberToRemove(member);
    setIsRemoveMemberDialogOpen(true);
  }, []);

  const closeRemoveMemberDialog = useCallback(() => { // ฟังก์ชันนี้จะถูกเรียกเมื่อปิด dialog สำหรับยืนยันการลบสมาชิกออกจากห้องแชท
    setIsRemoveMemberDialogOpen(false);
    setMemberToRemove(null);
  }, []);

  const toggleInviteUser = useCallback((id: string) => { // ฟังก์ชันนี้จะถูกเรียกเมื่อคลิกเลือกหรือยกเลิกการเลือกผู้ใช้ในรายการผู้ใช้ที่สามารถเชิญเข้าห้องแชทได้
    setSelectedUsersToInvite((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }, []);

  const clearInviteSelection = useCallback(() => { // ฟังก์ชันนี้จะถูกเรียกเมื่อยืนยันการเชิญสมาชิกใหม่เข้าห้องแชทเสร็จแล้ว เพื่อเคลียร์การเลือกผู้ใช้และค้นหาใน dialog
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
