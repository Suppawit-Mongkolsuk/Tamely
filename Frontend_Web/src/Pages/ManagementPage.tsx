import React, { useState } from 'react';
import {
  Plus,
  Users,
  Settings,
  MessageSquare,
  Shield,
  Crown,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  Upload,
  Image as ImageIcon,
  Mail,
  UserCog,
  Hash,
  Lock,
  Save,
  Check,
  X,
  Search,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Separator } from '../components/ui/separator';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  members: number;
  messages: number;
  privacy: 'public' | 'private';
  created: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

export function ManagementPage() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);

  // Mock data
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      role: 'Admin',
      status: 'active',
      joinDate: 'Jan 2024',
      avatar: 'SJ',
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.c@company.com',
      role: 'Moderator',
      status: 'active',
      joinDate: 'Feb 2024',
      avatar: 'MC',
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma.w@company.com',
      role: 'Member',
      status: 'active',
      joinDate: 'Jan 2024',
      avatar: 'EW',
    },
    {
      id: '4',
      name: 'John Doe',
      email: 'john.d@company.com',
      role: 'Admin',
      status: 'active',
      joinDate: 'Dec 2023',
      avatar: 'JD',
    },
    {
      id: '5',
      name: 'Lisa Anderson',
      email: 'lisa.a@company.com',
      role: 'Member',
      status: 'inactive',
      joinDate: 'Mar 2024',
      avatar: 'LA',
    },
  ]);

  const [rooms] = useState<Room[]>([
    {
      id: '1',
      name: 'General',
      description: 'Main discussion channel',
      members: 24,
      messages: 542,
      privacy: 'public',
      created: '3 months ago',
    },
    {
      id: '2',
      name: 'Code Reviews',
      description: 'Share and review code',
      members: 18,
      messages: 324,
      privacy: 'private',
      created: '2 months ago',
    },
    {
      id: '3',
      name: 'Design Reviews',
      description: 'Design feedback and critiques',
      members: 12,
      messages: 456,
      privacy: 'public',
      created: '4 months ago',
    },
    {
      id: '4',
      name: 'Marketing',
      description: 'Marketing campaigns and strategy',
      members: 15,
      messages: 289,
      privacy: 'private',
      created: '2 months ago',
    },
  ]);

  const [roles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      color: '#F59E0B',
      permissions: [
        'manage_workspace',
        'manage_users',
        'manage_rooms',
        'manage_roles',
      ],
    },
    {
      id: '2',
      name: 'Moderator',
      color: '#3B82F6',
      permissions: ['manage_rooms', 'delete_messages', 'kick_users'],
    },
    {
      id: '3',
      name: 'Member',
      color: '#6B7280',
      permissions: ['send_messages', 'create_threads'],
    },
    {
      id: '4',
      name: 'Guest',
      color: '#9CA3AF',
      permissions: ['read_only'],
    },
  ]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Crown className="size-4 text-yellow-500" />;
      case 'Moderator':
        return <Shield className="size-4 text-blue-500" />;
      default:
        return <UserCog className="size-4 text-gray-500" />;
    }
  };

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

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="ค้นหาสมาชิก..." className="pl-10 bg-white" />
            </div>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={() => setShowInviteDialog(true)}
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
                  {teamMembers.map((member) => (
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
                              <SelectItem value="moderator">
                                Moderator
                              </SelectItem>
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
            <p>แสดง {teamMembers.length} สมาชิก</p>
            <p>
              ใช้งาน: {teamMembers.filter((m) => m.status === 'active').length}{' '}
              | ไม่ใช้งาน:{' '}
              {teamMembers.filter((m) => m.status === 'inactive').length}
            </p>
          </div>
        </TabsContent>

        {/* Rooms Management Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="ค้นหาห้อง..." className="pl-10 bg-white" />
            </div>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={() => setShowCreateRoomDialog(true)}
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
        </TabsContent>

        {/* Workspace Settings Tab */}
        <TabsContent value="workspace" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card className="p-6 bg-white">
              <h3 className="mb-4">ข้อมูลทั่วไป</h3>

              <div className="space-y-4">
                {/* Workspace Icon */}
                <div>
                  <Label>ไอคอน Workspace</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="size-20 rounded-xl bg-[#003366] flex items-center justify-center text-white text-2xl">
                      E
                    </div>
                    <div>
                      <Button variant="outline" size="sm" className="mb-2">
                        <Upload className="size-4 mr-2" />
                        อัปโหลดรูป
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        แนะนำขนาด 256x256px, PNG หรือ JPG
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Workspace Name */}
                <div>
                  <Label htmlFor="workspace-name">ชื่อ Workspace</Label>
                  <Input
                    id="workspace-name"
                    defaultValue="Engineering Team"
                    className="mt-1.5"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="workspace-desc">คำอธิบาย</Label>
                  <Textarea
                    id="workspace-desc"
                    defaultValue="Development and technical discussions"
                    className="mt-1.5"
                    rows={3}
                  />
                </div>

                {/* Workspace URL */}
                <div>
                  <Label htmlFor="workspace-url">URL Workspace</Label>
                  <div className="flex gap-2 mt-1.5">
                    <span className="inline-flex items-center px-3 rounded-lg border border-border bg-muted text-sm text-muted-foreground">
                      tamelychat.com/
                    </span>
                    <Input
                      id="workspace-url"
                      defaultValue="engineering"
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button className="w-full bg-[#5EBCAD] hover:bg-[#5EBCAD]/90">
                  <Save className="size-4 mr-2" />
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </div>
            </Card>

            {/* Roles & Permissions */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3>ยศและสิทธิ์</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateRoleDialog(true)}
                >
                  <Plus className="size-4 mr-2" />
                  สร้างยศ
                </Button>
              </div>

              <div className="space-y-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-lg border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {role.permissions.length} สิทธิ์
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((perm, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {perm.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Additional Settings */}
          <Card className="p-6 bg-white">
            <h3 className="mb-4">การตั้งค่าเพิ่มเติม</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">อนุญาตให้สมาชิกเชิญคนอื่น</p>
                  <p className="text-sm text-muted-foreground">
                    สมาชิกสามารถสร้างลิงก์เชิญและเชิญคนอื่นเข้า workspace
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">อนุญาตให้สมาชิกสร้างห้องได้</p>
                  <p className="text-sm text-muted-foreground">
                    สมาชิกสามารถสร้างห้องแชทใหม่ได้เอง
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">แสดงสถานะออนไลน์</p>
                  <p className="text-sm text-muted-foreground">
                    แสดงว่าสมาชิกกำลังออนไลน์หรือไม่
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">เปิดใช้งาน AI Assistant</p>
                  <p className="text-sm text-muted-foreground">
                    ให้ AI ช่วยสรุปการสนทนาและสร้าง tasks อัตโนมัติ
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เชิญสมาชิกใหม่</DialogTitle>
            <DialogDescription>
              ส่งคำเชิญให้เพื่อนร่วมงานเข้าร่วม workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="invite-email">อีเมล</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="email@company.com"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="invite-role">ยศ</Label>
              <Select defaultValue="member">
                <SelectTrigger id="invite-role" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invite-message">ข้อความ (ไม่บังคับ)</Label>
              <Textarea
                id="invite-message"
                placeholder="เชิญคุณเข้าร่วม workspace..."
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
                onClick={() => {
                  setShowInviteDialog(false);
                  toast.success('ส่งคำเชิญสำเร็จ!');
                }}
              >
                <Mail className="size-4 mr-2" />
                ส่งคำเชิญ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Room Dialog */}
      <Dialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างห้องใหม่</DialogTitle>
            <DialogDescription>สร้างห้องแชทใหม่ใน workspace</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="room-name">ชื่อห้อง</Label>
              <Input
                id="room-name"
                placeholder="เช่น general, random"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="room-desc">คำอธิบาย</Label>
              <Textarea
                id="room-desc"
                placeholder="อธิบายวัตถุประสงค์ของห้อง..."
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="room-privacy">ความเป็นส่วนตัว</Label>
              <Select defaultValue="public">
                <SelectTrigger id="room-privacy" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Hash className="size-4" />
                      <span>สาธารณะ - ทุกคนในworkspace สามารถดูได้</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4" />
                      <span>ส่วนตัว - เฉพาะคนที่ได้รับเชิญเท่านั้น</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateRoomDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
                onClick={() => {
                  setShowCreateRoomDialog(false);
                  toast.success('สร้างห้องสำเร็จ!');
                }}
              >
                <Plus className="size-4 mr-2" />
                สร้างห้อง
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog
        open={showCreateRoleDialog}
        onOpenChange={setShowCreateRoleDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างยศใหม่</DialogTitle>
            <DialogDescription>
              กำหนดชื่อและสิทธิ์สำหรับยศใหม่
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="role-name">ชื่อยศ</Label>
              <Input
                id="role-name"
                placeholder="เช่น Developer, Designer"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="role-color">สี</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="role-color"
                  type="color"
                  defaultValue="#6B7280"
                  className="w-20"
                />
                <Input defaultValue="#6B7280" className="flex-1" />
              </div>
            </div>

            <div>
              <Label>สิทธิ์</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm">จัดการ workspace</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm">จัดการสมาชิก</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm">จัดการห้อง</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm">ลบข้อความ</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm">ส่งข้อความ</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateRoleDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
                onClick={() => {
                  setShowCreateRoleDialog(false);
                  toast.success('สร้างยศสำเร็จ!');
                }}
              >
                <Save className="size-4 mr-2" />
                สร้างยศ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
