import { LucideIcon, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export interface QuickAction {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

interface AIChatSidebarProps {
  quickActions: QuickAction[];
  onActionClick: (prompt: string) => void;
}

export function AIChatSidebar({ quickActions, onActionClick }: AIChatSidebarProps) {
  return (
    <div className="w-80 border-l border-border bg-muted p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="size-5 text-[#5EBCAD]" />
          <h3 className="text-base">Quick Actions</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          คลิกเพื่อใช้งานฟีเจอร์ที่ใช้บ่อย
        </p>
      </div>

      <div className="space-y-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              onClick={() => onActionClick(action.prompt)}
              className="w-full h-auto p-3 bg-white rounded-lg hover:shadow-md transition-all justify-start group"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-linear-to-br from-[#5EBCAD]/10 to-[#46769B]/10 flex items-center justify-center group-hover:from-[#5EBCAD]/20 group-hover:to-[#46769B]/20 transition-colors shrink-0">
                  <Icon className="size-5 text-[#003366]" />
                </div>
                <span className="text-sm">{action.label}</span>
              </div>
            </Button>
          );
        })}
      </div>

      <Card className="p-4 bg-linear-to-br from-[#5EBCAD]/10 to-[#46769B]/10 border-[#5EBCAD]/20">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="size-4 text-[#5EBCAD] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm mb-2">💡 เคล็ดลับ</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI สามารถเรียนรู้จากการสนทนาของคุณและให้คำแนะนำที่เหมาะสมมากขึ้นเรื่อยๆ
              ลองถามคำถามที่หลากหลายเพื่อประสบการณ์ที่ดีที่สุด!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
