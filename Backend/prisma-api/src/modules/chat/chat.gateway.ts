import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MessageType } from '@prisma/client';
import { verifyToken } from '../../utils/jwt.utils';
import * as messageService from '../message/message.service';
import * as dmService from '../dm/dm.service';
import * as dmRepository from '../dm/dm.repository';
import * as authRepository from '../auth/auth.repository';
import { prisma } from '../../index';

type CallType = 'audio' | 'video';

interface ActiveCall { // ข้อมูลการโทรที่กำลัง active อยู่ของแต่ละ userId (key)
  peerId: string;
  conversationId: string;
  callLogId?: string;
  startedAt?: number;
  callerId?: string;
  receiverId?: string;
  callType?: CallType;
}

interface CallContext { // ข้อมูลบริบทของการโทรที่จำเป็นต้องใช้ตอน signaling
  callerId: string;
  callerName: string;
  callerAvatarUrl: string | null;
  receiverId: string;
  conversationId: string;
  callType: CallType;
}

let ioInstance: Server | null = null;

export const getIO = (): Server | null => ioInstance; // ฟังก์ชันนี้ใช้สำหรับดึงตัว Socket.IO instance ที่ถูกสร้างขึ้นมาแล้ว เพื่อให้โมดูลอื่นๆ สามารถใช้งานได้ 

export const initSocketIO = (httpServer: HttpServer, allowedOrigins: string[]) => {  // สร้างและตั้งค่า Socket.IO
  const io = new Server(httpServer, { // สร้าง Socket.IO server ที่เชื่อมต่อกับ HTTP server และตั้งค่า CORS
    cors: {
      origin: allowedOrigins, // อนุญาตให้เชื่อมต่อจาก origins ที่ระบุเท่านั้น
      credentials: true, // อนุญาตให้ส่งคุกกี้และข้อมูลรับรองอื่นๆ ในการเชื่อมต่อข้าม origin
    },
  });

  ioInstance = io; // เก็บ instance ของ Socket.IO เพื่อให้โมดูลอื่นๆ สามารถใช้งานได้

  const onlineUsers = new Map<string, Set<string>>();// เก็บว่า user ไหนออนไลน์อยู่ และมี socket อะไรบ้าง
  const activeCalls = new Map<string, ActiveCall>();// เก็บข้อมูลว่าตอนนี้ user ไหนกำลังอยู่ในสายกับใคร เพื่อใช้ตรวจสอบเวลามีสายเข้าใหม่

  const setOnline = (userId: string, socketId: string) => { // เพิ่ม socketId ของ userId ที่ออนไลน์อยู่ในแผนที่ onlineUsers
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set()); // ถ้า userId ยังไม่มี onlineUsers ให้สร้าง entry ใหม่ที่มีค่าเป็น Set ว่างๆ 
    onlineUsers.get(userId)!.add(socketId); // เพิ่ม 
  };

  const setOffline = (userId: string, socketId: string) => {
    onlineUsers.get(userId)?.delete(socketId); // ลบ socketId ที่ออกจาก onlineUsers ของ userId นั้น
    if (onlineUsers.get(userId)?.size === 0) onlineUsers.delete(userId); // ลบ entry ของ userId ออกจาก onlineUsers
  };

  const isOnline = (userId: string) => onlineUsers.has(userId); // เช็คว่า ออนไลนืไหม

  const emitToUser = (targetUserId: string, event: string, data: unknown) => { // ฟังก์ชันนี้เอาไว้ส่ง event ไปหา user เฉพาะคน
    const targetSockets = onlineUsers.get(targetUserId); // ดึง socketId ทั้งหมดของ user นั้นๆ ที่ออนไลน์อยู่
    if (!targetSockets?.size) return false;

    targetSockets.forEach((socketId) => { // ส่ง event ไปยัง socketId ทั้งหมดของ user นั้นๆ
      io.to(socketId).emit(event, data);
    });
    return true;
  };

  const setActivePair = ( // บันทึกข้อมูลการโทรที่กำลัง active อยู่ของ userId หนึ่ง กับ peerId อีกฝ่ายหนึ่ง
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

  const clearActivePair = (userId: string, peerId: string) => { // ลบข้อมูลการโทรที่ active อยู่ของ userId และ peerId ออก
    activeCalls.delete(userId);
    activeCalls.delete(peerId);
  };

  const getDurationSeconds = (startedAt?: number) => { // คำนวณระยะเวลาที่โทรไปแล้วเป็นวินาที
    if (!startedAt) return undefined;
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  };

  const safeUpdateCallLog = async ( // อัปเดตข้อมูลการโทรในฐานข้อมูล
    callLogId: string | undefined, // ถ้าไม่มี callLogId ก็ไม่ต้องอัปเดต
    data: {
      status?: 'MISSED' | 'REJECTED' | 'ANSWERED' | 'ENDED';
      startedAt?: Date;
      endedAt?: Date;
      duration?: number;
    },
  ) => {
    if (!callLogId) return; // ถ้าไม่มี callLogId ก็ไม่ต้องอัปเดต
    try {
      await prisma.callLog.update({ where: { id: callLogId }, data }); // อัปเดตข้อมูลการโทรในฐานข้อมูลตาม callLogId และข้อมูลที่ได้รับมา
    } catch {
      // ignore
    }
  };

  const formatCallDuration = (durationSeconds?: number) => { // แปลงระยะเวลาที่โทรเป็นวินาที ให้เป็นรูปแบบที่อ่านง่าย เช่น 01:23 หรือ 01:02:45
    if (!durationSeconds || durationSeconds <= 0) return '00:00';
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;

    if (hours > 0) { // ถ้ามีชั่วโมง ให้แสดงรูปแบบ HH:MM:SS
      return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
    }
    return [minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const createCallSystemMessage = async ( // สร้างข้อความระบบสำหรับการโทร
    activeCall: ActiveCall, // ข้อมูลการโทรที่กำลัง active อยู่ของ userId หนึ่ง กับ peerId อีกฝ่ายหนึ่ง
    status: 'MISSED' | 'REJECTED' | 'ENDED',
  ) => {
    if (!activeCall.callerId || !activeCall.callType) return; // ถ้าข้อมูลการโทรไม่ครบถ้วน ก็ไม่ต้องสร้างข้อความระบบ

    const callLabel = activeCall.callType === 'video' ? 'Video call' : 'Voice call'; // แปลง callType เป็นข้อความที่อ่านง่าย เช่น Video call หรือ Voice call
    const duration = getDurationSeconds(activeCall.startedAt); // คำนวณระยะเวลาที่โทรไปแล้วเป็นวินาที เพื่อใช้แสดงในข้อความระบบตอนสายจบ

    let content = ''; // สร้างเนื้อหาข้อความระบบตามสถานะของการโทร
    if (status === 'ENDED' && activeCall.startedAt) {
      content = `${callLabel} ended - ${formatCallDuration(duration)}`; // ถ้าสายจบและมีข้อมูลเวลาเริ่มต้น ให้แสดงข้อความว่า ended พร้อมกับระยะเวลาที่โทร
    } else if (status === 'REJECTED') {
      content = `${callLabel} declined`; // ถ้าสายถูกปฏิเสธ ให้แสดงข้อความว่า declined
    } else {
      content = `Missed ${callLabel.toLowerCase()}`; // ถ้าสายไม่ได้รับ ให้แสดงข้อความว่า missed
    }

    const message = await dmRepository.createMessage( // สร้างข้อความระบบในฐานข้อมูล 
      activeCall.conversationId,
      activeCall.callerId,
      content,
      MessageType.SYSTEM,
    );

    io.to(`dm:${activeCall.conversationId}`).emit('dm_received', message); // ส่งข้อความระบบนี้ไปยังผู้ใช้ใน conversation นั้นๆ ผ่าน Socket.IO
  };

  const getCallContext = async ( // ดึงข้อมูลบคนที่โทร
    callerId: string,
    targetUserId: string, // คนที่ถูกโทรไป
    conversationId: string, // conversation ที่ใช้โทร
    callType: CallType, // ประเภทของการโทร (video หรือ voice)
  ): Promise<CallContext | null> => {
    const conversation = await prisma.directConversation.findUnique({ //
      where: { id: conversationId }, // ดึงข้อมูล conversation จากฐานข้อมูลตาม conversationId
      select: {
        userAId: true,
        userBId: true,
        userA: { select: { id: true, Name: true, avatarUrl: true } },
        userB: { select: { id: true, Name: true, avatarUrl: true } },
      },
    });

    if (!conversation) return null; // ถ้าไม่พบ conversation ในฐานข้อมูล ให้คืนค่า null

    const isCallerParticipant = // ตรวจสอบว่า callerId 
      conversation.userAId === callerId || conversation.userBId === callerId;
    const isTargetParticipant = // ตรวจสอบว่า targetUserId เป็นผู้เข้าร่วมใน conversation นี้หรือไม่
      conversation.userAId === targetUserId || conversation.userBId === targetUserId;

    if (!isCallerParticipant || !isTargetParticipant || callerId === targetUserId) { // ถ้า callerId หรือ targetUserId ไม่ใช่ผู้เข้าร่วมใน conversation นี้ หรือ callerId กับ targetUserId เป็นคนเดียวกัน ให้คืนค่า null เพราะไม่สามารถโทรได้
      return null;
    }

    const caller = // ดึงข้อมูลของผู้โทรจาก conversation โดยดูว่า callerId ตรงกับ userA หรือ userB
      conversation.userA.id === callerId ? conversation.userA : conversation.userB;

    return { // คืนข้อมูลบริบทของการโทรที่จำเป็นต้องใช้ตอน signaling
      callerId,
      callerName: caller.Name,
      callerAvatarUrl: caller.avatarUrl,
      receiverId: targetUserId,
      conversationId,
      callType,
    };
  };

  io.use((socket, next) => { // middleware นี้จะทำงานก่อนที่ socket จะเชื่อมต่อ เพื่อทำการตรวจสอบ token ว่าถูกต้องและยังไม่หมดอายุหรือไม่
    try {
      const token =
        socket.handshake.auth?.token ||
        parseCookie(socket.handshake.headers.cookie ?? '')['accessToken']; // ดึง token จากข้อมูลการเชื่อมต่อของ socket โดยจะดูใน handshake.auth.token ก่อน ถ้าไม่มีค่อยดูในคุกกี้ที่ชื่อ accessToken

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token); // ตรวจสอบความถูกต้องของ token และดึงข้อมูล payload 
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => { // เมื่อมีการเชื่อมต่อเข้ามาใหม่ จะทำงานในส่วนนี้
    const userId: string = socket.data.userId;

    setOnline(userId, socket.id);
    socket.broadcast.emit('user_online', { userId }); // แจ้งให้ผู้ใช้คนอื่นๆ รู้ว่า userId นี้ออนไลน์แล้ว

    // join personal room เพื่อรับ in-app notification
    socket.join(`user:${userId}`); // ให้ socket นี้เข้าร่วมห้องที่มีชื่อว่า user:userId เพื่อให้สามารถส่งการแจ้งเตือนไปยังผู้ใช้คนนี้ได้โดยตรงผ่านห้องนี้

    socket.on('get_online_status', (userIds: string[], callback?: (res: Record<string, boolean>) => void) => { 
      const statusMap: Record<string, boolean> = {};
      userIds.forEach((id) => { statusMap[id] = isOnline(id); }); // สร้างสถานะออนไลน์ของ userIds 
      callback?.(statusMap); // ส่งสถานะออนไลน์กลับไปยัง client ผ่าน callback
    });

    socket.on('join_room', (roomId: string) => { // ให้ socket นี้เข้าร่วมห้องที่มีชื่อว่า roomId เพื่อให้สามารถส่งและรับข้อความในห้องนี้ได้
      socket.join(roomId); //
    });

    socket.on('leave_room', (roomId: string) => { // ให้ socket นี้ออกจากห้องที่มีชื่อว่า roomId
      socket.leave(roomId);
    });

    socket.on( // เมื่อมีการส่งข้อความในห้องแชท ให้ทำการบันทึกข้อความลงฐานข้อมูล และส่งข้อความนั้นไปยังผู้ใช้ในห้องเดียวกันผ่าน Socket.IO
      'send_message', 
      async (data: { roomId: string; content: string }, callback?: (res: any) => void) => {
        try {
          const message = await messageService.sendMessage(
            data.roomId,
            userId,
            data.content,
          );
          io.to(data.roomId).emit('message_received', { ...message, roomId: data.roomId }); // ส่งข้อความที่ถูกสร้างใหม่ไปยังผู้ใช้ในห้องเดียวกันอยู่ในห้องไหน
          callback?.({ success: true, data: message });
        } catch (error) { // ถ้ามีข้อผิดพลาดเกิดขึ้น เช่น ไม่สามารถบันทึกข้อความลงฐานข้อมูลได้ ให้ส่ง error กลับไปยัง client ผ่าน callback
          const msg = error instanceof Error ? error.message : 'Send failed';
          callback?.({ success: false, error: msg });
        }
      },
    );

    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => { // เมื่อมีการพิมพ์ข้อความในห้องแชท ให้ส่งสถานะการพิมพ์ไปยังผู้ใช้ในห้องเดียวกันผ่าน Socket.IO
      socket.to(data.roomId).emit('user_typing', { // ส่งสถานะการพิมพ์ไปยังผู้ใช้ในห้องเดียวกันผ่าน Socket.IO
        userId,
        roomId: data.roomId,
        isTyping: data.isTyping,
      });
    });

    // ================================================================
    // DM
    // ================================================================

    socket.on('join_dm', (conversationId: string) => { // ให้ socket นี้เข้าร่วมห้องที่มีชื่อว่า dm:conversationId เพื่อให้สามารถส่งและรับข้อความใน DM conversation นี้ได้
      socket.join(`dm:${conversationId}`);
    });

    socket.on('leave_dm', (conversationId: string) => { // ให้ socket นี้ออกจากห้องที่มีชื่อว่า dm:conversationId
      socket.leave(`dm:${conversationId}`);
    });

    socket.on(
      'send_dm', // เมื่อมีการส่งข้อความใน DM conversation ให้ทำการบันทึกข้อความลงฐานข้อมูล และส่งข้อความนั้นไปยังผู้ใช้ใน conversation เดียวกันผ่าน Socket.IO
      async (
        data: { conversationId: string; content: string },
        callback?: (res: any) => void,
      ) => {
        try {
          const message = await dmService.sendMessage(data.conversationId, userId, data.content); 
          io.to(`dm:${data.conversationId}`).emit('dm_received', { // ส่งข้อความที่ถูกสร้างใหม่ไปยังผู้ใช้ใน conversation เดียวกันผ่าน Socket.IO โดยส่งไปยังห้อง dm:conversationId
            ...message,
            conversationId: data.conversationId,
          });
          callback?.({ success: true, data: message });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Send failed';
          callback?.({ success: false, error: msg });
        }
      },
    );

    socket.on('dm_typing', (data: { conversationId: string; isTyping: boolean }) => { // เมื่อมีการพิมพ์ข้อความใน DM conversation ให้ส่งสถานะการพิมพ์ไปยังผู้ใช้ใน conversation เดียวกันผ่าน Socket.IO
      socket.to(`dm:${data.conversationId}`).emit('dm_user_typing', { // ส่งสถานะการพิมพ์ไปยังผู้ใช้ใน conversation เดียวกันผ่าน Socket.IO
        userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    });

    // ================================================================
    // Call signaling
    // ================================================================

    socket.on(
      'call_user', // เมื่อมีการโทรเข้ามาใหม่ ให้ตรวจสอบความถูกต้องของข้อมูลการโทร และสถานะของผู้ใช้ที่เกี่ยวข้อง ถ้าทุกอย่างถูกต้อง ให้บันทึกข้อมูลการโทรลงฐานข้อมูล และส่งสัญญาณการโทรไปยังผู้ใช้เป้าหมายผ่าน Socket.IO
      async (
        data: { targetUserId: string; conversationId: string; callType: CallType },
        callback?: (res: { success: boolean; error?: string }) => void,
      ) => {
        try {
          const context = await getCallContext(userId, data.targetUserId, data.conversationId, data.callType);
          if (!context) { 
            callback?.({ success: false, error: 'Invalid call context' });
            return;
          }

          if (activeCalls.has(userId)) { // ถ้าอยุ่ในสายโทรไหม่ได้
            callback?.({ success: false, error: 'already_in_call' });
            return;
          }

          if (activeCalls.has(data.targetUserId)) {
            socket.emit('call_failed', {
              targetUserId: data.targetUserId,
              conversationId: data.conversationId,
              reason: 'user_busy',
            });
            callback?.({ success: false, error: 'user_busy' });
            return;
          }

          const callLog = await prisma.callLog.create({ // สร้างข้อมูลการโทรใหม่ในฐานข้อมูล โดยสถานะเริ่มต้นจะเป็น MISSED เพราะยังไม่มีใครรับสาย
            data: {
              conversationId: context.conversationId,
              callerId: context.callerId,
              receiverId: context.receiverId,
              callType: context.callType === 'video' ? 'VIDEO' : 'AUDIO',
              status: 'MISSED',
            },
          });

          setActivePair( // บันทึกข้อมูลการโทรที่กำลัง active อยู่ของ callerId กับ receiverId เพื่อใช้ตรวจสอบเวลามีสายเข้าใหม่
            context.callerId,
            context.receiverId,
            context.conversationId,
            callLog.id,
            undefined,
            context.callerId,
            context.receiverId,
            context.callType,
          );

          const targetOnline = emitToUser(context.receiverId, 'incoming_call', { // ส่งสัญญาณการโทรไปยังผู้ใช้เป้าหมายผ่าน Socket.IO หน้าโทร
            callerId: context.callerId,
            callerName: context.callerName,
            callerAvatarUrl: context.callerAvatarUrl,
            conversationId: context.conversationId,
            callType: context.callType,
          });

          if (targetOnline) { // ถ้าผู้ใช้เป้าหมายออนไลน์ ให้บันทึกข้อมูลการโทรที่กำลัง active อยู่ของ receiverId กับ callerId
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

    socket.on('call_accepted', async (data: { callerId: string; conversationId: string }) => { // เมื่อรับสายให้ตรวจสอบการโทร ว่าตรงไหม ถ้าตรงให้บันทึกเวลาที่เริ่มโทร และส่งสัญญาณว่ารับสายไปยังผู้โทรผ่าน Socket.IO
      const activeCall = activeCalls.get(userId); // ดึงข้อมูลการโทรที่กำลัง active อยู่ของ userId นี้มาเพื่อตรวจสอบว่า ตรงกับ callerId และ conversationId ที่ได้รับมาหรือไม่
      if (!activeCall || activeCall.peerId !== data.callerId || activeCall.conversationId !== data.conversationId) return;

      const startedAt = Date.now(); // บันทึกเวลาที่เริ่มโทรเป็น timestamp ปัจจุบัน เพื่อใช้คำนวณระยะเวลาที่โทรในภายหลัง
      setActivePair(userId, data.callerId, data.conversationId, activeCall.callLogId, startedAt, activeCall.callerId, activeCall.receiverId, activeCall.callType);
      setActivePair(data.callerId, userId, data.conversationId, activeCall.callLogId, startedAt, activeCall.callerId, activeCall.receiverId, activeCall.callType);
      await safeUpdateCallLog(activeCall.callLogId, { status: 'ANSWERED', startedAt: new Date(startedAt) });

      emitToUser(data.callerId, 'call_accepted', { accepterId: userId, conversationId: data.conversationId });
    });

    socket.on('call_rejected', async (data: { callerId: string; conversationId: string }) => { // เมื่อปฏิเสธสายให้ตรวจสอบการโทร ว่าตรงไหม ถ้าตรงให้บันทึกสถานะการโทรเป็น REJECTED และส่งสัญญาณว่าปฏิเสธสายไปยังผู้โทรผ่าน Socket.IO
      const activeCall = activeCalls.get(userId);
      if (!activeCall || activeCall.peerId !== data.callerId || activeCall.conversationId !== data.conversationId) return;

      await safeUpdateCallLog(activeCall.callLogId, { status: 'REJECTED', endedAt: new Date(), duration: 0 }); // อัปเดตข้อมูลการโทรในฐานข้อมูล โดยสถานะจะเป็น REJECTED 
      clearActivePair(userId, data.callerId); // ลบข้อมูลการโทรที่ active อยู่ของ userId และ callerId ออก เพราะสายนี้จบแล้ว

      emitToUser(data.callerId, 'call_rejected', { rejecterId: userId, conversationId: data.conversationId }); // ส่งสัญญาณว่าปฏิเสธสายไปยังผู้โทรผ่าน Socket.IO
    });

    socket.on('call_ended', async (data: { targetUserId: string; conversationId: string }) => { // เมื่อว่างสาย
      const activeCall = activeCalls.get(userId);
      if (!activeCall || activeCall.peerId !== data.targetUserId || activeCall.conversationId !== data.conversationId) return;

      const duration = getDurationSeconds(activeCall.startedAt); // คำนวณระยะเวลาที่โทร
      await safeUpdateCallLog(activeCall.callLogId, { // อัปเดตข้อมูลการโทรในฐานข้อมูล โดยสถานะจะเป็น ENDED ถ้ามีการรับสายเกิดขึ้น หรือ MISSED ถ้าไม่มีการรับสายเกิดขึ้น
        status: activeCall.startedAt ? 'ENDED' : 'MISSED',
        endedAt: new Date(),
        duration, // บันทึกระยะเวลาที่โทรไปในฐานข้อมูลด้วย
      });
      await createCallSystemMessage(activeCall, activeCall.startedAt ? 'ENDED' : 'MISSED'); // สร้างข้อความระบบสำหรับการโทรนี้ 
      clearActivePair(userId, data.targetUserId);

      emitToUser(data.targetUserId, 'call_ended', { endedBy: userId, conversationId: data.conversationId });
    });

    socket.on('webrtc_offer', (data: { targetUserId: string; offer: unknown }) => { // เมื่อมีการส่งสัญญาณ offer สำหรับการโทรผ่าน WebRTC ให้ส่งสัญญาณนี้ไปยังผู้ใช้เป้าหมายผ่าน Socket.IO 
      emitToUser(data.targetUserId, 'webrtc_offer', { callerId: userId, offer: data.offer }); 
    });

    socket.on('webrtc_answer', (data: { targetUserId: string; answer: unknown }) => {
      emitToUser(data.targetUserId, 'webrtc_answer', { answererId: userId, answer: data.answer });
    });

    socket.on('webrtc_ice_candidate', (data: { targetUserId: string; candidate: unknown }) => { // เมื่อมีการส่งสัญญาณ ICE candidate สำหรับการโทรผ่าน WebRTC ให้ส่งสัญญาณนี้ไปยังผู้ใช้เป้าหมายผ่าน Socket.IO
      emitToUser(data.targetUserId, 'webrtc_ice_candidate', { fromUserId: userId, candidate: data.candidate });
    });

    socket.on('disconnect', () => { // เมื่อมีการตัดการเชื่อมต่อออก ให้ทำการอัปเดตสถานะออนไลน์ของผู้ใช้ และถ้าผู้ใช้นั้นกำลังอยู่ในสายโทรอยู่ ให้บันทึกข้อมูลการโทรที่กำลัง active อยู่ของผู้ใช้นั้นให้จบลง และส่งสัญญาณว่าผู้ใช้นั้นออฟไลน์ไปยังผู้ใช้คนอื่นๆ ผ่าน Socket.IO
      setOffline(userId, socket.id);

      if (isOnline(userId)) return;

      void authRepository.updateUser(userId, { lastSeenAt: new Date() });

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

function parseCookie(cookieHeader: string): Record<string, string> { // ฟังก์ชันนี้ใช้สำหรับแปลงค่า cookie ที่อยู่ในรูปแบบ string ให้เป็น object ที่มี key เป็นชื่อ cookie และ value เป็นค่าของ cookie นั้นๆ
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((pair) => { // แยกแต่ละคู่ของ cookie โดยใช้เครื่องหมาย ; เป็นตัวแบ่ง แล้วทำการวนลูปแต่ละคู่
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const key = pair.substring(0, idx).trim();
    cookies[key] = pair.substring(idx + 1).trim();
  });
  return cookies; // คืนค่า object ที่มี key เป็นชื่อ cookie และ value เป็นค่าของ cookie นั้นๆ
}