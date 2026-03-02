// ===== Message Bubble Component =====
import type { Message } from './types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-3 ${message.isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`size-10 rounded-full flex items-center justify-center text-white shrink-0 ${
          message.isOwn ? 'bg-[#003366]' : 'bg-[#75A2BF]'
        }`}
      >
        {message.avatar}
      </div>
      <div className={`flex-1 max-w-2xl ${message.isOwn ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          {!message.isOwn && <span className="text-sm">{message.sender}</span>}
          <span className="text-xs text-muted-foreground">
            {message.timestamp}
          </span>
        </div>
        <div
          className={`inline-block p-3 rounded-2xl ${
            message.isOwn
              ? 'bg-[#003366] text-white rounded-br-none'
              : 'bg-muted rounded-bl-none'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
