import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  ListChecks,
  TrendingUp,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'สวัสดีครับ! ผม AI Assistant ของ TamelyChat พร้อมช่วยเหลือคุณในเรื่องต่างๆ เช่น:\n\n• สรุปการสนทนาในห้องแชท\n• แยก tasks และสร้าง action items\n• วิเคราะห์ข้อมูลและให้ insights\n• ตอบคำถามเกี่ยวกับโปรเจกต์\n\nมีอะไรให้ช่วยไหมครับ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // จำลองการตอบกลับของ AI
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('สรุป') || lowerInput.includes('summary')) {
      return `ได้เลยครับ! นี่คือสรุปการสนทนาที่สำคัญ:

**Engineering Team - วันนี้**
• ✅ เสร็จสิ้นการพัฒนา authentication flow
• 📋 วางแผน roadmap Q1 
• ⚡ ระบุโอกาสในการปรับปรุง performance
• 👥 Code review เสร็จ 3 PRs

**Key Points:**
1. Authentication system พร้อม deploy
2. กำหนด sprint goals สำหรับ 2 สัปดาห์ถัดไป
3. ต้องปรับปรุง loading time ของ dashboard

มีส่วนไหนที่ต้องการข้อมูลเพิ่มเติมไหมครับ?`;
    }

    if (lowerInput.includes('task') || lowerInput.includes('action')) {
      return `ผมได้แยก tasks จากการประชุมล่าสุดแล้วครับ:

**High Priority:**
🔴 Review authentication PR - @Mike Chen (วันนี้ 5:00 PM)
🔴 Complete security training - @All Team (สิ้นสัปดาห์นี้)

**Medium Priority:**
🟡 Update design system docs - @Emma Wilson (พรุ่งนี้)
🟡 Prepare Q1 roadmap presentation - @Sarah Johnson (สัปดาห์หน้า)

**Low Priority:**
🟢 RSVP team building event - @All Team (พุธนี้)

ต้องการให้สร้าง tasks เหล่านี้ใน task board ไหมครับ?`;
    }

    if (lowerInput.includes('วิเคราะห์') || lowerInput.includes('analyze')) {
      return `นี่คือการวิเคราะห์ productivity ของทีมในสัปดาห์นี้:

**📊 Overview:**
• Total Messages: 264 (+12% from last week)
• Tasks Completed: 42 (+8%)
• Active Users: 48 (+5%)
• Avg Response Time: 2.4h (-15% ✨)

**🏆 Top Performers:**
1. Sarah Johnson - 89 messages
2. Mike Chen - 76 messages
3. Emma Wilson - 64 messages

**⏰ Peak Activity:**
• 10:00 AM - 11:00 AM (85% activity)
• 2:00 PM - 3:00 PM (72% activity)

**💡 Insights:**
ทีมมี productivity เพิ่มขึ้นอย่างต่อเนื่อง! Response time ลดลงแสดงถึงการทำงานที่มีประสิทธิภาพมากขึ้น

ต้องการข้อมูลเพิ่มเติมไหมครับ?`;
    }

    if (lowerInput.includes('โปรเจกต์') || lowerInput.includes('project')) {
      return `ขณะนี้มีโปรเจกต์ที่กำลังดำเนินการ:

**🚀 Active Projects:**

1. **Authentication System v2.0**
   Status: 85% complete
   Team: Engineering
   Due: End of month

2. **Design System Overhaul**
   Status: 60% complete
   Team: Design
   Due: Next month

3. **Mobile App Redesign**
   Status: 40% complete
   Team: Design + Engineering
   Due: Q2 2024

4. **Performance Optimization**
   Status: Planning phase
   Team: Engineering
   Due: TBD

ต้องการดูรายละเอียดของโปรเจกต์ใดเป็นพิเศษไหมครับ?`;
    }

    return `ได้รับข้อความของคุณแล้วครับ! ผมสามารถช่วยเหลือคุณในเรื่องต่างๆ เช่น:

• 📝 สรุปการสนทนาจากห้องแชทต่างๆ
• ✅ แยก tasks และ action items
• 📊 วิเคราะห์ข้อมูลและ metrics ต่างๆ
• 💡 ให้คำแนะนำและ insights
• 🔍 ค้นหาข้อมูลในระบบ

ลองเลือกจาก Quick Actions ด้านล่าง หรือพิมพ์คำถามเพิ่มเติมได้เลยครับ!`;
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-base">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">
                Powered by TamelyChat AI • Always ready to help
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="size-8 rounded-full bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center shrink-0">
                  <Bot className="size-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-linear-to-r from-[#5EBCAD] to-[#46769B] text-white'
                    : 'bg-muted'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-white/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="size-8 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
                  <User className="size-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center shrink-0">
                <Bot className="size-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="size-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="size-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="size-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-white">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="พิมพ์ข้อความของคุณ... (กด Enter เพื่อส่ง)"
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Quick Actions */}
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
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                className="w-full p-3 bg-white rounded-lg hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-linear-to-br from-[#5EBCAD]/10 to-[#46769B]/10 flex items-center justify-center group-hover:from-[#5EBCAD]/20 group-hover:to-[#46769B]/20 transition-colors">
                    <Icon className="size-5 text-[#003366]" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <Card className="p-4 bg-linear-to-br from-[#5EBCAD]/10 to-[#46769B]/10 border-[#5EBCAD]/20">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="size-4 text-[#5EBCAD] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm mb-2">💡 เคล็ดลับ</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI
                สามารถเรียนรู้จากการสนทนาของคุณและให้คำแนะนำที่เหมาะสมมากขึ้นเรื่อยๆ
                ลองถามคำถามที่หลากหลายเพื่อประสบการณ์ที่ดีที่สุด!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
