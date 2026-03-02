// ===== Invite Member Dialog =====
import { Search, UserPlus, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ChatRoom } from './types';

interface AvailableUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
}

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoom: ChatRoom | undefined;
  availableUsers: AvailableUser[];
  selectedUsers: string[];
  onToggleUser: (userId: string) => void;
  onClearSelection: () => void;
  onInvite: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  currentRoom,
  availableUsers,
  selectedUsers,
  onToggleUser,
  onClearSelection,
  onInvite,
  searchQuery,
  onSearchChange,
}: InviteMemberDialogProps) {
  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Invite Members to {currentRoom?.name}</DialogTitle>
          <DialogDescription>
            Select team members to invite to this room
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-[#5EBCAD]/10 rounded-lg">
              <UserPlus className="size-4 text-[#5EBCAD]" />
              <span className="text-sm">
                {selectedUsers.length} member
                {selectedUsers.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {/* User List */}
          <ScrollArea className="h-75 pr-3">
            <div className="space-y-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onToggleUser(user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      selectedUsers.includes(user.id)
                        ? 'bg-[#5EBCAD]/10 border-2 border-[#5EBCAD]'
                        : 'border-2 border-transparent hover:bg-muted'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                        {user.avatar}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                          user.status === 'online'
                            ? 'bg-green-500'
                            : user.status === 'away'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.status}
                      </p>
                    </div>
                    <div
                      className={`size-5 rounded border-2 flex items-center justify-center ${
                        selectedUsers.includes(user.id)
                          ? 'bg-[#5EBCAD] border-[#5EBCAD]'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {selectedUsers.includes(user.id) && (
                        <svg
                          className="size-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="size-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {searchQuery
                      ? 'No members found'
                      : 'No available members to invite'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between items-center gap-2 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={selectedUsers.length === 0}
            >
              Clear Selection
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onClearSelection();
                  onSearchChange('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
                onClick={onInvite}
                disabled={selectedUsers.length === 0}
              >
                <UserPlus className="size-4 mr-2" />
                Invite{' '}
                {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
