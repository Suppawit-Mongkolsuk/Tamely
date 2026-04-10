// ===== Chat Window — Header + Messages + Input + File Upload =====
import { useState, useRef, useEffect } from 'react';
import { Send, Hash, MoreVertical, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import type { ChatRoom, DirectMessage, Message, ChatTab } from '@/types/chat-ui';

// Allowed file types
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto scroll to bottom เมื่อมีข้อความใหม่
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeTab === 'rooms' ? (
            <>
              <div className="size-10 rounded-lg bg-[#003366] flex items-center justify-center">
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
                <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white font-medium">
                  {currentDM?.avatar}
                </div>
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-9">
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-1">
          {messages.map((message, i) => {
            const prev = messages[i - 1];
            const showSender = !prev || prev.sender !== message.sender || prev.isOwn !== message.isOwn;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                showSender={showSender}
                onDelete={onDeleteMessage}
              />
            );
          })}
        </div>
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
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          {activeTab === 'dms' && onSendFile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted-foreground hover:text-[#5EBCAD]"
                onClick={() => imageInputRef.current?.click()}
                title="ส่งรูปภาพ"
              >
                <ImageIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted-foreground hover:text-[#5EBCAD]"
                onClick={() => fileInputRef.current?.click()}
                title="แนบไฟล์"
              >
                <Paperclip className="size-4" />
              </Button>
            </>
          )}

          <Input
            placeholder={
              pendingFile
                ? 'เพิ่มข้อความ (ไม่จำเป็น) แล้วกด Enter'
                : activeTab === 'rooms'
                  ? `Message #${currentRoom?.name ?? '...'}`
                  : `Message ${currentDM?.userName ?? '...'}`
            }
            value={messageInput}
            onChange={(e) => onMessageInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isUploading}
          />

          <Button
            onClick={pendingFile ? handleSendWithFile : onSendMessage}
            disabled={pendingFile ? isUploading : !messageInput.trim()}
            className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white shrink-0"
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
        <input ref={imageInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={handleFileSelect} />
        <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} className="hidden" onChange={handleFileSelect} />
      </div>
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
