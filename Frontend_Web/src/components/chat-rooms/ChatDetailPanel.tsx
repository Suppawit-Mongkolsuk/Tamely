// ===== Chat Detail Panel — Right sidebar =====
import { useState } from 'react';
import {
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  User,
  LogOut,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { ChatRoom, DirectMessage, Member, ChatTab, Message } from '@/types/chat-ui';
import type { WorkspaceMember } from '@/types/workspace';

interface ChatDetailPanelProps {
  activeTab: ChatTab;
  currentRoom: ChatRoom | undefined;
  currentDM: DirectMessage | undefined;
  members: Member[];
  messages?: Message[];
  myWorkspaceRole?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  onInviteMember: () => void;
  onRemoveMember: (member: Member) => void;
  onLeaveRoom: () => void;
  onlineStatus?: Record<string, boolean>;
  dmUserDetail?: WorkspaceMember | null;
  onBack?: () => void;
}

export function ChatDetailPanel({
  activeTab,
  currentRoom,
  currentDM,
  members,
  messages = [],
  myWorkspaceRole = 'MEMBER',
  onInviteMember,
  onRemoveMember,
  onLeaveRoom,
  onlineStatus = {},
  dmUserDetail,
  onBack,
}: ChatDetailPanelProps) {
  return (
    <div className="w-full bg-white border-l border-border p-4 space-y-6 overflow-y-auto min-w-0">
      {/* Back button — mobile only */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft className="size-4" />
          Back to chat
        </button>
      )}
      {activeTab === 'rooms' ? (
        <RoomDetails
          currentRoom={currentRoom}
          members={members}
          myWorkspaceRole={myWorkspaceRole}
          onInviteMember={onInviteMember}
          onRemoveMember={onRemoveMember}
          onLeaveRoom={onLeaveRoom}
        />
      ) : (
        <DMDetails
          currentDM={currentDM}
          onlineStatus={onlineStatus}
          dmUserDetail={dmUserDetail}
          messages={messages}
        />
      )}
    </div>
  );
}

/* ---- Room Detail sub-section ---- */
const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  MEMBER: 'Member',
};

function RoomDetails({
  currentRoom,
  members,
  myWorkspaceRole,
  onInviteMember,
  onRemoveMember,
  onLeaveRoom,
}: {
  currentRoom: ChatRoom | undefined;
  members: Member[];
  myWorkspaceRole: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  onInviteMember: () => void;
  onRemoveMember: (member: Member) => void;
  onLeaveRoom: () => void;
}) {
  const canRemove = myWorkspaceRole === 'OWNER';

  return (
    <>
      {/* Room Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium">Members ({members.length})</h3>
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
                <UserAvatar
                  displayName={member.name}
                  avatarUrl={member.avatarUrl}
                  size="md"
                />
                <span
                  className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                    member.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{member.name}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {member.customRoles && member.customRoles.length > 0 ? (
                    member.customRoles.map((cr) => (
                      <span
                        key={cr.id}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: cr.color }}
                        />
                        {cr.name}
                      </span>
                    ))
                  ) : (
                    <>
                      {member.role === 'OWNER' && (
                        <Crown className="size-3 text-yellow-600" />
                      )}
                      {member.role === 'ADMIN' && (
                        <Shield className="size-3 text-blue-600" />
                      )}
                      {member.role === 'MODERATOR' && (
                        <Shield className="size-3 text-purple-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {ROLE_LABEL[member.role] ?? member.role}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {/* ปุ่ม Remove — เห็นได้เฉพาะ OWNER และไม่ให้ลบตัวเอง/owner คนอื่น */}
              {canRemove && member.role !== 'OWNER' && (
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
function DMDetails({
  currentDM,
  onlineStatus,
  dmUserDetail,
  messages,
}: {
  currentDM: DirectMessage | undefined;
  onlineStatus: Record<string, boolean>;
  dmUserDetail?: WorkspaceMember | null;
  messages: Message[];
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOnline = currentDM ? (onlineStatus[currentDM.userId] ?? false) : false;

  // กรองเฉพาะ IMAGE messages ที่มี fileUrl
  const sharedImages = messages.filter((m) => m.type === 'IMAGE' && m.fileUrl);

  return (
    <>
      {/* DM User Info */}
      <div className="text-center">
        <div className="relative inline-block mb-3">
          <UserAvatar
            displayName={currentDM?.userName ?? ''}
            avatarUrl={currentDM?.avatarUrl}
            size="xl"
          />
          <span
            className={`absolute bottom-1 right-1 size-4 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        </div>
        <h3 className="text-base font-medium mb-0.5">{currentDM?.userName}</h3>
        <p className={`text-sm mb-4 ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
          {isOnline ? 'Active now' : 'Offline'}
        </p>

        {/* View Profile Toggle */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowProfile(!showProfile)}
        >
          <User className="size-4 mr-2" />
          View Profile
          {showProfile ? (
            <ChevronUp className="size-4 ml-auto" />
          ) : (
            <ChevronDown className="size-4 ml-auto" />
          )}
        </Button>
      </div>

      {/* Profile Details (expandable) */}
      {showProfile && (
        <div className="space-y-3 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Shield className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Role</p>
              {dmUserDetail?.customRoles && dmUserDetail.customRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {dmUserDetail.customRoles.map((cr) => (
                    <span
                      key={cr.id}
                      className="inline-flex items-center gap-1 text-sm"
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: cr.color }}
                      />
                      {cr.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm capitalize">{dmUserDetail?.role?.toLowerCase() ?? '—'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm">
                {dmUserDetail?.joinedAt
                  ? new Date(dmUserDetail.joinedAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shared Images */}
      <div>
        <h4 className="text-sm font-medium mb-3">Shared Images</h4>
        {sharedImages.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-xs">No images shared yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {sharedImages.map((m, idx) => (
              <button
                key={m.id}
                className="aspect-square overflow-hidden rounded-md block"
                onClick={() => setLightboxIndex(idx)}
              >
                <img
                  src={m.fileUrl ?? undefined}
                  alt={m.fileName ?? 'image'}
                  className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={sharedImages.map((m) => m.fileUrl!)}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
