// ===== Management Dialogs =====
import { Mail, Plus, Hash, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

/* ---------- Invite Member Dialog ---------- */
interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={() => {
                onOpenChange(false);
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
  );
}

/* ---------- Create Room Dialog ---------- */
interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
}: CreateRoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={() => {
                onOpenChange(false);
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
  );
}

/* ---------- Create Role Dialog ---------- */
interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
}: CreateRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างยศใหม่</DialogTitle>
          <DialogDescription>กำหนดชื่อและสิทธิ์สำหรับยศใหม่</DialogDescription>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={() => {
                onOpenChange(false);
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
  );
}
