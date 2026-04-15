import { Bot, Sparkles } from 'lucide-react';

interface AIChatHeaderProps {
  workspaceName?: string;
}

export function AIChatHeader({ workspaceName }: AIChatHeaderProps) {
  return (
    <div className="border-b border-border p-4">
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
