// ===== Remove Member Dialog =====
import { UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ChatRoom, Member } from './types';

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoom: ChatRoom | undefined;
  member: Member | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  currentRoom,
  member,
  onConfirm,
  onCancel,
}: RemoveMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Remove Member from {currentRoom?.name}</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {member?.name} from this room?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* User Info */}
          {member && (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                  {member.avatar}
                </div>
                <div
                  className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                    member.status === 'online'
                      ? 'bg-green-500'
                      : member.status === 'away'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm">{member.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {member.status}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onConfirm}
            >
              <UserMinus className="size-4 mr-2" />
              Remove Member
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
