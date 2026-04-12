// ===== Leave Room Dialog =====
// ใช้ ConfirmDialog แทนการเขียน Dialog ซ้ำ
import { useState } from 'react';
import { Hash, LogOut } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { ChatRoom } from '@/types/chat-ui';

interface LeaveRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoom: ChatRoom | undefined;
  onConfirm: () => Promise<void>;
}

export function LeaveRoomDialog({
  open,
  onOpenChange,
  currentRoom,
  onConfirm,
}: LeaveRoomDialogProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleConfirm = async () => {
    setIsLeaving(true);
    try {
      await onConfirm();
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Leave ${currentRoom?.name}`}
      description="Are you sure you want to leave this room?"
      warningMessage="You will no longer have access to this room's messages and files."
      warningNote="You can rejoin if you're invited again by a member."
      confirmLabel="Leave Room"
      confirmVariant="destructive"
      confirmIcon={<LogOut className="size-4" />}
      onConfirm={handleConfirm}
      loading={isLeaving}
    >
      {/* Room info card */}
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
        <div className="size-12 rounded-lg bg-[#003366] flex items-center justify-center shrink-0">
          <Hash className="size-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium">{currentRoom?.name}</p>
          <p className="text-xs text-muted-foreground">
            {currentRoom?.workspace}
          </p>
        </div>
      </div>
    </ConfirmDialog>
  );
}
