// ===== Remove Member Dialog =====
// ใช้ ConfirmDialog + UserAvatar แทนการเขียนซ้ำ
import { UserMinus } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StatusDot } from './StatusDot';
import type { ChatRoom, Member } from '@/types/chat-ui';

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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Remove Member from ${currentRoom?.name}`}
      description={`Are you sure you want to remove ${member?.name} from this room?`}
      confirmLabel="Remove Member"
      confirmVariant="destructive"
      confirmIcon={<UserMinus className="size-4" />}
      onConfirm={onConfirm}
    >
      {/* Member info */}
      {member && (
        <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
          <div className="relative shrink-0">
            <UserAvatar displayName={member.name} size="md" />
            <StatusDot status={member.status} />
          </div>
          <div>
            <p className="text-sm font-medium">{member.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {member.status}
            </p>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
