// ===== Leave Room Dialog =====
import { AlertTriangle, Hash, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ChatRoom } from './types';

interface LeaveRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoom: ChatRoom | undefined;
  onConfirm: () => void;
}

export function LeaveRoomDialog({
  open,
  onOpenChange,
  currentRoom,
  onConfirm,
}: LeaveRoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Leave {currentRoom?.name}</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this room?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-900 mb-1">
                You will no longer have access to this room's messages and
                files.
              </p>
              <p className="text-xs text-amber-700">
                You can rejoin if you're invited again by a member.
              </p>
            </div>
          </div>

          {/* Room Info */}
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="size-12 rounded-lg bg-[#003366] flex items-center justify-center">
              <Hash className="size-6 text-white" />
            </div>
            <div>
              <p className="text-sm">{currentRoom?.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentRoom?.workspace}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onConfirm}
            >
              <LogOut className="size-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
