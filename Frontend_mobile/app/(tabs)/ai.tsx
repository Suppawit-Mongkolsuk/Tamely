import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Animated, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SendHorizonal, Sparkles, Plus, ChevronLeft, Trash2, Clock } from 'lucide-react-native';
import Header from '../../components/ui/Header';
import { API_BASE } from '@/lib/config';

// ---- types ----

type Role = 'user' | 'assistant';

interface HistoryItem { role: Role; content: string; }
interface Message { id: string; role: Role; content: string; createdAt: Date; }
interface Session { sessionId: string; title: string; isPinned: boolean; updatedAt: string; }

// ---- api ----

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? 'Request failed');
  return json.data as T;
}

const sendChat = (wsId: string, token: string, payload: { message: string; history: HistoryItem[]; sessionId?: string }) =>
  apiFetch<{ reply: string }>(`/workspaces/${wsId}/ai/chat`, token, { method: 'POST', body: JSON.stringify(payload) });

const fetchSessions = (wsId: string, token: string) =>
  apiFetch<Session[]>(`/workspaces/${wsId}/ai/sessions`, token);

const fetchSessionMessages = (wsId: string, token: string, sessionId: string) =>
  apiFetch<{ role: Role; content: string; createdAt: string }[]>(`/workspaces/${wsId}/ai/sessions/${sessionId}`, token);

const deleteSession = (wsId: string, token: string, sessionId: string) =>
  apiFetch<void>(`/workspaces/${wsId}/ai/sessions/${sessionId}`, token, { method: 'DELETE' });

// ---- quick actions ----

const QUICK_ACTIONS = [
  'สรุปการสนทนาในช่วงนี้ให้หน่อย',
  'มีงานที่ต้องทำอะไรบ้าง?',
  'ใครต้องตอบกลับข้อความบ้าง?',
  'ช่วยสรุปข้อความที่ยังไม่ได้อ่าน',
];

// ---- TypingDots ----

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(600),
      ])),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);
  return (
    <View className="flex-row items-end mb-3">
      <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center mr-2">
        <Sparkles size={14} color="#fff" />
      </View>
      <View className="bg-white border border-gray-100 rounded-2xl rounded-bl px-4 py-3 flex-row items-center gap-1 shadow-sm">
        {dots.map((dot, i) => (
          <Animated.View key={i} className="w-[7px] h-[7px] rounded-full bg-gray-400 mx-[2px]" style={{ transform: [{ translateY: dot }] }} />
        ))}
      </View>
    </View>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

// ---- ChatBubble ----

function ChatBubble({ role, content, createdAt }: { role: Role; content: string; createdAt: Date }) {
  const isUser = role === 'user';
  if (isUser) {
    return (
      <View className="mb-4">
        <View className="flex-row justify-end">
          <View className="bg-indigo-600 rounded-2xl rounded-br-sm px-4 py-3 max-w-[78%] shadow-sm">
            <Text className="text-white text-sm leading-5 font-medium">{content}</Text>
          </View>
        </View>
        <Text className="text-[11px] text-gray-400 text-right mt-1 mr-1">{formatTime(createdAt)}</Text>
      </View>
    );
  }
  return (
    <View className="mb-4">
      <View className="flex-row items-end">
        <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center mr-2 flex-shrink-0">
          <Sparkles size={14} color="#fff" />
        </View>
        <View className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[78%] shadow-sm">
          <Text className="text-gray-800 text-sm leading-5">{content}</Text>
        </View>
      </View>
      <Text className="text-[11px] text-gray-400 mt-1 ml-10">{formatTime(createdAt)}</Text>
    </View>
  );
}

// ---- WelcomeCard ----

function WelcomeCard({ onQuickAction }: { onQuickAction: (text: string) => void }) {
  return (
    <View className="flex-1 px-4 pt-2">
      <View className="flex-row items-start mb-5">
        <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center mr-3 mt-1 flex-shrink-0">
          <Sparkles size={14} color="#fff" />
        </View>
        <View className="bg-white border border-gray-100 rounded-2xl rounded-tl px-4 py-4 flex-1 shadow-sm">
          <Text className="text-gray-800 text-sm font-semibold mb-3">สวัสดี! ฉันคือ AI Assistant พร้อมช่วย:</Text>
          {['สรุปบทสนทนา', 'ดึง action items', 'ตอบคำถามเกี่ยวกับทีม', 'สร้าง task อัตโนมัติ'].map((item) => (
            <View key={item} className="flex-row items-center mb-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2.5" />
              <Text className="text-gray-600 text-sm">{item}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text className="text-xs text-gray-400 font-medium mb-2 px-1 tracking-wide uppercase">Quick Actions</Text>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity key={action} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 mb-2.5 shadow-sm" onPress={() => onQuickAction(action)}>
          <Text className="text-gray-700 text-sm">{action}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ---- Session Drawer ----

function SessionDrawer({
  visible, sessions, currentSessionId, loadingSessions,
  onSelect, onNew, onDelete, onClose,
}: {
  visible: boolean;
  sessions: Session[];
  currentSessionId: string | null;
  loadingSessions: boolean;
  onSelect: (s: Session) => void;
  onNew: () => void;
  onDelete: (s: Session) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', flexDirection: 'row' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={{ width: '78%', backgroundColor: '#fff', height: '100%' }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            {/* header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Chat Sessions</Text>
              <TouchableOpacity onPress={onClose}>
                <ChevronLeft size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* new session button */}
            <TouchableOpacity
              onPress={onNew}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, backgroundColor: '#eef2ff', borderRadius: 12, padding: 14 }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="#fff" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#4f46e5' }}>New Chat</Text>
            </TouchableOpacity>

            {/* session list */}
            {loadingSessions ? (
              <ActivityIndicator color="#4f46e5" style={{ marginTop: 32 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {sessions.length === 0 && (
                  <View style={{ alignItems: 'center', paddingTop: 40 }}>
                    <Clock size={32} color="#d1d5db" />
                    <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 10 }}>ยังไม่มี session</Text>
                  </View>
                )}
                {sessions.map((s) => {
                  const isActive = s.sessionId === currentSessionId;
                  return (
                    <TouchableOpacity
                      key={s.sessionId}
                      onPress={() => onSelect(s)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 8, marginVertical: 2, borderRadius: 10, backgroundColor: isActive ? '#eef2ff' : 'transparent' }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: isActive ? '700' : '500', color: isActive ? '#4f46e5' : '#111827' }} numberOfLines={1}>
                          {s.title || 'Untitled'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{timeAgo(s.updatedAt)}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => onDelete(s)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4 }}
                      >
                        <Trash2 size={15} color="#d1d5db" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

// ---- Main Screen ----

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Moderator', MEMBER: 'Member',
};

export default function AiScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState('');
  const [wsId, setWsId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [role, setRole] = useState('');

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'wsId', 'user', 'role']).then((pairs) => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v ?? '']));
      setToken(map['token']);
      setWsId(map['wsId']);
      setRole(map['role']);
      if (map['user']) try { setUserData(JSON.parse(map['user'])); } catch {}
    });
  }, []);

  // โหลด session list
  const loadSessions = useCallback(async (t: string, w: string) => {
    if (!t || !w) return;
    try {
      setLoadingSessions(true);
      const data = await fetchSessions(w, t);
      setSessions(data);
    } catch {}
    finally { setLoadingSessions(false); }
  }, []);

  useEffect(() => {
    if (token && wsId) loadSessions(token, wsId);
  }, [token, wsId]);

  // โหลดข้อความเก่าของ session ที่เลือก
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    if (!token || !wsId) return;
    try {
      setLoadingHistory(true);
      const data = await fetchSessionMessages(wsId, token, sessionId);
      setMessages(data.map((m) => ({
        id: uuidv4(),
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      })));
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'โหลดประวัติการสนทนาไม่สำเร็จ');
    } finally {
      setLoadingHistory(false);
    }
  }, [token, wsId]);

  const handleSelectSession = useCallback((s: Session) => {
    setCurrentSessionId(s.sessionId);
    setShowDrawer(false);
    loadSessionHistory(s.sessionId);
  }, [loadSessionHistory]);

  const handleNewSession = useCallback(() => {
    const newId = uuidv4();
    setCurrentSessionId(newId);
    setMessages([]);
    setShowDrawer(false);
  }, []);

  const handleDeleteSession = useCallback((s: Session) => {
    Alert.alert('ลบ session?', `"${s.title || 'Untitled'}" จะถูกลบถาวร`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive', onPress: async () => {
          try {
            await deleteSession(wsId, token, s.sessionId);
            setSessions((prev) => prev.filter((x) => x.sessionId !== s.sessionId));
            if (currentSessionId === s.sessionId) {
              setCurrentSessionId(null);
              setMessages([]);
            }
          } catch { Alert.alert('เกิดข้อผิดพลาด', 'ลบไม่สำเร็จ'); }
        },
      },
    ]);
  }, [wsId, token, currentSessionId]);

  const buildHistory = useCallback((msgs: Message[]): HistoryItem[] =>
    msgs.slice(-20).map((m) => ({ role: m.role, content: m.content })),
  []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    // ถ้ายังไม่มี session ให้สร้างใหม่
    const sessionId = currentSessionId ?? uuidv4();
    if (!currentSessionId) setCurrentSessionId(sessionId);

    const userMsg: Message = { id: uuidv4(), role: 'user', content: msg, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history = buildHistory(messages);
      const result = await sendChat(wsId, token, { message: msg, history, sessionId });
      const aiMsg: Message = { id: uuidv4(), role: 'assistant', content: result.reply, createdAt: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
      // refresh session list เพื่อให้ชื่อ session ขึ้นมาใหม่
      loadSessions(token, wsId);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, wsId, token, currentSessionId, buildHistory, loadSessions]);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length, sending]);

  const sessionTitle = sessions.find((s) => s.sessionId === currentSessionId)?.title;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <Header
        subtitle={sessionTitle ? sessionTitle.slice(0, 30) : 'AI Assistant'}
        userName={userData?.displayName ?? 'Your Name'}
        userEmail={userData?.email ?? ''}
        userInitials={(userData?.displayName || userData?.email?.split('@')[0] || 'YO').split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || 'YO'}
        userRole={ROLE_LABELS[role] ?? 'Member'}
        workspaceId={wsId}
        role={role}
        token={token}
        currentUserId={userData?.id ?? ''}
      />

      {/* top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity
          onPress={() => { loadSessions(token, wsId); setShowDrawer(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
        >
          <Clock size={14} color="#4f46e5" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#4f46e5' }}>Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNewSession}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
        >
          <Plus size={14} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>New Chat</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {loadingHistory ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#4f46e5" />
            <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>กำลังโหลดประวัติ...</Text>
          </View>
        ) : messages.length === 0 ? (
          <FlatList data={[]} renderItem={null} ListHeaderComponent={<WelcomeCard onQuickAction={(t) => handleSend(t)} />} contentContainerStyle={{ flexGrow: 1 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} createdAt={item.createdAt} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}
            ListFooterComponent={sending ? <TypingDots /> : null}
          />
        )}

        {/* input bar */}
        <View className="flex-row items-end px-4 py-3 bg-white border-t border-gray-100 gap-2">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 max-h-24"
            placeholder="ถามอะไรก็ได้..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
            className={`w-10 h-10 rounded-full items-center justify-center ${input.trim() && !sending ? 'bg-indigo-600' : 'bg-indigo-300'}`}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <SendHorizonal size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SessionDrawer
        visible={showDrawer}
        sessions={sessions}
        currentSessionId={currentSessionId}
        loadingSessions={loadingSessions}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
        onDelete={handleDeleteSession}
        onClose={() => setShowDrawer(false)}
      />
    </SafeAreaView>
  );
}
