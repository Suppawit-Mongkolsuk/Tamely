// ===== ManagementPage — Orchestrator =====
import { useState } from 'react';
import { Users, Hash, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersTab } from '@/components/management/MembersTab';
import { RoomsTab } from '@/components/management/RoomsTab';
import { WorkspaceSettingsTab } from '@/components/management/WorkspaceSettingsTab';
import { InviteDialog, CreateRoomDialog, CreateRoleDialog } from '@/components/management/Dialogs';
import { mockTeamMembers, mockRooms, mockRoles } from '@/mocks/management';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import type { Workspace } from '@/types';

export function ManagementPage() {
  const { currentWorkspace, updateCurrentWorkspace } = useWorkspaceContext();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);

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

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-white border border-border w-full sm:w-auto">
          <TabsTrigger value="users" className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm">
            <Users className="size-4" />
            <span className="hidden sm:inline">จัดการ</span>สมาชิก
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm">
            <Hash className="size-4" />
            <span className="hidden sm:inline">จัดการ</span>ห้อง
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm">
            <Settings className="size-4" />
            <span className="hidden sm:inline">ตั้งค่า</span> Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <MembersTab
            members={mockTeamMembers}
            onInvite={() => setShowInviteDialog(true)}
          />
        </TabsContent>

        <TabsContent value="rooms">
          <RoomsTab
            rooms={mockRooms}
            onCreateRoom={() => setShowCreateRoomDialog(true)}
          />
        </TabsContent>

        <TabsContent value="workspace">
          <WorkspaceSettingsTab
            roles={mockRoles}
            workspace={currentWorkspace}
            onCreateRole={() => setShowCreateRoleDialog(true)}
            onWorkspaceUpdated={handleWorkspaceUpdated}
          />
        </TabsContent>
      </Tabs>

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
