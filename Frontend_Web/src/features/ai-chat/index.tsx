import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ListChecks,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { AIChatHeader } from '@/components/ai/AIChatHeader';
import { AIMessageBubble, AITypingIndicator, type AIMessage } from '@/components/ai/AIMessageBubble';
import { AIChatInput } from '@/components/ai/AIChatInput';
import { AIChatSidebar, type QuickAction } from '@/components/ai/AIChatSidebar';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { apiClient, ApiError } from '@/services';

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: FileText,
    label: 'สรุปการสนทนา',
    prompt: 'ช่วยสรุปการสนทนาที่สำคัญในห้อง Engineering Team ให้หน่อย',
  },
  {
    icon: ListChecks,
    label: 'แยก Tasks',
    prompt: 'ช่วยแยก tasks และ action items จากการประชุมล่าสุด',
  },
  {
    icon: TrendingUp,
    label: 'วิเคราะห์ข้อมูล',
    prompt: 'วิเคราะห์ productivity ของทีมในสัปดาห์นี้',
  },
  {
    icon: MessageSquare,
    label: 'สอบถามข้อมูล',
    prompt: 'มีโปรเจกต์อะไรที่กำลังดำเนินการอยู่บ้าง?',
  },
];

type ConversationHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type AiChatResponse = {
  success: true;
  data: {
    reply: string;
    toolsUsed: string[];
    taskCreated?: {
      id: string;
      title: string;
      date: string;
      priority: string;
      status: string;
    };
  };
};

const createInitialMessage = (workspaceName?: string | null): AIMessage => ({
  id: `initial-${workspaceName ?? 'default'}`,
  role: 'assistant',
  content: workspaceName
    ? `สวัสดีครับ! ผม AI Assistant ของ Tamely สำหรับ workspace "${workspaceName}"\n\nผมช่วยสรุปการสนทนา ดู task และช่วยสร้าง task ให้ได้ ถ้าพร้อมแล้วพิมพ์คำถามมาได้เลยครับ`
    : 'สวัสดีครับ! ผม AI Assistant ของ Tamely พร้อมช่วยสรุปการสนทนา ดู task และช่วยสร้าง task ให้ได้ พิมพ์คำถามมาได้เลยครับ',
  timestamp: new Date(),
});

export function AIChatPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const [messages, setMessages] = useState<AIMessage[]>([
    createInitialMessage(currentWorkspace?.name),
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([createInitialMessage(currentWorkspace?.name)]);
    setConversationHistory([]);
    setInput('');
    setIsTyping(false);
  }, [currentWorkspace?.id, currentWorkspace?.name]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!currentWorkspace) {
      toast.error('ยังไม่ได้เลือก workspace');
      return;
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiClient.post<AiChatResponse>(
        `/workspaces/${currentWorkspace.id}/ai/chat`,
        {
          message: currentInput,
          history: conversationHistory.slice(-10),
        },
      );

      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: currentInput },
        { role: 'assistant', content: response.data.reply },
      ]);

      if (response.data.taskCreated) {
        toast.success('สร้าง task สำเร็จ', {
          description: `Task "${response.data.taskCreated.title}" ถูกเพิ่มในปฏิทินแล้ว`,
        });
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'ขออภัยครับ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <AIChatHeader workspaceName={currentWorkspace?.name} />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {messages.map((msg) => (
            <AIMessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <AITypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions — mobile only (horizontal scroll) */}
        <div className="flex gap-2 px-3 py-2 overflow-x-auto md:hidden border-t border-border bg-muted/50">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => setInput(action.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-border text-xs whitespace-nowrap shrink-0 hover:bg-muted"
              >
                <Icon className="size-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>

        <AIChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isTyping} />
      </div>

      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <AIChatSidebar quickActions={QUICK_ACTIONS} onActionClick={setInput} />
      </div>
    </div>
  );
}
