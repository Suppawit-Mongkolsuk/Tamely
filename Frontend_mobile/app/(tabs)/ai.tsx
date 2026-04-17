import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SendHorizonal, Sparkles } from 'lucide-react-native';
import Header from '../../components/ui/Header';

// ---- types ----

type Role = 'user' | 'assistant';

interface HistoryItem {
  role: Role;
  content: string;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
}

// ---- api ----

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? 'Request failed');
  return json.data as T;
}

const sendChat = (
  wsId: string,
  token: string,
  payload: { message: string; history: HistoryItem[]; sessionId?: string },
) =>
  apiFetch<{ reply: string }>(`/workspaces/${wsId}/ai/chat`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ---- quick actions ----

const QUICK_ACTIONS = [
  'What were the main decisions in #engineering?',
  'List all action items from this week',
  'Who needs to respond to messages?',
  'Summarize unread messages',
];

const WELCOME_ITEMS = [
  'Summarizing conversations',
  'Extracting action items',
  'Analyzing team discussions',
  'Answering questions about messages',
];

// ---- TypingDots ----

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  React.useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View className="flex-row items-end mb-3">
      <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center mr-2">
        <Text className="text-white text-[10px] font-bold">AI</Text>
      </View>
      <View className="bg-white border border-gray-100 rounded-2xl rounded-bl px-4 py-3 flex-row items-center gap-1 shadow-sm">
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-gray-400 mx-[2px]"
            style={{ transform: [{ translateY: dot }] }}
          />
        ))}
      </View>
    </View>
  );
}

// ---- helpers ----

function formatTime(date: Date): string {
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
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
      {/* AI bubble */}
      <View className="flex-row items-start mb-5">
        <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center mr-3 mt-1 flex-shrink-0">
          <Text className="text-white text-[10px] font-bold">AI</Text>
        </View>
        <View className="bg-white border border-gray-100 rounded-2xl rounded-tl px-4 py-4 flex-1 shadow-sm">
          <Text className="text-gray-800 text-sm font-semibold mb-3">
            Hi! I'm your AI assistant. I can help you with:
          </Text>
          {WELCOME_ITEMS.map((item) => (
            <View key={item} className="flex-row items-center mb-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2.5" />
              <Text className="text-gray-600 text-sm">{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <Text className="text-xs text-gray-400 font-medium mb-2 px-1 tracking-wide uppercase">
        Quick Actions
      </Text>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action}
          className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 mb-2.5 shadow-sm active:bg-indigo-50"
          onPress={() => onQuickAction(action)}
        >
          <Text className="text-gray-700 text-sm">{action}</Text>
        </TouchableOpacity>
      ))}
    </View>
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

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem('token') ?? '';
      const w = await AsyncStorage.getItem('wsId') ?? '';
      const u = await AsyncStorage.getItem('user') ?? '';
      const r = await AsyncStorage.getItem('role') ?? '';
      setToken(t);
      setWsId(w);
      setUserData(u ? JSON.parse(u) : null);
      setRole(r);
    };
    load();
  }, []);

  const buildHistory = useCallback((msgs: Message[]): HistoryItem[] =>
    msgs.slice(-20).map((m) => ({ role: m.role, content: m.content })),
  []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    const userMsg: Message = { id: uuidv4(), role: 'user', content: msg, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history = buildHistory(messages);
      const result = await sendChat(wsId, token, { message: msg, history });

      const aiMsg: Message = { id: uuidv4(), role: 'assistant', content: result.reply, createdAt: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', errorMessage);
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, wsId, token, buildHistory]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  React.useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, sending]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <Header
        subtitle="AI Assistant"
        userName={userData?.displayName ?? 'Your Name'}
        userEmail={userData?.email ?? ''}
        userInitials={(userData?.displayName ?? 'YO').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
        userRole={ROLE_LABELS[role] ?? 'Member'}
        workspaceId={wsId}
        role={role}
        token={token}
        currentUserId={userData?.id ?? ''}
      />

      {/* body */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={<WelcomeCard onQuickAction={(t) => handleSend(t)} />}
            contentContainerStyle={{ flexGrow: 1 }}
          />
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
            placeholder="Ask AI anything..."
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
            className={`w-10 h-10 rounded-full items-center justify-center ${
              input.trim() && !sending ? 'bg-indigo-600' : 'bg-indigo-300'
            }`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <SendHorizonal size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}