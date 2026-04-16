// ===== ManagementPage — Orchestrator =====
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Hash, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MembersTab } from '@/components/management/MembersTab';
import { RoomsTab } from '@/components/management/RoomsTab';
import { WorkspaceSettingsTab } from '@/components/management/WorkspaceSettingsTab';
import { InviteDialog, CreateRoomDialog, CreateRoleDialog } from '@/components/management/Dialogs';
import { mockTeamMembers, mockRooms, mockRoles } from '@/mocks/management';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import type { Workspace } from '@/types';

type ManagementSection = 'users' | 'rooms' | 'workspace';

export function ManagementPage() {
  const location = useLocation();
  const { currentWorkspace, updateCurrentWorkspace } = useWorkspaceContext();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);

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

  const handleWorkspaceUpdated = (updated: Workspace) => {
    updateCurrentWorkspace(updated);
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
            members={mockTeamMembers}
            onInvite={() => setShowInviteDialog(true)}
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
      <InviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
      <CreateRoomDialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
      />
      <CreateRoleDialog
        open={showCreateRoleDialog}
        onOpenChange={setShowCreateRoleDialog}
      />
    </div>
  );
}
