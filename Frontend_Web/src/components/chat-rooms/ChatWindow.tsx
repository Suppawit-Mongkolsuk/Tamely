// ===== Chat Window — Header + Messages + Input + File Upload =====
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  Send,
  Hash,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Info,
  Phone,
  Trash2,
  Bell,
  BellOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MentionInput } from '@/components/feed/MentionInput';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  BRAND_CLASSNAMES,
  CHAT_FILE_ACCEPT,
  CHAT_IMAGE_ACCEPT,
  GRADIENT,
  MAX_FILE_SIZE,
} from '@/lib/constants';
import { MessageBubble } from './MessageBubble';
import type { ChatRoom, DirectMessage, Message, ChatTab } from '@/types/chat-ui';

// ===== Date Separator =====

/** แปลง "YYYY-MM-DD" → "วันนี้" / "เมื่อวาน" / "จ. 7 เม.ย." / "7 เม.ย. 2023" */
function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === todayStr) return 'วันนี้';
  if (dateStr === yesterdayStr) return 'เมื่อวาน';

  const d = new Date(dateStr);
  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium px-2 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// Skeleton bubbles แสดงตอนกำลังโหลดข้อความครั้งแรก
function MessageSkeleton() {
  const items = [
    { own: false, width: 'w-48' },
    { own: false, width: 'w-36' },
    { own: true,  width: 'w-56' },
    { own: false, width: 'w-44' },
    { own: true,  width: 'w-32' },
    { own: true,  width: 'w-52' },
  ];
  return (
    <div className="space-y-4 px-2 py-4">
      {items.map((item, i) => (
        <div key={i} className={`flex items-end gap-2 ${item.own ? 'flex-row-reverse' : ''}`}>
          {!item.own && (
            <div className="size-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          )}
          <div className={`flex flex-col gap-1 ${item.own ? 'items-end' : 'items-start'}`}>
            {!item.own && <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />}
            <div className={`h-10 ${item.width} bg-gray-200 animate-pulse rounded-2xl`} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ChatWindowProps {
  activeTab: ChatTab;
  currentRoom: ChatRoom | undefined;
  currentDM: DirectMessage | undefined;
  messages: Message[];
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  onlineStatus?: Record<string, boolean>;
  onDeleteMessage?: (messageId: string) => void;
  onSendFile?: (file: File) => Promise<void>;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  onBack?: () => void;
  onShowDetail?: () => void;
  onStartVoiceCall?: () => void;
  onClearChat?: () => Promise<void>;
  disableCallActions?: boolean;
  workspaceId?: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function ChatWindow({
  activeTab,
  currentRoom,
  currentDM,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  onlineStatus = {},
  onDeleteMessage,
  onSendFile,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onBack,
  onShowDetail,
  onStartVoiceCall,
  onClearChat,
  disableCallActions = false,
  workspaceId,
  isMuted = false,
  onToggleMute,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const restoringScrollRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  // Auto scroll to bottom เมื่อมีข้อความใหม่ (ยกเว้นตอน load more)
  useEffect(() => {
    if (restoringScrollRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Restore scroll position หลัง prepend ข้อความเก่า
  useLayoutEffect(() => {
    if (!restoringScrollRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
  }, [messages]);

  useEffect(() => {
    restoringScrollRef.current = false;
  }, [messages]);

  // Scroll to top → load more
  const handleScrollEvent = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || !hasMore || isLoadingMore || restoringScrollRef.current) return;
    if (el.scrollTop < 80) {
      prevScrollHeightRef.current = el.scrollHeight;
      restoringScrollRef.current = true;
      setIsLoadingMore(true);
      try {
        await onLoadMore?.();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScrollEvent);
    return () => el.removeEventListener('scroll', handleScrollEvent);
  }, [handleScrollEvent]);

  // คำนวณ online status real-time
  const isOnline = currentDM ? (onlineStatus[currentDM.userId] ?? false) : false;

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('ไฟล์ใหญ่เกินไป (สูงสุด 10 MB)');
      return;
    }

    setPendingFile(file);

    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPendingPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPendingPreview(null);
    }

    // Reset input
    e.target.value = '';
  };

  const cancelPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handleSendWithFile = async () => {
    if (!pendingFile || !onSendFile) return;
    setIsUploading(true);
    try {
      await onSendFile(pendingFile);
      setPendingFile(null);
      setPendingPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (pendingFile) {
        handleSendWithFile();
      } else {
        onSendMessage();
      }
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0 w-full">
      {/* Chat Header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Back button — mobile only */}
          {onBack && (
            <Button variant="ghost" size="icon" className="size-9 shrink-0 md:hidden" onClick={onBack}>
              <ArrowLeft className="size-5" />
            </Button>
          )}
          {activeTab === 'rooms' ? (
            <>
              <div className={`size-10 rounded-lg flex items-center justify-center ${BRAND_CLASSNAMES.primaryBg}`}>
                <Hash className="size-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium">{currentRoom?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentRoom?.workspace}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <UserAvatar
                  displayName={currentDM?.userName ?? ''}
                  avatarUrl={currentDM?.avatarUrl}
                  size="md"
                  className={BRAND_CLASSNAMES.lightBlueBg}
                />
                <span
                  className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
              <div>
                <h3 className="text-base font-medium">{currentDM?.userName}</h3>
                <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {isOnline ? 'Active now' : 'Offline'}
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {activeTab === 'dms' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={onStartVoiceCall}
                disabled={disableCallActions}
                title="Voice call"
              >
                <Phone className="size-4" />
              </Button>
            </>
          )}
          {/* Info/detail button — mobile only */}
          {onShowDetail && (
            <Button variant="ghost" size="icon" className="size-9 md:hidden" onClick={onShowDetail}>
              <Info className="size-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onToggleMute && (
                <DropdownMenuItem onClick={onToggleMute}>
                  {isMuted ? (
                    <>
                      <Bell className="size-3.5 mr-2" />
                      เปิดการแจ้งเตือน
                    </>
                  ) : (
                    <>
                      <BellOff className="size-3.5 mr-2" />
                      ปิดการแจ้งเตือน
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {activeTab === 'dms' && onClearChat && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  ลบแชททั้งหมด
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
        {isLoading ? (
          <MessageSkeleton />
        ) : (
        <div className="space-y-1">
          {/* Spinner ตอนโหลดข้อความเก่า (scroll ขึ้น) */}
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <div className={`size-5 border-2 ${BRAND_CLASSNAMES.tealBorder} border-t-transparent rounded-full animate-spin`} />
            </div>
          )}

          {(() => {
            // หา index ของข้อความสุดท้ายที่เป็น isOwn && isRead สำหรับ read receipt
            let lastReadOwnIndex = -1;
            if (activeTab === 'dms') {
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].isOwn && messages[i].isRead) {
                  lastReadOwnIndex = i;
                  break;
                }
              }
            }

            return messages.map((message, i) => {
              const prev = messages[i - 1];
              const showDateSep = !prev || prev.date !== message.date;
              const showSender =
                showDateSep ||
                !prev ||
                prev.sender !== message.sender ||
                prev.isOwn !== message.isOwn;

              return (
                <div key={message.id}>
                  {showDateSep && (
                    <DateSeparator label={formatDateLabel(message.date)} />
                  )}
                  <MessageBubble
                    message={message}
                    showSender={showSender}
                    onDelete={onDeleteMessage}
                    showReadReceipt={i === lastReadOwnIndex}
                  />
                </div>
              );
            });
          })()}
        </div>
        )}
      </div>

      {/* Pending File Preview */}
      {pendingFile && (
        <div className="px-4 pt-3 border-t border-border bg-gray-50">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            {pendingPreview ? (
              <img
                src={pendingPreview}
                alt="Preview"
                className="size-16 rounded-lg object-cover"
              />
            ) : (
              <div className="size-16 rounded-lg bg-blue-50 flex items-center justify-center">
                <Paperclip className="size-6 text-blue-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{pendingFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(pendingFile.size)}</p>
            </div>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={cancelPendingFile}>
              <X className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-2 sm:p-4 border-t border-border">
        <div className="flex items-center gap-2">
          {onSendFile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`size-9 shrink-0 text-muted-foreground ${BRAND_CLASSNAMES.tealHoverText}`}
                onClick={() => imageInputRef.current?.click()}
                title="ส่งรูปภาพ"
              >
                <ImageIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`size-9 shrink-0 text-muted-foreground ${BRAND_CLASSNAMES.tealHoverText}`}
                onClick={() => fileInputRef.current?.click()}
                title="แนบไฟล์"
              >
                <Paperclip className="size-4" />
              </Button>
            </>
          )}

          <MentionInput
            workspaceId={activeTab === 'rooms' ? workspaceId : undefined}
            placeholder={
              pendingFile
                ? 'เพิ่มข้อความ (ไม่จำเป็น) แล้วกด Enter'
                : activeTab === 'rooms'
                  ? `Message #${currentRoom?.name ?? '...'}`
                  : `Message ${currentDM?.userName ?? '...'}`
            }
            value={messageInput}
            onChange={onMessageInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isUploading}
          />

          <Button
            onClick={pendingFile ? handleSendWithFile : onSendMessage}
            disabled={pendingFile ? isUploading : !messageInput.trim()}
            className={`${GRADIENT.tealToBlueLinear} hover:opacity-90 text-white shrink-0`}
            size="icon"
          >
            {isUploading ? (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input ref={imageInputRef} type="file" accept={CHAT_IMAGE_ACCEPT} className="hidden" onChange={handleFileSelect} />
        <input ref={fileInputRef} type="file" accept={CHAT_FILE_ACCEPT} className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Confirm clear chat dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ลบแชททั้งหมด</DialogTitle>
            <DialogDescription>
              ข้อความทั้งหมดในการสนทนานี้จะถูกลบถาวร ทั้งสองฝ่ายจะไม่สามารถดูได้อีก
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowClearConfirm(false)} disabled={clearingChat}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              disabled={clearingChat}
              onClick={async () => {
                setClearingChat(true);
                try {
                  await onClearChat?.();
                  setShowClearConfirm(false);
                } finally {
                  setClearingChat(false);
                }
              }}
            >
              {clearingChat && <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />}
              ลบแชท
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Empty state when no room/DM is selected */
export function ChatEmptyState({ activeTab }: { activeTab: ChatTab }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="text-center text-muted-foreground">
        <div className="size-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Hash className="size-8 opacity-30" />
        </div>
        <p className="text-lg mb-1">
          {activeTab === 'rooms'
            ? 'Select a conversation'
            : 'Select a conversation'}
        </p>
        <p className="text-sm">
          {activeTab === 'rooms'
            ? 'Choose a room from the list or create a new one'
            : 'Choose someone to message'}
        </p>
      </div>
    </div>
  );
}
