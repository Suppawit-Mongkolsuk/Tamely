// ===== Create Room Dialog =====
import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { BRAND_CLASSNAMES, GRADIENT } from '@/lib/constants';

// ยศทั้งหมดที่มีในระบบ
const ROLES = [
  { value: 'OWNER',     label: 'Owner' },
  { value: 'ADMIN',     label: 'Admin' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'MEMBER',    label: 'Member' },
] as const;

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (name: string, allowedRoles: string[]) => Promise<void>;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  onCreateRoom,
}: CreateRoomDialogProps) {
  const [name, setName] = useState('');
  const [isAll, setIsAll] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleReset = () => {
    setName('');
    setIsAll(true);
    setSelectedRoles([]);
    setError('');
  };

  const handleClose = (open: boolean) => {
    if (!open) handleReset();
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('กรุณากรอกชื่อห้อง'); return; }

    setError('');
    setIsSubmitting(true);
    try {
      // ALL → ส่ง [] (backend ตีความว่าทุกคนเข้าได้)
      const roles = isAll ? [] : selectedRoles;
      await onCreateRoom(trimmed, roles);
      handleReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สร้างห้องไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm text-muted-foreground"
        >
          <div className={`size-8 rounded-lg ${BRAND_CLASSNAMES.tealBg} flex items-center justify-center shrink-0`}>
            <Plus className="size-4 text-white" />
          </div>
          <span>Create New Room</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>Set up a new chat room for your team</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Room Name */}
          <div>
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="e.g., Project Updates"
              className="mt-1.5"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Role Access */}
          <div>
            <Label>Who can access this room?</Label>
            <p className="text-xs text-muted-foreground mb-2.5">
              เลือกยศที่สามารถเห็นและเข้าห้องนี้ได้
            </p>

            {/* ALL option */}
            <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 ${BRAND_CLASSNAMES.tealBorder} bg-[#5EBCAD]/5 cursor-pointer mb-2`}>
              <input
                type="checkbox"
                checked={isAll}
                onChange={(e) => {
                  setIsAll(e.target.checked);
                  if (e.target.checked) setSelectedRoles([]);
                }}
                className="rounded accent-[#5EBCAD]"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-medium">All Members</span>
                <p className="text-xs text-muted-foreground">ทุกคนใน workspace เข้าได้ (ค่าเริ่มต้น)</p>
              </div>
            </label>

            {/* Individual roles */}
            <div className={`grid grid-cols-2 gap-2 transition-opacity ${isAll ? 'opacity-40 pointer-events-none' : ''}`}>
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    !isAll && selectedRoles.includes(role.value)
                      ? 'border-[#46769B] bg-[#46769B]/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!isAll && selectedRoles.includes(role.value)}
                    onChange={() => { if (!isAll) toggleRole(role.value); }}
                    className="rounded accent-[#46769B]"
                    disabled={isAll || isSubmitting}
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>

            {/* Validation: ถ้า isAll = false ต้องเลือกอย่างน้อย 1 */}
            {!isAll && selectedRoles.length === 0 && (
              <p className="text-xs text-amber-500 mt-1.5">
                กรุณาเลือกอย่างน้อย 1 ยศ หรือเลือก All Members
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className={`${GRADIENT.tealToBlueLinear} hover:opacity-90 text-white`}
              onClick={handleSubmit}
              disabled={isSubmitting || (!isAll && selectedRoles.length === 0)}
            >
              {isSubmitting ? (
                <><Loader2 className="size-4 mr-2 animate-spin" />Creating...</>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
