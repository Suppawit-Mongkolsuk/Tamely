import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../../utils/jwt.utils';
import * as messageService from '../message/message.service';
import * as dmService from '../dm/dm.service';

// Export io instance สำหรับให้ REST routes ใช้ emit event ได้
let ioInstance: Server | null = null;
export const getIO = (): Server | null => ioInstance;

export const initSocketIO = (httpServer: HttpServer, allowedOrigins: string[]) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  ioInstance = io; // Store reference for REST routes

  // Map userId → Set of socketId (user อาจเปิดหลาย tab)
  const onlineUsers = new Map<string, Set<string>>();

  const setOnline = (userId: string, socketId: string) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socketId);
  };

  const setOffline = (userId: string, socketId: string) => {
    onlineUsers.get(userId)?.delete(socketId);
    if (onlineUsers.get(userId)?.size === 0) onlineUsers.delete(userId);
  };

  const isOnline = (userId: string) => onlineUsers.has(userId);

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        parseCookie(socket.handshake.headers.cookie ?? '')['accessToken'];

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId: string = (socket as any).userId;

    // Mark user as online และ broadcast ให้คนอื่นรู้
    setOnline(userId, socket.id);
    socket.broadcast.emit('user_online', { userId });

    // ให้ client ถาม status ของ user list ที่ต้องการได้
    socket.on('get_online_status', (userIds: string[], callback?: (res: Record<string, boolean>) => void) => {
      const statusMap: Record<string, boolean> = {};
      userIds.forEach((id) => { statusMap[id] = isOnline(id); });
      callback?.(statusMap);
    });

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on(
      'send_message',
      async (data: { roomId: string; content: string }, callback?: (res: any) => void) => {
        try {
          const message = await messageService.sendMessage(
            data.roomId,
            userId,
            data.content,
          );
          io.to(data.roomId).emit('message_received', message);
          callback?.({ success: true, data: message });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Send failed';
          callback?.({ success: false, error: msg });
        }
      },
    );

    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('user_typing', {
        userId,
        roomId: data.roomId,
        isTyping: data.isTyping,
      });
    });

    // ================================================================
    // DM — Direct Message events
    // ================================================================

    // เข้าร่วม room ของ DM conversation
    socket.on('join_dm', (conversationId: string) => {
      socket.join(`dm:${conversationId}`);
    });

    socket.on('leave_dm', (conversationId: string) => {
      socket.leave(`dm:${conversationId}`);
    });

    // ส่งข้อความ DM
    socket.on(
      'send_dm',
      async (
        data: { conversationId: string; content: string },
        callback?: (res: any) => void,
      ) => {
        try {
          const message = await dmService.sendMessage(
            data.conversationId,
            userId,
            data.content,
          );
          // ส่งให้ทุกคนในห้อง DM (รวมผู้ส่งด้วย เพื่อ sync ทุก tab)
          io.to(`dm:${data.conversationId}`).emit('dm_received', message);
          callback?.({ success: true, data: message });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Send failed';
          callback?.({ success: false, error: msg });
        }
      },
    );

    // Typing indicator สำหรับ DM
    socket.on('dm_typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`dm:${data.conversationId}`).emit('dm_user_typing', {
        userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    });

    socket.on('disconnect', () => {
      setOffline(userId, socket.id);
      // broadcast offline เฉพาะเมื่อไม่มี tab อื่นเปิดอยู่
      if (!isOnline(userId)) {
        socket.broadcast.emit('user_offline', { userId });
      }
    });
  });

  return io;
};

function parseCookie(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const key = pair.substring(0, idx).trim();
    cookies[key] = pair.substring(idx + 1).trim();
  });
  return cookies;
}
