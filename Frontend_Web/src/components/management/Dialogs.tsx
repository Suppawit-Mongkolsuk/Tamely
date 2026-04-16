// ===== Management Dialogs =====
import { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, Hash, Save, Pencil, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { PERMISSION_OPTIONS } from '@/lib/permissions';
import type { WorkspaceMember, WorkspaceMemberRole } from '@/types';
import type { RoomMemberResponse, RoomResponse } from '@/services/chat.service';

/* ---------- Invite Member Dialog ---------- */
interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    email: string;
    role: Extract<WorkspaceMemberRole, 'ADMIN' | 'MEMBER'>;
  }) => Promise<void>;
  submitting?: boolean;
}

export function InviteDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting = false,
}: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<
    Extract<WorkspaceMemberRole, 'ADMIN' | 'MEMBER'>
  >('MEMBER');

  useEffect(() => {
    if (!open) {
      setEmail('');
      setRole('MEMBER');
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error('กรุณากรอกอีเมล');
      return;
    }

    await onSubmit({
      email: trimmedEmail,
      role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="invite-role">ยศ</Label>
            <Select
              value={role}
              onValueChange={(value) =>
                setRole(value as Extract<WorkspaceMemberRole, 'ADMIN' | 'MEMBER'>)
              }
              disabled={submitting}
            >
              <SelectTrigger id="invite-role" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              <Mail className="size-4 mr-2" />
              {submitting ? 'กำลังส่ง...' : 'ส่งคำเชิญ'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Room Form Dialog ---------- */
type RoomDialogSubmitData = {
  name: string;
  description?: string | null;
};

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  dialogDescription: string;
  submitLabel: string;
  submittingLabel: string;
  submitIcon: JSX.Element;
  initialValues?: {
    name?: string;
    description?: string | null;
  };
  onSubmit?: (data: RoomDialogSubmitData) => Promise<void>;
  submitting?: boolean;
}

function RoomFormDialog({
  open,
  onOpenChange,
  title,
  dialogDescription,
  submitLabel,
  submittingLabel,
  submitIcon,
  initialValues,
  onSubmit,
  submitting = false,
}: RoomFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setName(open ? initialValues?.name ?? '' : '');
    setDescription(open ? initialValues?.description ?? '' : '');
  }, [open, initialValues?.description, initialValues?.name]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('กรุณากรอกชื่อห้อง');
      return;
    }
    if (onSubmit) {
      const trimmedDescription = description.trim();
      await onSubmit({
        name: trimmedName,
        description: trimmedDescription.length > 0 ? trimmedDescription : null,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="room-name">ชื่อห้อง</Label>
            <Input
              id="room-name"
              placeholder="เช่น general, random"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="room-desc">คำอธิบาย</Label>
            <Textarea
              id="room-desc"
              placeholder="อธิบายวัตถุประสงค์ของห้อง..."
              className="mt-1.5"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitIcon}
              {submitting ? submittingLabel : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Create Room Dialog ---------- */
interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: RoomDialogSubmitData) => Promise<void>;
  submitting?: boolean;
}

export function CreateRoomDialog(props: CreateRoomDialogProps) {
  return (
    <RoomFormDialog
      {...props}
      title="สร้างห้องใหม่"
      dialogDescription="สร้างห้องแชทใหม่ใน workspace"
      submitLabel="สร้างห้อง"
      submittingLabel="กำลังสร้าง..."
      submitIcon={<Plus className="size-4 mr-2" />}
    />
  );
}

/* ---------- Edit Room Dialog ---------- */
interface EditRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    name?: string;
    description?: string | null;
  };
  onSubmit?: (data: RoomDialogSubmitData) => Promise<void>;
  submitting?: boolean;
}

export function EditRoomDialog(props: EditRoomDialogProps) {
  return (
    <RoomFormDialog
      {...props}
      title="แก้ไขห้อง"
      dialogDescription="อัปเดตชื่อห้อง คำอธิบาย และความเป็นส่วนตัว"
      submitLabel="บันทึกการแก้ไข"
      submittingLabel="กำลังบันทึก..."
      submitIcon={<Pencil className="size-4 mr-2" />}
    />
  );
}

/* ---------- Manage Room Members Dialog ---------- */
interface ManageRoomMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: RoomResponse | null;
  roomMembers: RoomMemberResponse[];
  workspaceMembers: WorkspaceMember[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
  processingUserId?: string | null;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

function roleBadgeClass(role?: string) {
  switch (role) {
    case 'OWNER':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ADMIN':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'MODERATOR':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function ManageRoomMembersDialog({
  open,
  onOpenChange,
  room,
  roomMembers,
  workspaceMembers,
  searchQuery,
  onSearchChange,
  loading = false,
  processingUserId = null,
  onAddMember,
  onRemoveMember,
}: ManageRoomMembersDialogProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const roomMemberIds = useMemo(
    () => new Set(roomMembers.map((member) => member.user.id)),
    [roomMembers],
  );

  const filteredRoomMembers = roomMembers.filter((member) =>
    member.user.Name.toLowerCase().includes(normalizedQuery),
  );

  const availableWorkspaceMembers = workspaceMembers
    .filter((member) => !roomMemberIds.has(member.userId))
    .filter((member) => member.user.Name.toLowerCase().includes(normalizedQuery));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>จัดการสมาชิกในห้อง</DialogTitle>
          <DialogDescription>
            {room ? `เพิ่มหรือนำสมาชิกออกจากห้อง #${room.name}` : 'จัดการสมาชิกภายในห้องนี้'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสมาชิก..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              disabled={loading}
            />
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-10">กำลังโหลดข้อมูลสมาชิก...</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">สมาชิกในห้อง</h3>
                    <p className="text-xs text-muted-foreground">สมาชิกปัจจุบัน {filteredRoomMembers.length} คน</p>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700">
                    {roomMembers.length} คน
                  </Badge>
                </div>
                <ScrollArea className="h-90">
                  <div className="space-y-2 p-3">
                    {filteredRoomMembers.length > 0 ? (
                      filteredRoomMembers.map((member) => (
                        <div
                          key={member.user.id}
                          className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
                        >
                          <UserAvatar
                            displayName={member.user.Name}
                            avatarUrl={member.user.avatarUrl}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{member.user.Name}</p>
                            <Badge
                              variant="outline"
                              className={`mt-1 ${roleBadgeClass(member.user.workspaceRole)}`}
                            >
                              {member.user.workspaceRole ?? 'MEMBER'}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => void onRemoveMember(member.user.id)}
                            disabled={processingUserId === member.user.id}
                          >
                            <UserMinus className="size-4 mr-2" />
                            {processingUserId === member.user.id ? 'กำลังนำออก...' : 'นำออก'}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="flex min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
                        <Users className="mb-2 size-10 opacity-20" />
                        <p className="text-sm">
                          {normalizedQuery ? 'ไม่พบสมาชิกในห้องที่ค้นหา' : 'ยังไม่มีสมาชิกในห้องนี้'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="rounded-xl border border-border bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">เพิ่มสมาชิกเข้าห้อง</h3>
                    <p className="text-xs text-muted-foreground">สมาชิกใน workspace ที่ยังไม่ได้อยู่ในห้อง</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {availableWorkspaceMembers.length} คน
                  </Badge>
                </div>
                <ScrollArea className="h-90">
                  <div className="space-y-2 p-3">
                    {availableWorkspaceMembers.length > 0 ? (
                      availableWorkspaceMembers.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
                        >
                          <UserAvatar
                            displayName={member.user.Name}
                            avatarUrl={member.user.avatarUrl}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{member.user.Name}</p>
                            <Badge
                              variant="outline"
                              className={`mt-1 ${roleBadgeClass(member.role)}`}
                            >
                              {member.role}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90 text-white"
                            onClick={() => void onAddMember(member.userId)}
                            disabled={processingUserId === member.userId}
                          >
                            <UserPlus className="size-4 mr-2" />
                            {processingUserId === member.userId ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="flex min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
                        <Users className="mb-2 size-10 opacity-20" />
                        <p className="text-sm">
                          {normalizedQuery ? 'ไม่พบสมาชิกที่ค้นหา' : 'สมาชิกใน workspace ถูกเพิ่มเข้าห้องครบแล้ว'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Create Role Dialog ---------- */
interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    name: string;
    color: string;
    permissions: string[];
  }) => Promise<void>;
  submitting?: boolean;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting = false,
}: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setName('');
      setColor('#6B7280');
      setPermissions([]);
    }
  }, [open]);

  const togglePermission = (permission: string, checked: boolean) => {
    setPermissions((prev) =>
      checked ? [...prev, permission] : prev.filter((value) => value !== permission),
    );
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('กรุณากรอกชื่อยศ');
      return;
    }

    await onSubmit({
      name: trimmedName,
      color,
      permissions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>สร้างยศใหม่</DialogTitle>
          <DialogDescription>กำหนดชื่อและสิทธิ์สำหรับยศใหม่</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="role-name">ชื่อยศ</Label>
            <Input
              id="role-name"
              placeholder="เช่น Developer, Designer"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="role-color">สี</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="role-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 shrink-0"
                disabled={submitting}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label>สิทธิ์</Label>
            <div className="mt-2 rounded-lg border border-border overflow-y-auto max-h-[40vh]">
              <div className="p-1 space-y-1">
                {PERMISSION_OPTIONS.map((permission) => (
                  <div
                    key={permission.value}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{permission.label}</span>
                    <Switch
                      checked={permissions.includes(permission.value)}
                      onCheckedChange={(checked) => togglePermission(permission.value, checked)}
                      disabled={submitting}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            <Save className="size-4 mr-2" />
            {submitting ? 'กำลังสร้าง...' : 'สร้างยศ'}
          </Button>
        </div>
      </DialogContent>

    </Dialog>
  );
}

// ===== Edit Role Dialog =====
interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { name?: string; color?: string; permissions?: string[] };
  onSubmit?: (data: { name: string; color: string; permissions: string[] }) => Promise<void>;
  submitting?: boolean;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  submitting = false,
}: EditRoleDialogProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [color, setColor] = useState(initialValues?.color ?? '#6B7280');
  const [permissions, setPermissions] = useState<string[]>(initialValues?.permissions ?? []);

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '');
      setColor(initialValues?.color ?? '#6B7280');
      setPermissions(initialValues?.permissions ?? []);
    }
  }, [open, initialValues?.name, initialValues?.color, initialValues?.permissions]);

  const togglePermission = (permission: string, checked: boolean) => {
    setPermissions((prev) =>
      checked ? [...prev, permission] : prev.filter((value) => value !== permission),
    );
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('กรุณากรอกชื่อยศ');
      return;
    }

    await onSubmit({ name: trimmedName, color, permissions });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>แก้ไขยศ</DialogTitle>
          <DialogDescription>แก้ไขชื่อ สี และสิทธิ์สำหรับยศนี้</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="edit-role-name">ชื่อยศ</Label>
            <Input
              id="edit-role-name"
              placeholder="เช่น Developer, Designer"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="edit-role-color">สี</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="edit-role-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 shrink-0"
                disabled={submitting}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label>สิทธิ์</Label>
            <div className="mt-2 rounded-lg border border-border overflow-y-auto max-h-[40vh]">
              <div className="p-1 space-y-1">
                {PERMISSION_OPTIONS.map((permission) => (
                  <div
                    key={permission.value}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{permission.label}</span>
                    <Switch
                      checked={permissions.includes(permission.value)}
                      onCheckedChange={(checked) => togglePermission(permission.value, checked)}
                      disabled={submitting}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            <Save className="size-4 mr-2" />
            {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
