// ===== Chat Sidebar — Room/DM list =====
import { Search, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StatusDot } from './StatusDot';
import { CreateRoomDialog } from './CreateRoomDialog';
import type { ChatRoom, DirectMessage, ChatTab } from '@/types/chat-ui';
import type { WorkspaceMember } from '@/types/workspace';

interface ChatSidebarProps {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  rooms: ChatRoom[];
  directMessages: DirectMessage[];
  workspaceMembers: WorkspaceMember[];
  onlineStatus: Record<string, boolean>;
  selectedRoom: string;
  selectedDM: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectRoom: (id: string) => void;
  onSelectDM: (id: string) => void;
  isCreateRoomOpen: boolean;
  onCreateRoomOpenChange: (open: boolean) => void;
  onOpenDMWithUser: (userId: string) => void;
}

export function ChatSidebar({
  activeTab,
  onTabChange,
  rooms,
  directMessages,
  workspaceMembers,
  onlineStatus,
  selectedRoom,
  selectedDM,
  searchQuery,
  onSearchChange,
  onSelectRoom,
  onSelectDM,
  isCreateRoomOpen,
  onCreateRoomOpenChange,
  onOpenDMWithUser,
}: ChatSidebarProps) {
  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ใน DM tab ให้ filter จาก workspaceMembers ทุกคน
  // แต่ถ้ามี conversation แล้วให้แสดง last message ด้วย
  const filteredMembers = workspaceMembers.filter((m) =>
    m.user.Name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Map userId → conversation (สำหรับดึง lastMessage + unread)
  const convByUserId = new Map(directMessages.map((dm) => [dm.userId, dm]));

  // เรียงให้คนที่มี conversation ล่าสุดขึ้นก่อน จากนั้น online ขึ้นก่อน
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const convA = convByUserId.get(a.userId);
    const convB = convByUserId.get(b.userId);
    if (convA && !convB) return -1;
    if (!convA && convB) return 1;
    if (convA && convB) {
      return (convB.lastMessageTime || '').localeCompare(convA.lastMessageTime || '');
    }
    // ถ้าไม่มี conv ให้ online ขึ้นก่อน
    const onA = onlineStatus[a.userId] ? 1 : 0;
    const onB = onlineStatus[b.userId] ? 1 : 0;
    return onB - onA;
  });

  return (
    <div className="w-80 bg-white border-r border-border flex flex-col">
      {/* Tabs */}
      <div className="p-4 border-b border-border">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ChatTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms" className="gap-2">
              <Hash className="size-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="dms" className="gap-2">
              <Search className="size-4" />
              Messages
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'rooms' ? 'Search rooms...' : 'Search people...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {activeTab === 'rooms' ? (
            <>
              <CreateRoomDialog open={isCreateRoomOpen} onOpenChange={onCreateRoomOpenChange} />
              {filteredRooms.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  onClick={() => onSelectRoom(room.id)}
                  className={`w-full h-auto text-left px-3 py-2.5 rounded-lg transition-colors justify-start ${
                    selectedRoom === room.id
                      ? 'bg-[#5EBCAD]/10 border-l-2 border-[#5EBCAD]'
                      : ''
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Hash className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium text-sm">{room.name}</span>
                      </div>
                      {room.unread > 0 && (
                        <Badge className="bg-[#5EBCAD] text-white shrink-0 text-xs px-1.5">
                          {room.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate pl-6">{room.lastMessage}</p>
                  </div>
                </Button>
              ))}
            </>
          ) : (
            <>
              {sortedMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No members in this workspace
                </p>
              ) : (
                sortedMembers.map((member) => {
                  const conv = convByUserId.get(member.userId);
                  const isSelected = conv ? selectedDM === conv.id : false;
                  const online = onlineStatus[member.userId] ?? false;

                  return (
                    <button
                      key={member.userId}
                      onClick={() =>
                        conv ? onSelectDM(conv.id) : onOpenDMWithUser(member.userId)
                      }
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left
                        hover:bg-gray-50 active:scale-[0.98]
                        ${isSelected ? 'bg-[#5EBCAD]/10 border-l-2 border-[#5EBCAD]' : ''}
                      `}
                    >
                      {/* Avatar + Status */}
                      <div className="relative shrink-0">
                        <UserAvatar displayName={member.user.Name} size="md" />
                        {/* status dot — แบบ IG: dot เล็กๆ ด้านล่างขวา */}
                        <span
                          className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white
                            ${online ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium truncate">{member.user.Name}</span>
                          {(conv?.unread ?? 0) > 0 && (
                            <span className="bg-[#5EBCAD] text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 shrink-0">
                              {conv!.unread}
                            </span>
                          )}
                        </div>
                        {/* last message หรือ online status */}
                        {conv?.lastMessage ? (
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs truncate ${(conv?.unread ?? 0) > 0 ? 'text-gray-800 font-medium' : 'text-muted-foreground'}`}>
                              {conv.lastMessage}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {conv.lastMessageTime}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {online ? 'Active now' : 'Offline'}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

