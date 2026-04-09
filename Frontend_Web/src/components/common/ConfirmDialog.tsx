// ===== ConfirmDialog — shared destructive/confirm dialog =====
// ใช้แทน LeaveRoomDialog / RemoveMemberDialog / WorkspaceSettings confirm
// ที่มี pattern เหมือนกัน: title + description + warning box + Cancel/Confirm buttons

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** หัวข้อ dialog */
  title: string;
  /** คำอธิบายสั้น ๆ ใต้หัวข้อ */
  description?: string;
  /** ข้อความ warning สีส้ม (ถ้าไม่ระบุ จะไม่แสดง warning box) */
  warningMessage?: string;
  /** ข้อความเสริมใน warning box */
  warningNote?: string;
  /** label ปุ่ม confirm (default: "Confirm") */
  confirmLabel?: string;
  /** label ปุ่ม cancel (default: "Cancel") */
  cancelLabel?: string;
  /** variant ของปุ่ม confirm: destructive = แดง, primary = สีหลัก */
  confirmVariant?: 'destructive' | 'primary';
  /** icon ข้าง ๆ ปุ่ม confirm */
  confirmIcon?: React.ReactNode;
  /** callback เมื่อกด confirm */
  onConfirm: () => void;
  /** content พิเศษที่ต้องการแสดงระหว่าง warning กับ footer (เช่น info card) */
  children?: React.ReactNode;
  /** ปิดการใช้งานปุ่ม confirm */
  disabled?: boolean;
  /** loading state ของปุ่ม confirm */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  warningMessage,
  warningNote,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  confirmIcon,
  onConfirm,
  children,
  disabled = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Warning box */}
          {warningMessage && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-900">{warningMessage}</p>
                {warningNote && (
                  <p className="text-xs text-amber-700 mt-1">{warningNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Slot for custom content (e.g., user card, room info) */}
          {children}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant === 'destructive' ? 'destructive' : 'default'}
            className={cn(
              confirmVariant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#5EBCAD] hover:bg-[#5EBCAD]/90 text-white',
            )}
            onClick={onConfirm}
            disabled={disabled || loading}
          >
            {confirmIcon && (
              <span className="mr-2 inline-flex">{confirmIcon}</span>
            )}
            {loading ? 'กำลังดำเนินการ...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
