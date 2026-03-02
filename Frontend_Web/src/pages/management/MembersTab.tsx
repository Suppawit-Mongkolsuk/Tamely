// ===== Members Tab =====
import {
  Search,
  Crown,
  Shield,
  UserCog,
  UserPlus,
  MoreVertical,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeamMember } from './types';

function getRoleIcon(role: string) {
  switch (role) {
    case 'Admin':
      return <Crown className="size-4 text-yellow-500" />;
    case 'Moderator':
      return <Shield className="size-4 text-blue-500" />;
    default:
      return <UserCog className="size-4 text-gray-500" />;
  }
}

interface MembersTabProps {
  members: TeamMember[];
  onInvite: () => void;
}

export function MembersTab({ members, onInvite }: MembersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="ค้นหาสมาชิก..." className="pl-10 bg-white" />
        </div>
        <Button
          className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
          onClick={onInvite}
        >
          <UserPlus className="size-4 mr-2" />
          เชิญสมาชิก
        </Button>
      </div>

      <Card className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-6 py-4">สมาชิก</th>
                <th className="text-left px-6 py-4">ยศ</th>
                <th className="text-left px-6 py-4">สถานะ</th>
                <th className="text-left px-6 py-4">เข้าร่วมเมื่อ</th>
                <th className="text-right px-6 py-4">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={
                        member.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }
                    >
                      {member.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {member.joinDate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Select defaultValue={member.role.toLowerCase()}>
                        <SelectTrigger className="w-32 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>แสดง {members.length} สมาชิก</p>
        <p>
          ใช้งาน: {members.filter((m) => m.status === 'active').length} |
          ไม่ใช้งาน: {members.filter((m) => m.status === 'inactive').length}
        </p>
      </div>
    </div>
  );
}
