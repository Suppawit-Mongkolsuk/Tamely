import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../../utils/jwt.utils';
import * as messageService from '../message/message.service';

export const initSocketIO = (httpServer: HttpServer, allowedOrigins: string[]) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

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

    socket.on('disconnect', () => {
      // cleanup if needed
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
