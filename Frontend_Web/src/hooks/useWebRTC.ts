import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { config } from '../lib/config';

const FALLBACK_ICE_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

async function fetchIceConfiguration(): Promise<RTCConfiguration> {
  try {
    const res = await fetch(`${config.apiUrl}/turn-credentials`);
    const data = await res.json() as { iceServers: RTCIceServer[] };

    if (!data.iceServers?.length) return FALLBACK_ICE_CONFIGURATION;

    console.log('[WebRTC] ICE config (metered):', JSON.stringify(data.iceServers));
    return { iceServers: data.iceServers, iceCandidatePoolSize: 10 };
  } catch {
    console.warn('[WebRTC] Failed to fetch TURN credentials, using fallback');
    return FALLBACK_ICE_CONFIGURATION;
  }
}

export interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callType: 'audio' | 'video';
  peerId: string | null;
  peerName: string | null;
  peerAvatarUrl: string | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  isMinimized: boolean;
}

interface UseWebRTCOptions {
  socket: Socket | null;
  currentUserId: string;
}

interface IncomingCallPayload {
  callerId: string;
  callerName: string;
  callerAvatarUrl: string | null;
  conversationId: string;
  callType: 'audio' | 'video';
}

interface CallAcceptedPayload {
  accepterId: string;
  conversationId: string;
}

interface CallRejectedPayload {
  rejecterId: string;
  conversationId: string;
}

interface CallEndedPayload {
  endedBy: string;
  conversationId: string;
}

interface CallFailedPayload {
  targetUserId: string;
  conversationId: string;
  reason: string;
}

interface CallUserAck {
  success: boolean;
  error?: string;
}

const initialState: CallState = {
  status: 'idle',
  callType: 'audio',
  peerId: null,
  peerName: null,
  peerAvatarUrl: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  callDuration: 0,
  isMinimized: false,
};

export interface UseWebRTCReturn {
  callState: CallState;
  startCall: (
    targetUserId: string,
    conversationId: string,
    callType: 'audio' | 'video',
    peerName?: string,
    peerAvatarUrl?: string | null,
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  minimizeCallUI: () => void;
  expandCallUI: () => void;
}

export function useWebRTC({
  socket,
  currentUserId,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [callState, setCallState] = useState<CallState>(initialState);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const autoRejectTimerRef = useRef<number | null>(null);
  const outgoingTimeoutRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  const clearAutoRejectTimer = useCallback(() => {
    if (autoRejectTimerRef.current) {
      window.clearTimeout(autoRejectTimerRef.current);
      autoRejectTimerRef.current = null;
    }
  }, []);

  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current) {
      window.clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const clearOutgoingTimeout = useCallback(() => {
    if (outgoingTimeoutRef.current) {
      window.clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearAutoRejectTimer();
    clearOutgoingTimeout();
    clearDurationInterval();
    pendingOfferRef.current = null;
    pendingIceCandidatesRef.current = [];
    setCallState(initialState);
  }, [clearAutoRejectTimer, clearDurationInterval, clearOutgoingTimeout]);

  const stopStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
  }, []);

  const closePeerConnection = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
  }, []);

  const cleanupCall = useCallback(() => {
    stopStreams();
    closePeerConnection();
    resetState();
    closingRef.current = false;
  }, [closePeerConnection, resetState, stopStreams]);

  const flushPendingIceCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    const pendingCandidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of pendingCandidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore malformed or duplicated candidates.
      }
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    clearDurationInterval();
    durationIntervalRef.current = window.setInterval(() => {
      setCallState((prev) => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);
  }, [clearDurationInterval]);

  const createPeerConnection = useCallback(
    async (stream: MediaStream, peerId: string, conversationId: string) => {
      closePeerConnection();

      const iceConfig = await fetchIceConfiguration();
      const pc = new RTCPeerConnection(iceConfig);
      peerConnectionRef.current = pc;

      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
      setCallState((prev) => ({ ...prev, remoteStream }));

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        setCallState((prev) => ({ ...prev, remoteStream }));
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate || !socket) return;
        socket.emit('webrtc_ice_candidate', {
          targetUserId: peerId,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          toast.error(
            turnUrlsConfigured()
              ? 'เชื่อมต่อสื่อไม่สำเร็จ กรุณาลองโทรใหม่อีกครั้ง'
              : 'เชื่อมต่อเสียงไม่สำเร็จ กรุณาตั้งค่า TURN server สำหรับการโทรข้ามเครือข่าย',
          );
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState((prev) => ({
            ...prev,
            status: 'connected',
            isMinimized: true,
          }));
          startDurationTimer();
        }

        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (!closingRef.current) {
            socket?.emit('call_ended', { targetUserId: peerId, conversationId });
          }
          cleanupCall();
        }
      };

      return pc;
    },
    [cleanupCall, closePeerConnection, socket, startDurationTimer],
  );

  const requestMedia = useCallback(async (callType: 'audio' | 'video') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });

    localStreamRef.current = stream;
    setCallState((prev) => ({
      ...prev,
      localStream: stream,
      isMuted: false,
      isVideoOff: callType === 'video'
        ? !(stream.getVideoTracks()[0]?.enabled ?? true)
        : true,
      isMinimized: false,
    }));

    return stream;
  }, []);

  const startCall = useCallback(
    async (
      targetUserId: string,
      conversationId: string,
      callType: 'audio' | 'video',
      peerName?: string,
      peerAvatarUrl?: string | null,
    ) => {
      if (!socket || !currentUserId) return;

      try {
        const stream = await requestMedia(callType);
        setCallState({
          status: 'calling',
          callType,
          peerId: targetUserId,
          peerName: peerName ?? null,
          peerAvatarUrl: peerAvatarUrl ?? null,
          conversationId,
          localStream: stream,
          remoteStream: null,
          isMuted: false,
          isVideoOff: callType === 'video'
            ? !(stream.getVideoTracks()[0]?.enabled ?? true)
            : true,
          callDuration: 0,
          isMinimized: false,
        });

        outgoingTimeoutRef.current = window.setTimeout(() => {
          if (!peerConnectionRef.current) {
            socket.emit('call_ended', { targetUserId, conversationId });
            toast.info('ไม่มีผู้รับสาย');
            cleanupCall();
          }
        }, 40000);

        socket.emit(
          'call_user',
          { targetUserId, conversationId, callType },
          (response?: CallUserAck) => {
            if (!response || response.success) return;

            clearOutgoingTimeout();
            cleanupCall();

            if (response.error === 'already_in_call') {
              toast.error('คุณกำลังอยู่ในสายอื่น');
              return;
            }

            if (response.error === 'user_busy') {
              toast.error('ผู้ใช้นี้กำลังโทรอยู่');
              return;
            }

            toast.error(response.error || 'เริ่มสายไม่สำเร็จ');
          },
        );
      } catch (error) {
        cleanupCall();
        toast.error(error instanceof Error ? error.message : 'เริ่มสายไม่สำเร็จ');
      }
    },
    [cleanupCall, clearOutgoingTimeout, currentUserId, requestMedia, socket],
  );

  const rejectCall = useCallback(() => {
    if (!socket || !callState.peerId || !callState.conversationId) {
      cleanupCall();
      return;
    }

    socket.emit('call_rejected', {
      callerId: callState.peerId,
      conversationId: callState.conversationId,
    });
    cleanupCall();
  }, [callState.conversationId, callState.peerId, cleanupCall, socket]);

  const acceptCall = useCallback(async () => {
    if (!socket || !callState.peerId || !callState.conversationId) return;

    try {
      clearAutoRejectTimer();
      const stream = await requestMedia(callState.callType);
      const pc = await createPeerConnection(stream, callState.peerId, callState.conversationId);

      setCallState((prev) => ({
        ...prev,
        status: 'connected',
        localStream: stream,
        callDuration: 0,
        isMinimized: true,
      }));

      socket.emit('call_accepted', {
        callerId: callState.peerId,
        conversationId: callState.conversationId,
      });

      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        pendingOfferRef.current = null;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', {
          targetUserId: callState.peerId,
          answer,
        });
        await flushPendingIceCandidates();
      }
    } catch (error) {
      cleanupCall();
      toast.error(error instanceof Error ? error.message : 'รับสายไม่สำเร็จ');
    }
  }, [
    callState.callType,
    callState.conversationId,
    callState.peerId,
    cleanupCall,
    clearAutoRejectTimer,
    createPeerConnection,
    flushPendingIceCandidates,
    requestMedia,
    socket,
  ]);

  const endCall = useCallback(() => {
    if (callState.peerId && callState.conversationId && socket) {
      closingRef.current = true;
      socket.emit('call_ended', {
        targetUserId: callState.peerId,
        conversationId: callState.conversationId,
      });
    }
    cleanupCall();
  }, [callState.conversationId, callState.peerId, cleanupCall, socket]);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setCallState((prev) => ({
      ...prev,
      isMuted: !audioTrack.enabled,
    }));
  }, []);

  const toggleVideo = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCallState((prev) => ({
      ...prev,
      isVideoOff: !videoTrack.enabled,
    }));
  }, []);

  const minimizeCallUI = useCallback(() => {
    setCallState((prev) => ({ ...prev, isMinimized: true }));
  }, []);

  const expandCallUI = useCallback(() => {
    setCallState((prev) => ({ ...prev, isMinimized: false }));
  }, []);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleIncomingCall = (payload: IncomingCallPayload) => {
      if (payload.callerId === currentUserId) return;

      if (callState.status !== 'idle' && callState.status !== 'ended') {
        socket.emit('call_rejected', {
          callerId: payload.callerId,
          conversationId: payload.conversationId,
        });
        return;
      }

      clearAutoRejectTimer();
      setCallState({
        status: 'ringing',
        callType: payload.callType,
        peerId: payload.callerId,
        peerName: payload.callerName,
        peerAvatarUrl: payload.callerAvatarUrl ?? null,
        conversationId: payload.conversationId,
        localStream: null,
        remoteStream: null,
        isMuted: false,
        isVideoOff: payload.callType === 'audio',
        callDuration: 0,
        isMinimized: false,
      });

      autoRejectTimerRef.current = window.setTimeout(() => {
        socket.emit('call_rejected', {
          callerId: payload.callerId,
          conversationId: payload.conversationId,
        });
        cleanupCall();
      }, 30000);
    };

    const handleCallAccepted = async (payload: CallAcceptedPayload) => {
      if (
        payload.accepterId !== callState.peerId ||
        payload.conversationId !== callState.conversationId ||
        !localStreamRef.current
      ) {
        return;
      }

      clearOutgoingTimeout();

      const pc = await createPeerConnection(
        localStreamRef.current,
        payload.accepterId,
        payload.conversationId,
      );

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', {
        targetUserId: payload.accepterId,
        offer,
      });
    };

    const handleCallRejected = (payload: CallRejectedPayload) => {
      if (
        payload.rejecterId !== callState.peerId ||
        payload.conversationId !== callState.conversationId
      ) {
        return;
      }

      toast.info(`${callState.peerName ?? 'ผู้ใช้'} ปฏิเสธสาย`);
      cleanupCall();
    };

    const handleCallEnded = (payload: CallEndedPayload) => {
      if (
        payload.endedBy !== callState.peerId ||
        payload.conversationId !== callState.conversationId
      ) {
        return;
      }

      toast.info('สายถูกวางแล้ว');
      cleanupCall();
    };

    const handleCallFailed = (payload: CallFailedPayload) => {
      if (
        payload.targetUserId !== callState.peerId ||
        payload.conversationId !== callState.conversationId
      ) {
        return;
      }

      if (payload.reason === 'user_busy') {
        toast.error('ผู้ใช้นี้กำลังโทรอยู่');
      } else {
        toast.error('เริ่มสายไม่สำเร็จ');
      }
      cleanupCall();
    };

    const handleWebRTCOffer = async (
      payload: { callerId: string; offer: RTCSessionDescriptionInit },
    ) => {
      if (
        payload.callerId !== callState.peerId ||
        callState.conversationId === null
      ) {
        return;
      }

      const pc = peerConnectionRef.current;
      if (!pc) {
        // PC ยังไม่ถูกสร้าง (offer มาก่อน acceptCall สร้าง PC) → เก็บไว้ก่อน
        pendingOfferRef.current = payload.offer;
        return;
      }

      // PC มีแล้ว → handle โดยตรง
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', {
        targetUserId: payload.callerId,
        answer,
      });
      await flushPendingIceCandidates();
    };

    const handleWebRTCAnswer = async (
      payload: { answererId: string; answer: RTCSessionDescriptionInit },
    ) => {
      if (payload.answererId !== callState.peerId || !peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(payload.answer),
      );
      await flushPendingIceCandidates();
    };

    const handleICECandidate = async (
      payload: { fromUserId: string; candidate: RTCIceCandidateInit },
    ) => {
      if (payload.fromUserId !== callState.peerId || !payload.candidate) return;

      const pc = peerConnectionRef.current;
      if (!pc?.remoteDescription) {
        pendingIceCandidatesRef.current.push(payload.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch {
        // Ignore malformed or duplicated candidates.
      }
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_failed', handleCallFailed);
    socket.on('webrtc_offer', handleWebRTCOffer);
    socket.on('webrtc_answer', handleWebRTCAnswer);
    socket.on('webrtc_ice_candidate', handleICECandidate);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_failed', handleCallFailed);
      socket.off('webrtc_offer', handleWebRTCOffer);
      socket.off('webrtc_answer', handleWebRTCAnswer);
      socket.off('webrtc_ice_candidate', handleICECandidate);
    };
  }, [
    callState.conversationId,
    callState.peerId,
    callState.peerName,
    callState.status,
    cleanupCall,
    clearAutoRejectTimer,
    clearOutgoingTimeout,
    createPeerConnection,
    currentUserId,
    flushPendingIceCandidates,
    socket,
  ]);

  useEffect(() => () => cleanupCall(), []);

  return useMemo(
    () => ({
      callState,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,
      minimizeCallUI,
      expandCallUI,
    }),
    [acceptCall, callState, endCall, expandCallUI, minimizeCallUI, rejectCall, startCall, toggleMute, toggleVideo],
  );
}

function turnUrlsConfigured() {
  return !!(import.meta.env.VITE_TURN_URLS?.trim());
}
