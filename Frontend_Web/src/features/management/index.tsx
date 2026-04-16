// ===== ManagementPage — Orchestrator =====
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { connectSocket } from '@/lib/socket';
import { Users, Hash, Settings, UserMinus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MembersTab } from '@/components/management/MembersTab';
import { RoomsTab } from '@/components/management/RoomsTab';
import { WorkspaceSettingsTab } from '@/components/management/WorkspaceSettingsTab';
import { CreateRoomDialog, CreateRoleDialog } from '@/components/management/Dialogs';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { workspaceService } from '@/services';
import { mockRooms, mockRoles } from '@/mocks/management';
import { toast } from 'sonner';
import type { Workspace, WorkspaceMember, WorkspaceMemberRole } from '@/types';
import type { TeamMember } from '@/types/management-ui';

type ManagementSection = 'users' | 'rooms' | 'workspace';

function formatMemberJoinDate(joinedAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(joinedAt));
}

function mapWorkspaceMember(
  member: WorkspaceMember,
  currentUserId?: string,
): TeamMember {
  return {
    id: member.userId,
    name: member.user.Name,
    role: member.role,
    status: 'active',
    joinDate: formatMemberJoinDate(member.joinedAt),
    avatarUrl: member.user.avatarUrl,
    isCurrentUser: member.userId === currentUserId,
    lastSeenAt: member.user.lastSeenAt,
  };
}

export function ManagementPage() {
  const location = useLocation();
  const { currentWorkspace, updateCurrentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  const sections: Array<{
    id: ManagementSection;
    label: string;
    title: string;
    description: string;
    icon: typeof Users;
  }> = [
    {
      id: 'users',
      label: 'จัดการสมาชิก',
      title: 'สมาชิกใน Workspace',
      description: 'เชิญสมาชิกใหม่ ปรับบทบาท และติดตามสถานะการใช้งาน',
      icon: Users,
    },
    {
      id: 'rooms',
      label: 'จัดการห้อง',
      title: 'ห้องแชททั้งหมด',
      description: 'ดูแลห้องแชท สร้างห้องใหม่ และจัดการสิทธิ์การเข้าถึง',
      icon: Hash,
    },
    {
      id: 'workspace',
      label: 'ตั้งค่า Workspace',
      title: 'ค่าตั้งค่า Workspace',
      description: 'แก้ไขข้อมูล workspace จัดการ invite code และกำหนดสิทธิ์เพิ่มเติม',
      icon: Settings,
    },
  ];

  const activeSection: ManagementSection = location.pathname.endsWith('/rooms')
    ? 'rooms'
    : location.pathname.endsWith('/workspace')
      ? 'workspace'
      : 'users';
  const activeItem = sections.find((section) => section.id === activeSection) ?? sections[0];
  const ActiveIcon = activeItem.icon;
  const canManageMembers =
    currentWorkspace?.role === 'OWNER' || currentWorkspace?.role === 'ADMIN';
  const canManageRoles = currentWorkspace?.role === 'OWNER';

  const handleWorkspaceUpdated = (updated: Workspace) => {
    updateCurrentWorkspace(updated);
  };

  const updateWorkspaceMemberCount = (delta: number) => {
    if (!currentWorkspace || currentWorkspace.memberCount === undefined) {
      return;
    }

    updateCurrentWorkspace({
      ...currentWorkspace,
      memberCount: Math.max(0, currentWorkspace.memberCount + delta),
    });
  };

  const loadMembers = async () => {
    if (!currentWorkspace) {
      setMembers([]);
      setMembersError(null);
      return;
    }

    setMembersLoading(true);
    setMembersError(null);

    try {
      const data = await workspaceService.getMembers(currentWorkspace.id);
      setMembers(data.map((member) => mapWorkspaceMember(member, user?.id)));
    } catch (err) {
      setMembersError(
        err instanceof Error ? err.message : 'โหลดสมาชิกใน workspace ไม่สำเร็จ',
      );
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection !== 'users') {
      return;
    }

    void loadMembers();
  }, [activeSection, currentWorkspace?.id, user?.id]);

  // ติดตาม online status ผ่าน socket (เฉพาะแท็บ users)
  useEffect(() => {
    if (activeSection !== 'users' || members.length === 0) return;

    const socket = connectSocket();
    const userIds = members.map((m) => m.id);

    const queryInitialStatus = () => {
      socket.emit('get_online_status', userIds, (statusMap: Record<string, boolean>) => {
        setOnlineStatus(statusMap);
      });
    };

    const handleOnline = ({ userId }: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: true }));
    };
    const handleOffline = ({ userId }: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: false }));
    };

    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

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
  }, [activeSection, members]);

  const handleChangeMemberRole = async (
    userId: string,
    role: WorkspaceMemberRole,
  ) => {
    if (!currentWorkspace) return;

    const currentMember = members.find((member) => member.id === userId);
    if (!currentMember || currentMember.role === role) {
      return;
    }

    setUpdatingRoleUserId(userId);
    try {
      await workspaceService.updateMemberRole(currentWorkspace.id, userId, role);
      setMembers((prev) =>
        prev.map((member) =>
          member.id === userId ? { ...member, role } : member,
        ),
      );
      toast.success('อัปเดต role สำเร็จ');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปเดต role ไม่สำเร็จ');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!currentWorkspace || !memberToRemove) return;

    setIsRemovingMember(true);
    try {
      await workspaceService.removeMember(currentWorkspace.id, memberToRemove.id);
      setMembers((prev) => prev.filter((member) => member.id !== memberToRemove.id));
      updateWorkspaceMemberCount(-1);
      toast.success(`นำ ${memberToRemove.name} ออกจาก workspace แล้ว`);
      setMemberToRemove(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'นำสมาชิกออกไม่สำเร็จ');
    } finally {
      setIsRemovingMember(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 text-lg sm:text-xl">จัดการ Workspace</h1>
        <p className="text-muted-foreground text-sm">
          จัดการสมาชิก, ห้องแชท, และการตั้งค่า workspace
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6 min-w-0">
        <Card className="bg-white p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#003366] text-white shrink-0">
              <ActiveIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg text-foreground">{activeItem.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeItem.description}
              </p>
            </div>
          </div>
        </Card>

        {activeSection === 'users' && (
          <MembersTab
            members={members}
            isLoading={membersLoading}
            error={membersError}
            onRetry={() => void loadMembers()}
            onChangeRole={(userId, role) => void handleChangeMemberRole(userId, role)}
            onRemoveMember={canManageMembers ? setMemberToRemove : undefined}
            canManageRoles={canManageRoles}
            updatingRoleUserId={updatingRoleUserId}
            removingUserId={isRemovingMember ? memberToRemove?.id ?? null : null}
            onlineStatus={onlineStatus}
          />
        )}

        {activeSection === 'rooms' && (
          <RoomsTab
            rooms={mockRooms}
            onCreateRoom={() => setShowCreateRoomDialog(true)}
          />
        )}

        {activeSection === 'workspace' && (
          <WorkspaceSettingsTab
            roles={mockRoles}
            workspace={currentWorkspace}
            onCreateRole={() => setShowCreateRoleDialog(true)}
            onWorkspaceUpdated={handleWorkspaceUpdated}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateRoomDialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
      />
      <CreateRoleDialog
        open={showCreateRoleDialog}
        onOpenChange={setShowCreateRoleDialog}
      />
      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemovingMember) {
            setMemberToRemove(null);
          }
        }}
        title="นำสมาชิกออกจาก workspace"
        description={
          memberToRemove
            ? `คุณต้องการนำ ${memberToRemove.name} ออกจาก ${currentWorkspace?.name ?? 'workspace'} ใช่หรือไม่`
            : undefined
        }
        warningMessage="สมาชิกคนนี้จะไม่สามารถเข้าถึงห้องและข้อมูลใน workspace นี้ได้จนกว่าจะถูกเชิญกลับเข้ามา"
        confirmLabel="นำสมาชิกออก"
        confirmVariant="destructive"
        confirmIcon={<UserMinus className="size-4" />}
        onConfirm={() => void handleConfirmRemoveMember()}
        loading={isRemovingMember}
      />
    </div>
  );
}
