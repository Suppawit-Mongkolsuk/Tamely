// ===== useUnreadDMs — นับ unread รวมของ Room + DM =====
// ใช้ใน Sidebar เพื่อแสดง badge บน Chat Rooms nav item และ toast notification

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { dmService } from '@/services/dm.service';
import { chatService } from '@/services/chat.service';
import { useWorkspaceContext } from '@/contexts';
import { useAuthContext } from '@/contexts';
import { connectSocket } from '@/lib/socket';
import { isConversationMuted } from '@/lib/notification-prefs';
import type { MessageResponse } from '@/services/chat.service';
import type { DMMessageResponse } from '@/services/dm.service';

export function useUnreadDMs() {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const wsId = currentWorkspace?.id;
  const myId = user?.id ?? '';
  const location = useLocation();
  const isOnChatPage = location.pathname === '/chat-rooms';

  const [totalUnread, setTotalUnread] = useState(0);
  const roomNameMapRef = useRef<Record<string, string>>({});
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // fetch unread รวม + join ทุก DM และ Room socket เพื่อรับ event แบบ real-time
  const fetchAndJoin = useCallback(async () => {
    if (!wsId) return;
    try {
      const [convs, rooms] = await Promise.all([
        dmService.getConversations(wsId),
        chatService.getRooms(wsId),
      ]);

      const totalDmUnread = convs.reduce(
        (sum, c) => sum + (c.unreadCount ?? 0),
        0,
      );
      const totalRoomUnread = rooms.reduce(
        (sum, room) => sum + (room.unreadCount ?? 0),
        0,
      );
      const total = totalDmUnread + totalRoomUnread;
      setTotalUnread(total);

      const socket = connectSocket();
      // join ทุก DM conversation
      convs.forEach((c) => socket.emit('join_dm', c.id));
      // join ทุก Room เพื่อรับ message_received สำหรับ notification
      rooms.forEach((r) => socket.emit('join_room', r.id));

      // สร้าง map roomId → roomName
      const map: Record<string, string> = {};
      rooms.forEach((r) => { map[r.id] = r.name; });
      roomNameMapRef.current = map;
    } catch (err) {
      console.warn('[useUnreadDMs] Failed to refresh unread counts:', err);
    }
  }, [wsId]);

  const scheduleRefresh = useCallback((delay = 250) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      void fetchAndJoin();
    }, delay);
  }, [fetchAndJoin]);

  // โหลดครั้งแรก + poll ทุก 60s (backup กรณี socket หลุด)
  useEffect(() => {
    fetchAndJoin();
    const interval = setInterval(fetchAndJoin, 60_000);
    return () => clearInterval(interval);
  }, [fetchAndJoin]);

  // Rejoin ทุก room/DM หลัง socket reconnect เพื่อรับ notification ต่อเนื่อง
  useEffect(() => {
    const socket = connectSocket();
    const handleReconnect = () => { void fetchAndJoin(); };
    socket.on('connect', handleReconnect);
    return () => { socket.off('connect', handleReconnect); };
  }, [fetchAndJoin]);

  // Real-time: DM notifications
  useEffect(() => {
    const socket = connectSocket();

    const handleDMReceived = (msg: DMMessageResponse) => {
      // coalesce multiple socket events to avoid re-fetching the whole list every message
      scheduleRefresh();

      // แสดง toast เฉพาะข้อความของคนอื่นและไม่ได้อยู่หน้า Chat Rooms
      if (msg.sender.id === myId || isOnChatPage) return;

      if (msg.conversationId && isConversationMuted(myId, msg.conversationId)) return;

      const preview = msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content;
      toast(`💬 DM ส่วนตัว — ${msg.sender.Name}`, {
        description: preview,
      });
    };

    const handleDMRead = () => {
      scheduleRefresh();
    };

    socket.on('dm_received', handleDMReceived);
    socket.on('dm_read', handleDMRead);
    return () => {
      socket.off('dm_received', handleDMReceived);
      socket.off('dm_read', handleDMRead);
    };
  }, [scheduleRefresh, myId, isOnChatPage]);

  // Real-time: Room notifications + unread aggregate
  useEffect(() => {
    const socket = connectSocket();

    const handleMessageReceived = (msg: MessageResponse) => {
      scheduleRefresh();

      // ไม่แสดง toast ถ้าเป็นข้อความของตัวเอง หรืออยู่หน้า Chat Rooms อยู่แล้ว
      if (msg.sender.id === myId || isOnChatPage) return;

      if (msg.roomId && isConversationMuted(myId, msg.roomId)) return;

      const roomName = msg.roomId
        ? (roomNameMapRef.current[msg.roomId] ?? 'ห้องแชท')
        : 'ห้องแชท';
      const preview = msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content;

      toast(`# ${roomName}`, {
        description: `${msg.sender.Name}: ${preview}`,
      });
    };

    socket.on('message_received', handleMessageReceived);
    return () => {
      socket.off('message_received', handleMessageReceived);
    };
  }, [scheduleRefresh, myId, isOnChatPage]);

  // Reset เมื่อ workspace เปลี่ยน
  useEffect(() => {
    setTotalUnread(0);
    roomNameMapRef.current = {};
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, [wsId]);

  // refresh เมื่อเปลี่ยนหน้า เพื่อ sync badge หลังออกจากหน้า chat rooms
  useEffect(() => {
    void fetchAndJoin();
  }, [fetchAndJoin, location.pathname]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return { totalUnread, refresh: fetchAndJoin };
}
