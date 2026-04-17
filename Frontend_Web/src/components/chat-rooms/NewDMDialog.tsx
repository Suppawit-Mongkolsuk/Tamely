// ===== New DM Dialog — เลือก user เพื่อเริ่ม Direct Message =====
import { useState, useEffect } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BRAND_CLASSNAMES } from '@/lib/constants';
import { workspaceService } from '@/services/workspace.service';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuthContext } from '@/contexts';
import type { WorkspaceMember } from '@/types/workspace';

interface NewDMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
}

export function NewDMDialog({ open, onOpenChange, onSelectUser }: NewDMDialogProps) {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentWorkspace?.id) return;
    setLoading(true);
    workspaceService
      .getMembers(currentWorkspace.id)
      .then((data) => setMembers(data))
      .catch((err) => {
        console.warn('[NewDMDialog] Failed to load workspace members:', err);
      })
      .finally(() => setLoading(false));
  }, [open, currentWorkspace?.id]);

  const filteredMembers = members.filter(
    (m) =>
      m.userId !== user?.id && // ไม่แสดงตัวเอง
      m.user.Name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (userId: string) => {
    onSelectUser(userId);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className={`size-5 ${BRAND_CLASSNAMES.tealText}`} />
            New Direct Message
          </DialogTitle>
          <DialogDescription>เลือก member ใน workspace เพื่อเริ่มสนทนา</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Member List */}
        <ScrollArea className="h-64">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">กำลังโหลด...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {searchQuery ? 'ไม่พบ member ที่ค้นหา' : 'ไม่มี member ใน workspace'}
            </p>
          ) : (
            <div className="space-y-1 p-1">
              {filteredMembers.map((member) => (
                <Button
                  key={member.userId}
                  variant="ghost"
                  onClick={() => handleSelect(member.userId)}
                  className={`w-full justify-start gap-3 h-auto py-2.5 px-3 ${BRAND_CLASSNAMES.tealTintHoverBg}`}
                >
                  <UserAvatar displayName={member.user.Name} size="md" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{member.user.Name}</p>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {member.role.toLowerCase()}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
