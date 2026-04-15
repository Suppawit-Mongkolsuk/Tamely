import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, Hash } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';

interface Sender { id: string; Name: string; avatarUrl: string | null; }
interface Message { id: string; content: string; createdAt: string; sender: Sender; }

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

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : (params.roomId ?? '');
  const roomName = Array.isArray(params.roomName) ? params.roomName[0] : (params.roomName ?? '');
  const token = Array.isArray(params.token) ? params.token[0] : (params.token ?? '');
  const currentUserId = Array.isArray(params.currentUserId) ? params.currentUserId[0] : (params.currentUserId ?? '');

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(async () => {
    if (!roomId || !token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setMessages(json.data ?? []);
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'โหลดข้อความไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  /* ===== Socket.IO setup (ครั้งเดียว) ===== */
  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io(API_BASE, {
      auth: { token },
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', roomId);
    });

    socket.on('message_received', (msg: Message) => {
      setMessages((prev) => {
        // ป้องกัน duplicate
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('user_typing', (data: { userId: string; roomId: string; isTyping: boolean }) => {
      if (data.roomId !== roomId || data.userId === currentUserId) return;
      setTypingUsers((prev) =>
        data.isTyping
          ? prev.includes(data.userId) ? prev : [...prev, data.userId]
          : prev.filter((id) => id !== data.userId)
      );
    });

    loadMessages();

    return () => {
      socket.emit('leave_room', roomId);
      socket.disconnect();
    };
  }, [token, roomId]);

  /* ===== Focus: rejoin + reload ===== */
  useFocusEffect(
  useCallback(() => {
    console.log('[Focus] socket connected:', socketRef.current?.connected);
    console.log('[Focus] socket id:', socketRef.current?.id);
    loadMessages();
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', roomId);
      console.log('[Focus] rejoined room:', roomId);
    } else if (socketRef.current) {
      socketRef.current.connect();
      console.log('[Focus] reconnecting...');
    }
    return () => {};
  }, [loadMessages, roomId])
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender.id === currentUserId;
    const prevMsg = messages[index - 1];
    const showName = (!prevMsg || prevMsg.sender.id !== item.sender.id) && !isMe;

    return (
      <View style={{ marginBottom: 4, paddingHorizontal: 16 }}>
        {showName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, marginTop: 8 }}>
            <Avatar name={item.sender.Name} size={28} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{item.sender.Name}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>{formatTime(item.createdAt)}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
          {!isMe && <View style={{ width: 28, marginRight: 8 }} />}
          <View style={{ maxWidth: '75%' }}>
            <View style={{ backgroundColor: isMe ? '#425C95' : '#fff', borderRadius: 16, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, paddingHorizontal: 14, paddingVertical: 10, borderWidth: isMe ? 0 : 1, borderColor: '#f3f4f6', elevation: 1 }}>
              <Text style={{ fontSize: 14, color: isMe ? '#fff' : '#111827', lineHeight: 20 }}>{item.content}</Text>
            </View>
            {isMe && <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', marginTop: 2 }}>{formatTime(item.createdAt)}</Text>}
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
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={18} color="#425C95" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{roomName}</Text>
            {typingUsers.length > 0 && <Text style={{ fontSize: 12, color: '#425C95' }}>กำลังพิมพ์...</Text>}
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
                <Hash size={40} color="#d1d5db" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 12 }}>ยังไม่มีข้อความ</Text>
                <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>เริ่มต้นบทสนทนากัน</Text>
              </View>
            }
          />
        )}

        <View style={{ backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <TextInput
            value={text}
            onChangeText={handleTyping}
            placeholder="พิมพ์ข้อความ..."
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