import { Bot, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_CLASSNAMES, GRADIENT } from '@/lib/constants';

interface AIChatHeaderProps {
  workspaceName?: string;
  onNewChat?: () => void;
}

export function AIChatHeader({ workspaceName, onNewChat }: AIChatHeaderProps) {
  return (
    <div className="border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-full ${GRADIENT.tealToBlueRounded} flex items-center justify-center`}>
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
          className={`md:hidden ${GRADIENT.tealToBlueLinear} hover:opacity-90 text-white gap-1.5`}
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
      <div className={`size-8 rounded-full ${GRADIENT.tealToBlueRounded} flex items-center justify-center shrink-0`}>
        <Bot className="size-4 text-white" />
      </div>
    );
  }
  return (
    <div className={`size-8 rounded-full ${BRAND_CLASSNAMES.primaryBg} flex items-center justify-center shrink-0`}>
      <span className="text-white text-xs font-medium">You</span>
    </div>
  );
}
