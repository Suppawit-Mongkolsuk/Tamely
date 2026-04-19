import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIChatBanner from '../../components/chat/AIChatBanner';
import { useOnlineStatus } from '../../lib/OnlineStatusContext';
import { API_BASE } from '@/lib/config';

interface Sender { id: string; Name: string; avatarUrl: string | null; }
interface RoomMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: Sender;
  roomId?: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
}

function Avatar({ name, size = 32, uri }: { name: string; size?: number; uri?: string | null }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[colorIndex], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const params = useLocalSearchParams();

  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : (params.roomId ?? '');
  const roomName = Array.isArray(params.roomName) ? params.roomName[0] : (params.roomName ?? '');

  const [token, setToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [wsId, setWsId] = useState('');
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem('token') ?? '';
      const u = await AsyncStorage.getItem('user') ?? '';
      const w = await AsyncStorage.getItem('wsId') ?? '';
      let userData = null;
      try { userData = u ? JSON.parse(u) : null; } catch {}
      setToken(t);
      setCurrentUserId(userData?.id ?? '');
      setWsId(w);
      setStorageLoaded(true);
    };
    load();
  }, []);

  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [unreadSnapshot, setUnreadSnapshot] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(async (silent = false) => {
    if (!roomId || !token) return;
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      const data: RoomMessage[] = json.data ?? [];
      if (!silent) setUnreadSnapshot(data.slice(-10));
      setMessages(data);
    } catch {
      if (!silent) Alert.alert('เกิดข้อผิดพลาด', 'โหลดข้อความไม่สำเร็จ');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    if (!storageLoaded || !token || !roomId) {
      if (storageLoaded) setLoading(false);
      return;
    }

    setLoading(true);

    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket'],
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', roomId);
      loadMessages(true);
    });

    socket.on('message_received', (msg: RoomMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === currentUserId) return;
      setIsTyping(data.isTyping);
    });

    loadMessages();

    return () => {
      socket.off('connect');
      socket.off('message_received');
      socket.off('user_typing');
      socket.emit('leave_room', roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageLoaded, token, roomId]);

  useFocusEffect(
    useCallback(() => {
      if (!storageLoaded) return;
      const socket = socketRef.current;
      if (!socket) return;
      if (socket.connected) {
        socket.emit('join_room', roomId);
        loadMessages(true);
      } else {
        socket.connect();
      }
      return () => {};
    }, [storageLoaded, roomId, loadMessages]),
  );

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      socketRef.current?.emit('send_message', { roomId, content }, (res: any) => {
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
    socketRef.current?.emit('typing', { roomId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { roomId, isTyping: false });
    }, 2000);
  };

  const renderMessage = ({ item, index }: { item: RoomMessage; index: number }) => {
    const isMe = item.sender.id === currentUserId;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender.id !== item.sender.id);
    const showName = !isMe && showAvatar;

    return (
      <View style={{ marginBottom: 4, paddingHorizontal: 16 }}>
        {showName && (
          <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 2, marginLeft: 36 }}>{item.sender.Name}</Text>
        )}
        <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
          {!isMe && (showAvatar ? (
            <View style={{ position: 'relative' }}>
              <Avatar name={item.sender.Name} size={28} uri={item.sender.avatarUrl} />
              {isOnline(item.sender.id) && (
                <View style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: '#f9fafb' }} />
              )}
            </View>
          ) : <View style={{ width: 28 }} />)}
          <View style={{ maxWidth: '75%' }}>
            <View style={{ backgroundColor: isMe ? '#425C95' : '#fff', borderRadius: 16, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, paddingHorizontal: 14, paddingVertical: 10, borderWidth: isMe ? 0 : 1, borderColor: '#f3f4f6', elevation: 1 }}>
              <Text style={{ fontSize: 14, color: isMe ? '#fff' : '#111827', lineHeight: 20 }}>{item.content}</Text>
            </View>
            <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: isMe ? 'right' : 'left', marginTop: 2 }}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {/* Header */}
        <View style={{ backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>#</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{roomName}</Text>
            {isTyping && <Text style={{ fontSize: 12, color: '#425C95' }}>มีคนกำลังพิมพ์...</Text>}
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#425C95" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <AIChatBanner unreadMessages={unreadSnapshot} wsId={wsId} token={token} />
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={{ paddingVertical: 12 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 80 }}>
                  <Text style={{ fontSize: 32 }}>💬</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 12 }}>#{roomName}</Text>
                  <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>เริ่มบทสนทนาในห้องนี้</Text>
                </View>
              }
            />
          </View>
        )}

        {/* Input bar */}
        <View style={{ backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <TextInput
            value={text}
            onChangeText={handleTyping}
            placeholder={`ส่งข้อความใน #${roomName}...`}
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
    </SafeAreaView>
  );
}
