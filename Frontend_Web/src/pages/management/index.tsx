// ===== ManagementPage — Orchestrator =====
import { useState } from 'react';
import { Users, Hash, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersTab } from './MembersTab';
import { RoomsTab } from './RoomsTab';
import { WorkspaceSettingsTab } from './WorkspaceSettingsTab';
import { InviteDialog, CreateRoomDialog, CreateRoleDialog } from './Dialogs';
import { mockTeamMembers, mockRooms, mockRoles } from './mock-data';

export function ManagementPage() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">จัดการ Workspace</h1>
        <p className="text-muted-foreground">
          จัดการสมาชิก, ห้องแชท, และการตั้งค่า workspace
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-white border border-border">
          <TabsTrigger value="users" className="gap-2">
            <Users className="size-4" />
            จัดการสมาชิก
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2">
            <Hash className="size-4" />
            จัดการห้อง
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-2">
            <Settings className="size-4" />
            ตั้งค่า Workspace
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
            onCreateRole={() => setShowCreateRoleDialog(true)}
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
