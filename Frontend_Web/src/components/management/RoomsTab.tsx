// ===== Rooms Tab =====
import { useState } from 'react';
import {
  Search,
  Plus,
  Hash,
  Lock,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RoomResponse } from '@/services/chat.service';

interface RoomsTabProps {
  rooms: RoomResponse[];
  isLoading?: boolean;
  onCreateRoom: () => void;
  onManageMembers?: (roomId: string) => void;
  onEditRoom?: (roomId: string) => void;
  onDeleteRoom?: (roomId: string) => void;
}

function formatCreatedAt(dateStr: string) {
  return new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function RoomsTab({
  rooms,
  isLoading,
  onCreateRoom,
  onManageMembers,
  onEditRoom,
  onDeleteRoom,
}: RoomsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาห้อง..."
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90 shrink-0"
          onClick={onCreateRoom}
        >
          <Plus className="size-4 mr-2" />
          สร้างห้อง
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-12">
          {searchQuery ? 'ไม่พบห้องที่ค้นหา' : 'ยังไม่มีห้องแชทใน workspace นี้'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className="p-5 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 rounded-lg bg-[#003366] flex items-center justify-center text-white shrink-0">
                    <Hash className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-1 truncate">{room.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {room.description?.trim() ? room.description : '—'}
                    </p>
                  </div>
                </div>
                {(onManageMembers || onEditRoom || onDeleteRoom) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onManageMembers && (
                        <DropdownMenuItem onClick={() => onManageMembers(room.id)}>
                          <Users className="size-4 mr-2" />
                          จัดการสมาชิก
                        </DropdownMenuItem>
                      )}
                      {onManageMembers && (onEditRoom || onDeleteRoom) && <DropdownMenuSeparator />}
                      {onEditRoom && (
                        <DropdownMenuItem onClick={() => onEditRoom(room.id)}>
                          <Pencil className="size-4 mr-2" />
                          แก้ไขห้อง
                        </DropdownMenuItem>
                      )}
                      {onEditRoom && onDeleteRoom && <DropdownMenuSeparator />}
                      {onDeleteRoom && (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => onDeleteRoom(room.id)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          ลบห้อง
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className={
                    !room.isPrivate
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }
                >
                  {!room.isPrivate ? (
                    <>
                      <Hash className="size-3 mr-1" />
                      สาธารณะ
                    </>
                  ) : (
                    <>
                      <Lock className="size-3 mr-1" />
                      ส่วนตัว
                    </>
                  )}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  • สร้างเมื่อ {formatCreatedAt(room.createdAt)}
                </span>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-4" />
                  <span className="text-xs">สมาชิก</span>
                  <span className="text-sm font-medium text-foreground ml-1">{room.memberCount}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
