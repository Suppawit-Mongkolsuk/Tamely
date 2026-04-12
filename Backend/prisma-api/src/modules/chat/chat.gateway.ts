import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MessageType } from '@prisma/client';
import { verifyToken } from '../../utils/jwt.utils';
import * as messageService from '../message/message.service';
import * as dmService from '../dm/dm.service';
import * as dmRepository from '../dm/dm.repository';
import { prisma } from '../../index';

type CallType = 'audio' | 'video';

interface ActiveCall {
  peerId: string;
  conversationId: string;
  callLogId?: string;
  startedAt?: number;
  callerId?: string;
  receiverId?: string;
  callType?: CallType;
}

interface CallContext {
  callerId: string;
  callerName: string;
  callerAvatarUrl: string | null;
  receiverId: string;
  conversationId: string;
  callType: CallType;
}

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
  const activeCalls = new Map<string, ActiveCall>();

  const setOnline = (userId: string, socketId: string) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socketId);
  };

  const setOffline = (userId: string, socketId: string) => {
    onlineUsers.get(userId)?.delete(socketId);
    if (onlineUsers.get(userId)?.size === 0) onlineUsers.delete(userId);
  };

  const isOnline = (userId: string) => onlineUsers.has(userId);

  const emitToUser = (targetUserId: string, event: string, data: unknown) => {
    const targetSockets = onlineUsers.get(targetUserId);
    if (!targetSockets?.size) return false;

    targetSockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
    return true;
  };

  const setActivePair = (
    userId: string,
    peerId: string,
    conversationId: string,
    callLogId?: string,
    startedAt?: number,
    callerId?: string,
    receiverId?: string,
    callType?: CallType,
  ) => {
    activeCalls.set(userId, {
      peerId,
      conversationId,
      callLogId,
      startedAt,
      callerId,
      receiverId,
      callType,
    });
  };

  const clearActivePair = (userId: string, peerId: string) => {
    activeCalls.delete(userId);
    activeCalls.delete(peerId);
  };

  const getDurationSeconds = (startedAt?: number) => {
    if (!startedAt) return undefined;
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  };

  const safeUpdateCallLog = async (
    callLogId: string | undefined,
    data: {
      status?: 'MISSED' | 'REJECTED' | 'ANSWERED' | 'ENDED';
      startedAt?: Date;
      endedAt?: Date;
      duration?: number;
    },
  ) => {
    if (!callLogId) return;

    try {
      await prisma.callLog.update({
        where: { id: callLogId },
        data,
      });
    } catch {
      // Ignore logging failures to avoid breaking signaling.
    }
  };

  const formatCallDuration = (durationSeconds?: number) => {
    if (!durationSeconds || durationSeconds <= 0) return '00:00';
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;

    if (hours > 0) {
      return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
    }

    return [minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  };

  const createCallSystemMessage = async (
    activeCall: ActiveCall,
    status: 'MISSED' | 'REJECTED' | 'ENDED',
  ) => {
    if (!activeCall.callerId || !activeCall.callType) return;

    const callLabel = activeCall.callType === 'video' ? 'Video call' : 'Voice call';
    const duration = getDurationSeconds(activeCall.startedAt);

    let content = '';
    if (status === 'ENDED' && activeCall.startedAt) {
      content = `📞 ${callLabel} ended • ${formatCallDuration(duration)}`;
    } else if (status === 'REJECTED') {
      content = `📞 ${callLabel} declined`;
    } else {
      content = `📞 Missed ${callLabel.toLowerCase()}`;
    }

    const message = await dmRepository.createMessage(
      activeCall.conversationId,
      activeCall.callerId,
      content,
      MessageType.SYSTEM,
    );

    io.to(`dm:${activeCall.conversationId}`).emit('dm_received', message);
  };

  const getCallContext = async (
    callerId: string,
    targetUserId: string,
    conversationId: string,
    callType: CallType,
  ): Promise<CallContext | null> => {
    const conversation = await prisma.directConversation.findUnique({
      where: { id: conversationId },
      include: {
        userA: { select: { id: true, Name: true, avatarUrl: true } },
        userB: { select: { id: true, Name: true, avatarUrl: true } },
      },
    });

    if (!conversation) return null;

    const isCallerParticipant =
      conversation.userAId === callerId || conversation.userBId === callerId;
    const isTargetParticipant =
      conversation.userAId === targetUserId || conversation.userBId === targetUserId;

    if (!isCallerParticipant || !isTargetParticipant || callerId === targetUserId) {
      return null;
    }

    const caller =
      conversation.userA.id === callerId ? conversation.userA : conversation.userB;

    return {
      callerId,
      callerName: caller.Name,
      callerAvatarUrl: caller.avatarUrl,
      receiverId: targetUserId,
      conversationId,
      callType,
    };
  };

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        parseCookie(socket.handshake.headers.cookie ?? '')['accessToken'];

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId;

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

    // ================================================================
    // 1-1 Call signaling events
    // ================================================================
    socket.on(
      'call_user',
      async (
        data: { targetUserId: string; conversationId: string; callType: CallType },
        callback?: (res: { success: boolean; error?: string }) => void,
      ) => {
        try {
          const context = await getCallContext(
            userId,
            data.targetUserId,
            data.conversationId,
            data.callType,
          );
          if (!context) {
            callback?.({ success: false, error: 'Invalid call context' });
            return;
          }

          // Busy check — caller กำลังโทรอยู่แล้ว
          if (activeCalls.has(userId)) {
            callback?.({ success: false, error: 'already_in_call' });
            return;
          }

          // Busy check — target กำลังโทรอยู่แล้ว
          if (activeCalls.has(data.targetUserId)) {
            socket.emit('call_failed', {
              targetUserId: data.targetUserId,
              conversationId: data.conversationId,
              reason: 'user_busy',
            });
            callback?.({ success: false, error: 'user_busy' });
            return;
          }

          const callLog = await prisma.callLog.create({
            data: {
              conversationId: context.conversationId,
              callerId: context.callerId,
              receiverId: context.receiverId,
              callType: context.callType === 'video' ? 'VIDEO' : 'AUDIO',
              status: 'MISSED',
            },
          });

          setActivePair(
            context.callerId,
            context.receiverId,
            context.conversationId,
            callLog.id,
            undefined,
            context.callerId,
            context.receiverId,
            context.callType,
          );

          const targetOnline = emitToUser(context.receiverId, 'incoming_call', {
            callerId: context.callerId,
            callerName: context.callerName,
            callerAvatarUrl: context.callerAvatarUrl,
            conversationId: context.conversationId,
            callType: context.callType,
          });

          if (targetOnline) {
            setActivePair(
              context.receiverId,
              context.callerId,
              context.conversationId,
              callLog.id,
              undefined,
              context.callerId,
              context.receiverId,
              context.callType,
            );
          }

          callback?.({ success: true });
        } catch (error) {
          callback?.({
            success: false,
            error: error instanceof Error ? error.message : 'Call failed',
          });
        }
      },
    );

    socket.on(
      'call_accepted',
      async (data: { callerId: string; conversationId: string }) => {
        const activeCall = activeCalls.get(userId);
        if (
          !activeCall ||
          activeCall.peerId !== data.callerId ||
          activeCall.conversationId !== data.conversationId
        ) {
          return;
        }

        const startedAt = Date.now();
        setActivePair(
          userId,
          data.callerId,
          data.conversationId,
          activeCall.callLogId,
          startedAt,
          activeCall.callerId,
          activeCall.receiverId,
          activeCall.callType,
        );
        setActivePair(
          data.callerId,
          userId,
          data.conversationId,
          activeCall.callLogId,
          startedAt,
          activeCall.callerId,
          activeCall.receiverId,
          activeCall.callType,
        );
        await safeUpdateCallLog(activeCall.callLogId, {
          status: 'ANSWERED',
          startedAt: new Date(startedAt),
        });

        emitToUser(data.callerId, 'call_accepted', {
          accepterId: userId,
          conversationId: data.conversationId,
        });
      },
    );

    socket.on(
      'call_rejected',
      async (data: { callerId: string; conversationId: string }) => {
        const activeCall = activeCalls.get(userId);
        if (
          !activeCall ||
          activeCall.peerId !== data.callerId ||
          activeCall.conversationId !== data.conversationId
        ) {
          return;
        }

        await safeUpdateCallLog(activeCall.callLogId, {
          status: 'REJECTED',
          endedAt: new Date(),
          duration: 0,
        });
        await createCallSystemMessage(activeCall, 'REJECTED');
        clearActivePair(userId, data.callerId);

        emitToUser(data.callerId, 'call_rejected', {
          rejecterId: userId,
          conversationId: data.conversationId,
        });
      },
    );

    socket.on(
      'call_ended',
      async (data: { targetUserId: string; conversationId: string }) => {
        const activeCall = activeCalls.get(userId);
        if (
          !activeCall ||
          activeCall.peerId !== data.targetUserId ||
          activeCall.conversationId !== data.conversationId
        ) {
          return;
        }

        const duration = getDurationSeconds(activeCall.startedAt);
        await safeUpdateCallLog(activeCall.callLogId, {
          status: activeCall.startedAt ? 'ENDED' : 'MISSED',
          endedAt: new Date(),
          duration,
        });
        await createCallSystemMessage(activeCall, activeCall.startedAt ? 'ENDED' : 'MISSED');
        clearActivePair(userId, data.targetUserId);

        emitToUser(data.targetUserId, 'call_ended', {
          endedBy: userId,
          conversationId: data.conversationId,
        });
      },
    );

    socket.on(
      'webrtc_offer',
      (data: { targetUserId: string; offer: unknown }) => {
        emitToUser(data.targetUserId, 'webrtc_offer', {
          callerId: userId,
          offer: data.offer,
        });
      },
    );

    socket.on(
      'webrtc_answer',
      (data: { targetUserId: string; answer: unknown }) => {
        emitToUser(data.targetUserId, 'webrtc_answer', {
          answererId: userId,
          answer: data.answer,
        });
      },
    );

    socket.on(
      'webrtc_ice_candidate',
      (data: { targetUserId: string; candidate: unknown }) => {
        emitToUser(data.targetUserId, 'webrtc_ice_candidate', {
          fromUserId: userId,
          candidate: data.candidate,
        });
      },
    );

    socket.on('disconnect', () => {
      setOffline(userId, socket.id);

      if (isOnline(userId)) {
        return;
      }

      const activeCall = activeCalls.get(userId);
      if (activeCall) {
        clearActivePair(userId, activeCall.peerId);
        void safeUpdateCallLog(activeCall.callLogId, {
          status: activeCall.startedAt ? 'ENDED' : 'MISSED',
          endedAt: new Date(),
          duration: getDurationSeconds(activeCall.startedAt),
        });
        void createCallSystemMessage(activeCall, activeCall.startedAt ? 'ENDED' : 'MISSED');
        emitToUser(activeCall.peerId, 'call_ended', {
          endedBy: userId,
          conversationId: activeCall.conversationId,
        });
      }

      socket.broadcast.emit('user_offline', { userId });
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
