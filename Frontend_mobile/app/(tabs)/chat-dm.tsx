import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, Phone } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ไม่ import useWebRTC และ CallOverlay ตรงๆ เพราะ react-native-webrtc ไม่รองรับ Expo Go
// ใช้ require แบบ lazy แทนเพื่อให้ Expo Go โหลดไฟล์นี้ได้
const isExpoGo = Constants.appOwnership === 'expo';

interface Sender { id: string; Name: string; avatarUrl: string | null; }
interface DmMessage { id: string; content: string; createdAt: string; sender: Sender; isRead: boolean; }

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

// dummy call state สำหรับ Expo Go
const dummyCallState = {
  status: 'idle' as const,
  peerId: null,
  peerName: null,
  peerAvatarUrl: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  callDuration: 0,
  isMinimized: false,
};

const dummyWebRTC = {
  callState: dummyCallState,
  startCall: async () => {},
  acceptCall: async () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  minimizeCallUI: () => {},
  expandCallUI: () => {},
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[colorIndex], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{getInitials(name)}</Text>
    </View>
  );
}

// hook wrapper ที่ใช้ useWebRTC จริงบน dev build และ dummy บน Expo Go
function useCallFeature(socket: Socket | null, currentUserId: string) {
  if (isExpoGo) return dummyWebRTC;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useWebRTC } = require('../../hooks/useWebRTC');
  return useWebRTC({ socket, currentUserId });
}

export default function ChatDmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : (params.conversationId ?? '');
  const otherName = Array.isArray(params.otherName) ? params.otherName[0] : (params.otherName ?? '');
  const otherUserId = Array.isArray(params.otherUserId) ? params.otherUserId[0] : (params.otherUserId ?? '');

  const [token, setToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem('token') ?? '';
      const u = await AsyncStorage.getItem('user') ?? '';
      const userData = u ? JSON.parse(u) : null;
      setToken(t);
      setCurrentUserId(userData?.id ?? '');
      setStorageLoaded(true);
    };
    load();
  }, []);

  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    minimizeCallUI,
    expandCallUI,
  } = useCallFeature(socketRef.current, currentUserId);

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId || !token) return;
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${API_BASE}/api/dm/${conversationId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      setMessages(json.data ?? []);
    } catch {
      if (!silent) Alert.alert('เกิดข้อผิดพลาด', 'โหลดข้อความไม่สำเร็จ');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    if (!storageLoaded || !token || !conversationId) return;

    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket'],
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_dm', conversationId);
      fetch(`${API_BASE}/api/dm/${conversationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      }).catch(() => {});
      loadMessages(true);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] connect_error:', err.message);
    });

    socket.on('dm_received', (msg: DmMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('dm_read', () => {
      setMessages((prev) =>
        prev.map((m) => (m.sender.id === currentUserId ? { ...m, isRead: true } : m)),
      );
    });

    socket.on('dm_user_typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === currentUserId) return;
      setIsTyping(data.isTyping);
    });

    loadMessages();

    return () => {
      socket.emit('leave_dm', conversationId);
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageLoaded, token, conversationId]);

  useFocusEffect(
    useCallback(() => {
      if (!storageLoaded) return;
      const socket = socketRef.current;
      if (!socket) return;

      if (socket.connected) {
        socket.emit('join_dm', conversationId);
        loadMessages(true);
      } else {
        socket.connect();
      }

      return () => {};
    }, [storageLoaded, conversationId, loadMessages]),
  );

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      socketRef.current?.emit('send_dm', { conversationId, content }, (res: any) => {
        if (!res?.success) Alert.alert('เกิดข้อผิดพลาด', 'ส่งข้อความไม่สำเร็จ');
      });
    } catch {
      Alert.alert('Network Error', 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    socketRef.current?.emit('dm_typing', { conversationId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('dm_typing', { conversationId, isTyping: false });
    }, 2000);
  };

  const handleStartCall = () => {
    if (isExpoGo) {
      Alert.alert('ไม่รองรับ', 'ฟีเจอร์โทรต้องใช้งานผ่าน Development Build ครับ');
      return;
    }
    if (!otherUserId) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้รับสาย');
      return;
    }
    void startCall(otherUserId, conversationId, otherName, null);
  };

  const renderMessage = ({ item, index }: { item: DmMessage; index: number }) => {
    const isMe = item.sender.id === currentUserId;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender.id !== item.sender.id);

    return (
      <View style={{ marginBottom: 4, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
          {!isMe && (showAvatar ? <Avatar name={item.sender.Name} size={28} /> : <View style={{ width: 28 }} />)}
          <View style={{ maxWidth: '75%' }}>
            <View style={{ backgroundColor: isMe ? '#425C95' : '#fff', borderRadius: 16, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, paddingHorizontal: 14, paddingVertical: 10, borderWidth: isMe ? 0 : 1, borderColor: '#f3f4f6', elevation: 1 }}>
              <Text style={{ fontSize: 14, color: isMe ? '#fff' : '#111827', lineHeight: 20 }}>{item.content}</Text>
            </View>
            <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: isMe ? 'right' : 'left', marginTop: 2 }}>
              {formatTime(item.createdAt)}{isMe && item.isRead ? ' read' : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // โหลด CallOverlay แบบ lazy เฉพาะตอนไม่ได้อยู่บน Expo Go
  const CallOverlayComponent = isExpoGo ? null : (() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../../components/ui/CallOverlay').default;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Avatar name={otherName} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{otherName}</Text>
            {isTyping && <Text style={{ fontSize: 12, color: '#425C95' }}>กำลังพิมพ์...</Text>}
          </View>
          <TouchableOpacity
            onPress={handleStartCall}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center' }}
          >
            <Phone size={18} color="#425C95" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#425C95" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 80 }}>
                <Avatar name={otherName} size={60} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 12 }}>{otherName}</Text>
                <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>เริ่มต้นบทสนทนากัน</Text>
              </View>
            }
          />
        )}

        <View style={{ backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <TextInput
            value={text}
            onChangeText={handleTyping}
            placeholder={`ส่งข้อความถึง ${otherName}...`}
            placeholderTextColor="#d1d5db"
            multiline
            maxLength={4000}
            style={{ flex: 1, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120, borderWidth: 1, borderColor: '#f3f4f6' }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: text.trim() ? '#425C95' : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {CallOverlayComponent && (
        <CallOverlayComponent
          callState={callState}
          acceptCall={acceptCall}
          rejectCall={rejectCall}
          endCall={endCall}
          toggleMute={toggleMute}
          minimizeCallUI={minimizeCallUI}
          expandCallUI={expandCallUI}
        />
      )}
    </SafeAreaView>
  );
}