// ===== Chat Detail Panel — Right sidebar =====
import {
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  User,
  Bell,
  Users,
  LogOut,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ChatRoom, DirectMessage, Member, ChatTab } from '@/types/chat-ui';

interface ChatDetailPanelProps {
  activeTab: ChatTab;
  currentRoom: ChatRoom | undefined;
  currentDM: DirectMessage | undefined;
  members: Member[];
  onInviteMember: () => void;
  onRemoveMember: (member: Member) => void;
  onLeaveRoom: () => void;
}

export function ChatDetailPanel({
  activeTab,
  currentRoom,
  currentDM,
  members,
  onInviteMember,
  onRemoveMember,
  onLeaveRoom,
}: ChatDetailPanelProps) {
  return (
    <div className="w-80 bg-white border-l border-border p-4 space-y-6">
      {activeTab === 'rooms' ? (
        <RoomDetails
          currentRoom={currentRoom}
          members={members}
          onInviteMember={onInviteMember}
          onRemoveMember={onRemoveMember}
          onLeaveRoom={onLeaveRoom}
        />
      ) : (
        <DMDetails currentDM={currentDM} />
      )}
    </div>
  );
}

/* ---- Room Detail sub-section ---- */
function RoomDetails({
  currentRoom,
  members,
  onInviteMember,
  onRemoveMember,
  onLeaveRoom,
}: {
  currentRoom: ChatRoom | undefined;
  members: Member[];
  onInviteMember: () => void;
  onRemoveMember: (member: Member) => void;
  onLeaveRoom: () => void;
}) {
  return (
    <>
      {/* Room Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base">Members ({members.length})</h3>
          <Button variant="ghost" size="sm" onClick={onInviteMember}>
            <UserPlus className="size-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="relative">
                <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                  {member.avatar}
                </div>
                <div
                  className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                    member.status === 'online'
                      ? 'bg-green-500'
                      : member.status === 'away'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{member.name}</p>
                <div className="flex items-center gap-1">
                  {member.role === 'admin' && (
                    <Crown className="size-3 text-yellow-600" />
                  )}
                  {member.role === 'moderator' && (
                    <Shield className="size-3 text-blue-600" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">
                    {member.role}
                  </span>
                </div>
              </div>
              {member.role !== 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveMember(member);
                  }}
                >
                  <UserMinus className="size-4 text-red-600" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Related Announcements */}
      <div>
        <h3 className="text-base mb-3">Related Announcements</h3>
        <div className="space-y-2">
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <p className="text-sm mb-1">Q1 Product Roadmap Review</p>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </Card>
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <p className="text-sm mb-1">Sprint Planning - Week 5</p>
            <p className="text-xs text-muted-foreground">1 day ago</p>
          </Card>
        </div>
      </div>

      {/* Leave Room */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLeaveRoom}
        >
          <LogOut className="size-4 mr-2" />
          Leave Room
        </Button>
      </div>
    </>
  );
}

/* ---- DM Detail sub-section ---- */
function DMDetails({ currentDM }: { currentDM: DirectMessage | undefined }) {
  return (
    <>
      {/* DM User Info */}
      <div className="text-center">
        <div className="relative inline-block mb-3">
          <div className="size-20 rounded-full bg-[#75A2BF] flex items-center justify-center text-white text-2xl">
            {currentDM?.avatar}
          </div>
          <div
            className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-white ${
              currentDM?.status === 'online'
                ? 'bg-green-500'
                : currentDM?.status === 'away'
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
            }`}
          />
        </div>
        <h3 className="text-base mb-1">{currentDM?.userName}</h3>
        <p className="text-sm text-muted-foreground capitalize mb-4">
          {currentDM?.status}
        </p>
        <Button variant="outline" className="w-full" onClick={() => {}}>
          <User className="size-4 mr-2" />
          View Profile
        </Button>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Bell className="size-4 mr-2" />
            Mute Conversation
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Users className="size-4 mr-2" />
            Create Group Chat
          </Button>
        </div>
      </div>

      {/* Shared Files */}
      <div>
        <h4 className="text-sm mb-3">Shared Files</h4>
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-xs">No files shared yet</p>
        </div>
      </div>
    </>
  );
}
