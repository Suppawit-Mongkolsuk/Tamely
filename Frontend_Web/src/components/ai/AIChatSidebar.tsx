import { useState } from 'react';
import { MessageSquare, MoreHorizontal, Pin, PinOff, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BRAND_CLASSNAMES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface AiSession {
  sessionId: string;
  title: string;
  isPinned: boolean;
  updatedAt: string;
}

interface AIChatSidebarProps {
  sessions: AiSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onRename: (sessionId: string, newTitle: string) => void;
  onPin: (sessionId: string, isPinned: boolean) => void;
  onDelete: (sessionId: string) => void;
}

export function AIChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRename,
  onPin,
  onDelete,
}: AIChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startRename = (session: AiSession) => {
    setEditingId(session.sessionId);
    setEditingTitle(session.title);
  };

  const submitRename = (sessionId: string) => {
    if (editingTitle.trim()) {
      onRename(sessionId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const pinnedSessions = sessions.filter((s) => s.isPinned);
  const normalSessions = sessions.filter((s) => !s.isPinned);

  return (
    <div className="w-72 border-l border-border bg-muted flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNewChat}
          className="w-full bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white gap-2"
        >
          <Plus className="size-4" />
          เริ่มแชทใหม่
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs text-center px-4">
            <MessageSquare className="size-8 mb-2 opacity-30" />
            ยังไม่มีประวัติการสนทนา
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinnedSessions.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground px-2 pt-1 pb-0.5">ปักหมุด</p>
                {pinnedSessions.map((session) => (
                  <SessionItem
                    key={session.sessionId}
                    session={session}
                    isActive={activeSessionId === session.sessionId}
                    isEditing={editingId === session.sessionId}
                    editingTitle={editingTitle}
                    onSelect={() => onSelectSession(session.sessionId)}
                    onStartRename={() => startRename(session)}
                    onSubmitRename={() => submitRename(session.sessionId)}
                    onEditingTitleChange={setEditingTitle}
                    onPin={() => onPin(session.sessionId, !session.isPinned)}
                    onDelete={() => onDelete(session.sessionId)}
                  />
                ))}
                {normalSessions.length > 0 && (
                  <p className="text-xs text-muted-foreground px-2 pt-2 pb-0.5">ล่าสุด</p>
                )}
              </>
            )}

            {/* Normal */}
            {normalSessions.map((session) => (
              <SessionItem
                key={session.sessionId}
                session={session}
                isActive={activeSessionId === session.sessionId}
                isEditing={editingId === session.sessionId}
                editingTitle={editingTitle}
                onSelect={() => onSelectSession(session.sessionId)}
                onStartRename={() => startRename(session)}
                onSubmitRename={() => submitRename(session.sessionId)}
                onEditingTitleChange={setEditingTitle}
                onPin={() => onPin(session.sessionId, !session.isPinned)}
                onDelete={() => onDelete(session.sessionId)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: AiSession;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  onSelect: () => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onEditingTitleChange: (v: string) => void;
  onPin: () => void;
  onDelete: () => void;
}

function SessionItem({
  session,
  isActive,
  isEditing,
  editingTitle,
  onSelect,
  onStartRename,
  onSubmitRename,
  onEditingTitleChange,
  onPin,
  onDelete,
}: SessionItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 px-2 py-2 rounded-lg transition-colors',
        isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60',
      )}
    >
      <MessageSquare className="size-3.5 shrink-0 opacity-40 mt-0.5" />

      {/* Title / Rename input */}
      <div className="flex-1 min-w-0" onClick={!isEditing ? onSelect : undefined}>
        {isEditing ? (
          <Input
            autoFocus
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onBlur={onSubmitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmitRename();
              if (e.key === 'Escape') onEditingTitleChange(session.title);
            }}
            className="h-6 text-xs px-1 py-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="cursor-pointer">
            <p className={cn('text-sm truncate leading-snug', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
              {session.isPinned && <Pin className={`size-3 inline mr-1 ${BRAND_CLASSNAMES.tealText}`} />}
              {session.title}
            </p>
            <p className="text-xs opacity-40 mt-0.5">
              {new Date(session.updatedAt).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        )}
      </div>

      {/* 3-dot menu */}
      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onStartRename}>
              <Pencil className="size-3.5 mr-2" />
              เปลี่ยนชื่อ
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPin}>
              {session.isPinned ? (
                <>
                  <PinOff className="size-3.5 mr-2" />
                  เอาออกจากหมุด
                </>
              ) : (
                <>
                  <Pin className="size-3.5 mr-2" />
                  ปักหมุด
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5 mr-2" />
              ลบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
