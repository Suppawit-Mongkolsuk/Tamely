import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ListChecks,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { AIChatHeader } from '@/components/ai/AIChatHeader';
import { AIMessageBubble, AITypingIndicator, type AIMessage } from '@/components/ai/AIMessageBubble';
import { AIChatInput } from '@/components/ai/AIChatInput';
import { AIChatSidebar, type QuickAction } from '@/components/ai/AIChatSidebar';

// TODO: เชื่อมต่อ backend AI endpoint เมื่อ module ai พร้อม
// ปัจจุบันใช้ mock response เพื่อ demo UI

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

const INITIAL_MESSAGE: AIMessage = {
  id: '1',
  role: 'assistant',
  content:
    'สวัสดีครับ! ผม AI Assistant ของ TamelyChat พร้อมช่วยเหลือคุณในเรื่องต่างๆ เช่น:\n\n• สรุปการสนทนาในห้องแชท\n• แยก tasks และสร้าง action items\n• วิเคราะห์ข้อมูลและให้ insights\n• ตอบคำถามเกี่ยวกับโปรเจกต์\n\nมีอะไรให้ช่วยไหมครับ?',
  timestamp: new Date(),
};

/** Mock AI response — TODO: แทนด้วย real API call */
function generateMockAIResponse(userInput: string): string {
  const lower = userInput.toLowerCase();
  if (lower.includes('สรุป') || lower.includes('summary')) {
    return `ได้เลยครับ! นี่คือสรุปการสนทนาที่สำคัญ:\n\n**Engineering Team - วันนี้**\n• ✅ เสร็จสิ้นการพัฒนา authentication flow\n• 📋 วางแผน roadmap Q1\n• ⚡ ระบุโอกาสในการปรับปรุง performance\n\n**Key Points:**\n1. Authentication system พร้อม deploy\n2. กำหนด sprint goals สำหรับ 2 สัปดาห์ถัดไป\n\nมีส่วนไหนที่ต้องการข้อมูลเพิ่มเติมไหมครับ?`;
  }
  if (lower.includes('task') || lower.includes('action')) {
    return `ผมได้แยก tasks จากการประชุมล่าสุดแล้วครับ:\n\n**High Priority:**\n🔴 Review authentication PR - @Mike Chen\n\n**Medium Priority:**\n🟡 Update design system docs - @Emma Wilson\n\nต้องการให้สร้าง tasks เหล่านี้ใน task board ไหมครับ?`;
  }
  if (lower.includes('วิเคราะห์') || lower.includes('analyze')) {
    return `นี่คือการวิเคราะห์ productivity ของทีม:\n\n**📊 Overview:**\n• Total Messages: 264 (+12%)\n• Tasks Completed: 42 (+8%)\n• Active Users: 48 (+5%)\n\n**💡 Insights:**\nทีมมี productivity เพิ่มขึ้นอย่างต่อเนื่อง!`;
  }
  if (lower.includes('โปรเจกต์') || lower.includes('project')) {
    return `ขณะนี้มีโปรเจกต์ที่กำลังดำเนินการ:\n\n**🚀 Active Projects:**\n1. **Authentication System v2.0** — 85%\n2. **Design System Overhaul** — 60%\n3. **Mobile App Redesign** — 40%\n\nต้องการดูรายละเอียดของโปรเจกต์ใดเป็นพิเศษไหมครับ?`;
  }
  return `ได้รับข้อความของคุณแล้วครับ! ผมสามารถช่วยเหลือคุณในเรื่อง:\n\n• 📝 สรุปการสนทนา\n• ✅ แยก tasks\n• 📊 วิเคราะห์ข้อมูล\n• 💡 ให้คำแนะนำ\n\nลองเลือกจาก Quick Actions หรือพิมพ์คำถามเพิ่มเติมได้เลยครับ!`;
}

export function AIChatPage() {
  const [messages, setMessages] = useState<AIMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // TODO: แทน mock ด้วย apiClient.post('/workspaces/:id/ai/query', { question: input })
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockAIResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <AIChatHeader />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <AIMessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <AITypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <AIChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isTyping} />
      </div>

      <AIChatSidebar quickActions={QUICK_ACTIONS} onActionClick={setInput} />
    </div>
  );
}