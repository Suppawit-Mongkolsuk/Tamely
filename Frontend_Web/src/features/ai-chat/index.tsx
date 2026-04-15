import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AIChatHeader } from '@/components/ai/AIChatHeader';
import { AIMessageBubble, AITypingIndicator, type AIMessage } from '@/components/ai/AIMessageBubble';
import { AIChatInput } from '@/components/ai/AIChatInput';
import { AIChatSidebar, type AiSession } from '@/components/ai/AIChatSidebar';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { apiClient, ApiError } from '@/services';

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

type AiHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

const createInitialMessage = (workspaceName?: string | null): AIMessage => ({
  id: `initial-${workspaceName ?? 'default'}`,
  role: 'assistant',
  content: workspaceName
    ? `สวัสดีครับ! ผม AI Assistant ของ Tamely สำหรับ workspace "${workspaceName}"\n\nผมช่วยสรุปการสนทนา ดู task และช่วยสร้าง task ให้ได้ ถ้าพร้อมแล้วพิมพ์คำถามมาได้เลยครับ`
    : 'สวัสดีครับ! ผม AI Assistant ของ Tamely พร้อมช่วยสรุปการสนทนา ดู task และช่วยสร้าง task ให้ได้ พิมพ์คำถามมาได้เลยครับ',
  timestamp: new Date(),
});

const generateSessionId = () => crypto.randomUUID();

export function AIChatPage() {
  const { currentWorkspace } = useWorkspaceContext();

  const [messages, setMessages] = useState<AIMessage[]>([
    createInitialMessage(currentWorkspace?.name),
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);

  // Session state
  const [sessionId, setSessionId] = useState<string>(generateSessionId);
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // โหลด session list
  const loadSessions = useCallback(async (workspaceId: string) => {
    try {
      const res = await apiClient.get<{ success: true; data: AiSession[] }>(
        `/workspaces/${workspaceId}/ai/sessions`,
      );
      setSessions(res.data);
    } catch {
      setSessions([]);
    }
  }, []);

  // Reset เมื่อเปลี่ยน workspace
  useEffect(() => {
    if (!currentWorkspace) {
      setMessages([createInitialMessage()]);
      setConversationHistory([]);
      setSessions([]);
      setActiveSessionId(null);
      setSessionId(generateSessionId());
      return;
    }

    setInput('');
    setIsTyping(false);
    setActiveSessionId(null);
    setSessionId(generateSessionId());
    setMessages([createInitialMessage(currentWorkspace.name)]);
    setConversationHistory([]);
    loadSessions(currentWorkspace.id);
  }, [currentWorkspace?.id]);

  // โหลด messages ของ session ที่เลือก
  const handleSelectSession = async (selectedSessionId: string) => {
    if (!currentWorkspace) return;
    setActiveSessionId(selectedSessionId);
    setIsLoadingHistory(true);
    try {
      const res = await apiClient.get<{ success: true; data: AiHistoryItem[] }>(
        `/workspaces/${currentWorkspace.id}/ai/sessions/${selectedSessionId}`,
      );
      const historyItems = res.data;
      const historyMessages: AIMessage[] = historyItems.map((item, index) => ({
        id: `session-${selectedSessionId}-${index}`,
        role: item.role,
        content: item.content,
        timestamp: new Date(item.createdAt),
      }));
      setMessages([createInitialMessage(currentWorkspace.name), ...historyMessages]);
      setConversationHistory(
        historyItems.map((item) => ({ role: item.role, content: item.content })),
      );
      // ใช้ sessionId เดิมของ session นั้นต่อ
      setSessionId(selectedSessionId);
    } catch {
      toast.error('ไม่สามารถโหลดประวัติการสนทนาได้');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRenameSession = async (sid: string, newTitle: string) => {
    if (!currentWorkspace) return;
    try {
      await apiClient.patch(`/workspaces/${currentWorkspace.id}/ai/sessions/${sid}`, { title: newTitle });
      setSessions((prev) => prev.map((s) => s.sessionId === sid ? { ...s, title: newTitle } : s));
    } catch {
      toast.error('ไม่สามารถเปลี่ยนชื่อได้');
    }
  };

  const handlePinSession = async (sid: string, isPinned: boolean) => {
    if (!currentWorkspace) return;
    try {
      await apiClient.patch(`/workspaces/${currentWorkspace.id}/ai/sessions/${sid}`, { isPinned });
      setSessions((prev) => {
        const updated = prev.map((s) => s.sessionId === sid ? { ...s, isPinned } : s);
        return [...updated].sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
    } catch {
      toast.error('ไม่สามารถปักหมุดได้');
    }
  };

  const handleDeleteSession = async (sid: string) => {
    if (!currentWorkspace) return;
    try {
      await apiClient.delete(`/workspaces/${currentWorkspace.id}/ai/sessions/${sid}`);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sid));
      // ถ้าลบ session ที่กำลังดูอยู่ → เริ่มใหม่
      if (activeSessionId === sid) handleNewChat();
    } catch {
      toast.error('ไม่สามารถลบได้');
    }
  };

  // เริ่มแชทใหม่
  const handleNewChat = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setActiveSessionId(null);
    setMessages([createInitialMessage(currentWorkspace?.name)]);
    setConversationHistory([]);
    setInput('');
  };

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
          sessionId,
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

      // ตั้งเป็น active session หลังส่งข้อความครั้งแรก
      if (activeSessionId === null) {
        setActiveSessionId(sessionId);
        loadSessions(currentWorkspace.id);
      }

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
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <AIChatHeader workspaceName={currentWorkspace?.name} onNewChat={handleNewChat} />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              กำลังโหลดประวัติการสนทนา...
            </div>
          ) : (
            messages.map((msg) => <AIMessageBubble key={msg.id} message={msg} />)
          )}
          {isTyping && <AITypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <AIChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isTyping} />
      </div>

      {/* Sessions Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <AIChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onRename={handleRenameSession}
          onPin={handlePinSession}
          onDelete={handleDeleteSession}
        />
      </div>
    </div>
  );
}
