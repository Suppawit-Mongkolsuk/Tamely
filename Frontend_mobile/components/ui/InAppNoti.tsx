import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../../lib/config';

interface BannerData {
  id: string;
  title: string;
  body: string;
  route?: { pathname: string; params?: Record<string, string> };
}

export default function InAppNoti() {
  const router = useRouter();
  const pathname = usePathname();
  const [banner, setBanner] = useState<BannerData | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const showBanner = useCallback((data: BannerData) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBanner(data);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    timerRef.current = setTimeout(() => hideBanner(), 4000);
  }, [slideAnim]);

  const hideBanner = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setBanner(null));
  }, [slideAnim]);

  useEffect(() => {
    let mounted = true;
    // เก็บ socket ใน local variable ของ closure นี้เท่านั้น
    // เพื่อให้ cleanup ถูก socket ที่สร้างใน effect นี้จริงๆ
    let localSocket: Socket | null = null;

    const setup = async () => {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const wsId = await AsyncStorage.getItem('wsId');

      if (!token || !userStr || !wsId) return;
      if (!mounted) return;

      const currentUserId = JSON.parse(userStr)?.id ?? '';

      const socket = io(API_BASE, {
        auth: { token },
        transports: ['websocket'],
        extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
      });

      localSocket = socket;

      // map conversationId → { otherName, otherUserId }
      const dmInfoMap: Record<string, { otherName: string; otherUserId: string }> = {};

      socket.on('connect', async () => {
        if (!mounted) return;
        console.log('[InAppNoti] connected:', socket.id);

        try {
          const dmRes = await fetch(`${API_BASE}/api/workspaces/${wsId}/dm`, {
            headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          });
          if (dmRes.ok) {
            const dmJson = await dmRes.json();
            const convs: { id: string; otherUser?: { id: string; Name: string } }[] = dmJson.data ?? [];
            for (const conv of convs) {
              socket.emit('join_dm', conv.id);
              if (conv.otherUser) {
                dmInfoMap[conv.id] = { otherName: conv.otherUser.Name, otherUserId: conv.otherUser.id };
              }
            }
            console.log('[InAppNoti] joined', convs.length, 'DM rooms');
          }
        } catch {}

        try {
          const roomRes = await fetch(`${API_BASE}/api/workspaces/${wsId}/rooms`, {
            headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          });
          if (roomRes.ok) {
            const roomJson = await roomRes.json();
            const rooms: { id: string; name: string }[] = roomJson.data ?? [];
            for (const room of rooms) {
              socket.emit('join_room', room.id);
            }
            console.log('[InAppNoti] joined', rooms.length, 'rooms');
          }
        } catch {}
      });

      socket.on('connect_error', (err) => {
        console.log('[InAppNoti] connect_error:', err.message);
      });

      socket.on('dm_received', (msg: {
        id: string;
        content: string;
        sender: { id: string; Name: string };
        conversationId?: string;
      }) => {
        if (!mounted) return;
        if (msg.sender.id === currentUserId) return;
        if (pathnameRef.current.includes('chat-dm')) return;

        const convId = msg.conversationId ?? '';
        const dmInfo = dmInfoMap[convId];
        console.log('[InAppNoti] dm_received from:', msg.sender.Name);
        showBanner({
          id: msg.id,
          title: msg.sender.Name,
          body: msg.content,
          route: {
            pathname: '/chat-dm',
            params: {
              conversationId: convId,
              otherName: dmInfo?.otherName ?? msg.sender.Name,
              otherUserId: dmInfo?.otherUserId ?? msg.sender.id,
            },
          },
        });
      });

      socket.on('message_received', (msg: {
        id: string;
        content: string;
        sender: { id: string; Name: string };
        roomId?: string;
        roomName?: string;
      }) => {
        if (!mounted) return;
        if (msg.sender.id === currentUserId) return;
        if (pathnameRef.current.includes('chat-room')) return;

        console.log('[InAppNoti] message_received from:', msg.sender.Name);
        showBanner({
          id: msg.id,
          title: `# ${msg.roomName ?? 'ห้องแชท'}`,
          body: `${msg.sender.Name}: ${msg.content}`,
          route: {
            pathname: '/chat-room',
            params: { roomId: msg.roomId ?? '', roomName: msg.roomName ?? '' },
          },
        });
      });

      socket.on('new_notification', (data: {
        id: string;
        senderName: string;
        content: string;
      }) => {
        if (!mounted) return;
        if (pathnameRef.current.includes('alerts')) return;

        console.log('[InAppNoti] new_notification:', data.content);
        showBanner({
          id: data.id,
          title: 'มีการแท็กถึงคุณ',
          body: data.content,
          route: { pathname: '/(tabs)/alerts' },
        });
      });
    };

    setup();

    return () => {
      mounted = false;
      // disconnect เฉพาะ socket ของ effect นี้เท่านั้น
      localSocket?.disconnect();
      localSocket = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!banner) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.banner}
        onPress={() => {
          hideBanner();
          if (banner.route) {
            router.push({ pathname: banner.route.pathname as any, params: banner.route.params });
          }
        }}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{banner.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{banner.body}</Text>
        </View>
        <TouchableOpacity onPress={hideBanner} style={styles.closeBtn}>
          <Text style={styles.closeText}>x</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingTop: 52,
  },
  banner: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    gap: 12,
  },
  content: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
  },
  closeBtn: { padding: 4 },
  closeText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '700',
  },
});