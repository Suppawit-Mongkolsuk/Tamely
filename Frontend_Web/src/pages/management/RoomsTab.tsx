// ===== Rooms Tab =====
import {
  Search,
  Plus,
  Hash,
  Lock,
  Users,
  MessageSquare,
  Settings,
  UserPlus,
  MoreVertical,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Room } from './types';

interface RoomsTabProps {
  rooms: Room[];
  onCreateRoom: () => void;
}

export function RoomsTab({ rooms, onCreateRoom }: RoomsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="ค้นหาห้อง..." className="pl-10 bg-white" />
        </div>
        <Button
          className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
          onClick={onCreateRoom}
        >
          <Plus className="size-4 mr-2" />
          สร้างห้อง
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <Card
            key={room.id}
            className="p-5 bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-lg bg-[#003366] flex items-center justify-center text-white">
                  <Hash className="size-6" />
                </div>
                <div>
                  <h3 className="mb-1">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {room.description}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className={
                  room.privacy === 'public'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }
              >
                {room.privacy === 'public' ? (
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
                • สร้างเมื่อ {room.created}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mb-4">
              <div>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="size-4" />
                  <span className="text-xs">สมาชิก</span>
                </div>
                <p>{room.members}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <MessageSquare className="size-4" />
                  <span className="text-xs">ข้อความ</span>
                </div>
                <p>{room.messages}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="size-4 mr-2" />
                ตั้งค่า
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <UserPlus className="size-4 mr-2" />
                เชิญสมาชิก
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
