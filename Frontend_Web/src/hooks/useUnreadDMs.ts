// ===== useUnreadDMs — นับ unread DM ทั้งหมดใน workspace =====
// ใช้ใน Sidebar เพื่อแสดง badge บน Chat Rooms nav item
// รองรับ real-time ผ่าน Socket.IO + join ทุก DM room ตอนเริ่ม

import { useState, useEffect, useCallback } from 'react';
import { dmService } from '@/services/dm.service';
import { useWorkspaceContext } from '@/contexts';
import { connectSocket } from '@/lib/socket';

export function useUnreadDMs() {
  const { currentWorkspace } = useWorkspaceContext();
  const wsId = currentWorkspace?.id;

  const [totalUnread, setTotalUnread] = useState(0);

  // fetch unread + join ทุก DM socket room เพื่อรับ event แบบ real-time
  const fetchAndJoin = useCallback(async () => {
    if (!wsId) return;
    try {
      const convs = await dmService.getConversations(wsId);
      const total = convs.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      setTotalUnread(total);

      // join ทุก DM room ใน socket เพื่อรับ dm_received จาก conversation ใดก็ได้
      const socket = connectSocket();
      convs.forEach((c) => socket.emit('join_dm', c.id));
    } catch {
      /* silent */
    }
  }, [wsId]);

  // โหลดครั้งแรก + poll ทุก 60s (backup กรณี socket หลุด)
  useEffect(() => {
    fetchAndJoin();
    const interval = setInterval(fetchAndJoin, 60_000);
    return () => clearInterval(interval);
  }, [fetchAndJoin]);

  // Real-time: เมื่อมี DM เข้าใหม่ หรือมีการ mark as read → re-fetch unread count
  useEffect(() => {
    const socket = connectSocket();

    const handleDMReceived = () => {
      // re-fetch เพื่อให้ได้ค่าที่แม่นยำ (กรณีเปิด DM นั้นอยู่ก็จะ mark as read ไปแล้ว)
      fetchAndJoin();
    };

    const handleDMRead = () => {
      // re-fetch เมื่อมีการอ่านข้อความ → badge ควรหายไปทันที
      fetchAndJoin();
    };

    socket.on('dm_received', handleDMReceived);
    socket.on('dm_read', handleDMRead);
    return () => {
      socket.off('dm_received', handleDMReceived);
      socket.off('dm_read', handleDMRead);
    };
  }, [fetchAndJoin]);

  // Reset เมื่อ workspace เปลี่ยน
  useEffect(() => {
    setTotalUnread(0);
  }, [wsId]);

  return { totalUnread, refresh: fetchAndJoin };
}
