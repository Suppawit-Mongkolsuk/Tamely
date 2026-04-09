// ===== Chat Sidebar — Room/DM list =====
import { Search, Hash, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StatusDot } from './StatusDot';
import { CreateRoomDialog } from './CreateRoomDialog';
import type { ChatRoom, DirectMessage, ChatTab } from '@/types/chat-ui';

interface ChatSidebarProps {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  rooms: ChatRoom[];
  directMessages: DirectMessage[];
  selectedRoom: string;
  selectedDM: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectRoom: (id: string) => void;
  onSelectDM: (id: string) => void;
  isCreateRoomOpen: boolean;
  onCreateRoomOpenChange: (open: boolean) => void;
}

export function ChatSidebar({
  activeTab,
  onTabChange,
  rooms,
  directMessages,
  selectedRoom,
  selectedDM,
  searchQuery,
  onSearchChange,
  onSelectRoom,
  onSelectDM,
  isCreateRoomOpen,
  onCreateRoomOpenChange,
}: ChatSidebarProps) {
  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredDMs = directMessages.filter((dm) =>
    dm.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-80 bg-white border-r border-border flex flex-col">
      {/* Tabs */}
      <div className="p-4 border-b border-border">
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as ChatTab)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms" className="gap-2">
              <Hash className="size-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="dms" className="gap-2">
              <MessageCircle className="size-4" />
              Direct Messages
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === 'rooms' ? 'Search rooms...' : 'Search people...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {activeTab === 'rooms' ? (
            <>
              {/* Create Room Button */}
              <CreateRoomDialog
                open={isCreateRoomOpen}
                onOpenChange={onCreateRoomOpenChange}
              />

              {/* Room List */}
              {filteredRooms.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  onClick={() => onSelectRoom(room.id)}
                  className={`w-full h-auto text-left px-3 py-2.5 rounded-lg transition-colors justify-start ${
                    selectedRoom === room.id && activeTab === 'rooms'
                      ? 'bg-[#5EBCAD]/10 border-l-2 border-[#5EBCAD]'
                      : ''
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Hash className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{room.name}</span>
                      </div>
                      {room.unread > 0 && (
                        <Badge className="bg-[#5EBCAD] text-white shrink-0">
                          {room.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate pl-6">
                      {room.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-1 pl-6">
                      <span className="text-xs text-muted-foreground">
                        {room.workspace}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {room.lastMessageTime}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
            </>
          ) : (
            <>
              {/* DM List */}
              {filteredDMs.map((dm) => (
                <Button
                  key={dm.id}
                  variant="ghost"
                  onClick={() => onSelectDM(dm.id)}
                  className={`w-full h-auto text-left px-3 py-2.5 rounded-lg transition-colors justify-start ${
                    selectedDM === dm.id && activeTab === 'dms'
                      ? 'bg-[#5EBCAD]/10 border-l-2 border-[#5EBCAD]'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative shrink-0">
                      <UserAvatar displayName={dm.userName} size="md" />
                      <StatusDot status={dm.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="truncate">{dm.userName}</span>
                        {dm.unread > 0 && (
                          <Badge className="bg-[#5EBCAD] text-white shrink-0">
                            {dm.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {dm.lastMessage}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {dm.lastMessageTime}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
