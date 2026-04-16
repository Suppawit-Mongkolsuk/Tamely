import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';

interface Sender { id: string; Name: string; avatarUrl: string | null; }
interface DmMessage { id: string; content: string; createdAt: string; sender: Sender; isRead: boolean; }

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

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

export default function ChatDmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : (params.conversationId ?? '');
  const otherName = Array.isArray(params.otherName) ? params.otherName[0] : (params.otherName ?? '');
  const token = Array.isArray(params.token) ? params.token[0] : (params.token ?? '');
  const currentUserId = Array.isArray(params.currentUserId) ? params.currentUserId[0] : (params.currentUserId ?? '');

  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoadingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId || !token) return;
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${API_BASE}/api/dm/${conversationId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setMessages(json.data ?? []);
      initialLoadDoneRef.current = true;
    } catch {
      if (!silent) Alert.alert('เกิดข้อผิดพลาด', 'โหลดข้อความไม่สำเร็จ');
    } finally {
      isLoadingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, [conversationId, token]);

  /* ===== Socket.IO setup — mount ครั้งเดียว ===== */
  useEffect(() => {
    if (!token || !conversationId) return;

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
      // โหลดใหม่เฉพาะตอน reconnect (initial load ไม่ต้องทำซ้ำ)
      if (initialLoadDoneRef.current) {
        loadMessages(true);
      }
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
      // อัพเดต isRead ของข้อความที่เราส่ง
      setMessages((prev) =>
        prev.map((m) => (m.sender.id === currentUserId ? { ...m, isRead: true } : m)),
      );
    });

    socket.on('dm_user_typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === currentUserId) return;
      setIsTyping(data.isTyping);
    });

    // โหลดข้อความครั้งแรก
    loadMessages();

    return () => {
      socket.emit('leave_dm', conversationId);
      socket.disconnect();
      socketRef.current = null;
    };
  // loadMessages ตั้งใจไม่ใส่ใน deps เพื่อให้ effect รันครั้งเดียวตาม token/conversationId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, conversationId]);

  /* ===== Focus: rejoin ถ้า socket หลุด + silent reload ===== */
  useFocusEffect(
    useCallback(() => {
      const socket = socketRef.current;
      if (!socket) return;

      if (socket.connected) {
        socket.emit('join_dm', conversationId);
        loadMessages(true);
      } else {
        socket.connect();
      }

      return () => {};
    }, [conversationId, loadMessages]),
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
    </SafeAreaView>
  );
}