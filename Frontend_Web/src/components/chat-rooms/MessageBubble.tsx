// ===== Message Bubble Component =====
import { useState } from 'react';
import { Trash2, MoreHorizontal, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { BRAND_CLASSNAMES } from '@/lib/constants';
import type { Message } from '@/types/chat-ui';

interface MessageBubbleProps {
  message: Message;
  showSender?: boolean;
  onDelete?: (messageId: string) => void;
  showReadReceipt?: boolean;
}

/** Format file size */
function formatSize(bytes: number | null | undefined) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageBubble({ message, showSender = true, onDelete, showReadReceipt = false }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const messageType = message.type ?? 'TEXT';

  if (messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center px-3 py-2">
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {message.content}
        </div>
      </div>
    );
  }

  // ===================== Render Content =====================

  const renderContent = () => {
    // IMAGE type — show image preview, click เปิด lightbox
    if (messageType === 'IMAGE' && message.fileUrl) {
      return (
        <div className="space-y-1.5">
          <img
            src={message.fileUrl}
            alt={message.fileName ?? 'Image'}
            className="max-w-70 max-h-70 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => setLightboxOpen(true)}
          />
          {/* Caption — show only if different from default emoji */}
          {message.content && !message.content.startsWith('📷') && (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
        </div>
      );
    }

    // FILE type — show file download card (ไม่มี border ซ้อน)
    if (messageType === 'FILE' && message.fileUrl) {
      return (
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-1"
        >
          <div
            className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
              message.isOwn ? 'bg-white/20' : 'bg-blue-50'
            }`}
          >
            <FileText className={`size-5 ${message.isOwn ? 'text-white' : 'text-blue-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{message.fileName ?? 'File'}</p>
            <p className={`text-xs ${message.isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
              {formatSize(message.fileSize)}
            </p>
          </div>
          <Download className={`size-4 shrink-0 ${message.isOwn ? 'text-white/70' : 'text-muted-foreground'}`} />
        </a>
      );
    }

    // TEXT (default) — plain text
    return <span className="text-sm leading-relaxed">{message.content}</span>;
  };

  // ===================== Bubble Styles =====================

  // For IMAGE, use minimal padding
  const isMediaMessage = messageType === 'IMAGE' || messageType === 'FILE';
  const bubblePadding = isMediaMessage ? 'p-1.5' : 'px-3.5 py-2';

  return (
    <>
    <div
      className={`group flex ${showSender ? 'items-start' : 'items-end'} gap-2 ${message.isOwn ? 'flex-row-reverse' : 'flex-row'} ${showSender ? 'mt-2' : 'mt-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar — แสดงเฉพาะข้อความแรกของ group, ซ่อนสำหรับ own message */}
      {!message.isOwn && (
        <div className="shrink-0 w-8">
          {showSender ? (
            <UserAvatar
              displayName={message.sender}
              avatarUrl={message.avatarUrl}
              size="sm"
              className={BRAND_CLASSNAMES.lightBlueBg}
            />
          ) : null}
        </div>
      )}

      {/* Content */}
      <div className={`max-w-[65%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name (เฉพาะข้อความแรกของ group, ไม่ใช่ own) */}
        {showSender && !message.isOwn && (
          <div className="mb-1 px-1">
            <span className="text-xs font-medium text-gray-700">{message.sender}</span>
          </div>
        )}

        {/* Bubble + timestamp ข้างๆ (แบบ LINE) */}
        <div className={`flex items-end gap-1.5 ${message.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'} gap-0.5`}>
            <div
              className={`${bubblePadding} ${
                message.isOwn
                  ? `${BRAND_CLASSNAMES.primaryBg} text-white rounded-2xl rounded-br-md`
                  : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
              }`}
            >
              {renderContent()}
            </div>
            {/* Read receipt — แสดงใต้ข้อความสุดท้ายที่ถูกอ่าน (DM เท่านั้น) */}
            {showReadReceipt && (
              <span className={`text-[10px] font-medium px-1 ${BRAND_CLASSNAMES.tealText}`}>
                Read
              </span>
            )}
          </div>

          {/* Timestamp ข้างๆ bubble — แสดงตอน hover */}
          <span className="text-[10px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
            {message.timestamp}
          </span>

          {/* Actions — แสดงตอน hover เฉพาะข้อความของตัวเอง */}
          {message.isOwn && onDelete && (
            <div className={`transition-opacity mb-1 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-6 rounded-full">
                    <MoreHorizontal className="size-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={message.isOwn ? 'end' : 'start'} className="w-36">
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Image Lightbox */}
    {lightboxOpen && message.fileUrl && (
      <ImageLightbox
        images={[message.fileUrl!]}
        onClose={() => setLightboxOpen(false)}
      />
    )}
    </>
  );
}
