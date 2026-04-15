import { Bot, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIChatHeaderProps {
  workspaceName?: string;
  onNewChat?: () => void;
}

export function AIChatHeader({ workspaceName, onNewChat }: AIChatHeaderProps) {
  return (
    <div className="border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center">
          <Sparkles className="size-5 text-white" />
        </div>
        <div>
          <h3 className="text-base">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">
            {workspaceName
              ? `พร้อมช่วยใน workspace ${workspaceName}`
              : 'Powered by TamelyChat AI • Always ready to help'}
          </p>
        </div>
      </div>

      {/* ปุ่ม New Chat — แสดงบน mobile เท่านั้น (desktop ใช้ปุ่มใน sidebar) */}
      {onNewChat && (
        <Button
          onClick={onNewChat}
          size="sm"
          className="md:hidden bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white gap-1.5"
        >
          <Plus className="size-3.5" />
          ใหม่
        </Button>
      )}
    </div>
  );
}

interface AIAvatarProps {
  type: 'bot' | 'user';
}

export function AIAvatar({ type }: AIAvatarProps) {
  if (type === 'bot') {
    return (
      <div className="size-8 rounded-full bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center shrink-0">
        <Bot className="size-4 text-white" />
      </div>
    );
  }
  return (
    <div className="size-8 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
      <span className="text-white text-xs font-medium">You</span>
    </div>
  );
}
