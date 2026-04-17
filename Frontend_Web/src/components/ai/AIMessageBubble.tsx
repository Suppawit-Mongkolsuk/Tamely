import { Bot } from 'lucide-react';
import { formatTime } from '@/lib/utils';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIMessageBubbleProps {
  message: AIMessage;
}

export function AIMessageBubble({ message }: AIMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="size-8 rounded-full bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center shrink-0">
          <Bot className="size-4 text-white" />
        </div>
      )}

      <div
        className={`max-w-2xl rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-linear-to-r from-[#5EBCAD] to-[#46769B] text-white'
            : 'bg-muted'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        <p
          className={`text-xs mt-2 ${
            isUser ? 'text-white/70' : 'text-muted-foreground'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>

      {isUser && (
        <div className="size-8 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
          <span className="text-white text-xs">คุณ</span>
        </div>
      )}
    </div>
  );
}

export function AITypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="size-8 rounded-full bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center shrink-0">
        <Bot className="size-4 text-white" />
      </div>
      <div className="bg-muted rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="size-2 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
