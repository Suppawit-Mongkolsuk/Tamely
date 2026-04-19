import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import type { Socket } from 'socket.io-client';
import { API_BASE } from '@/lib/config';

const FALLBACK_ICE = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

async function fetchIceConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/turn-credentials`);
    const data = await res.json() as { iceServers: any[] };
    if (!data.iceServers?.length) return FALLBACK_ICE;
    return { iceServers: data.iceServers, iceCandidatePoolSize: 10 };
  } catch {
    return FALLBACK_ICE;
  }
}

export interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  peerId: string | null;
  peerName: string | null;
  peerAvatarUrl: string | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  callDuration: number;
  isMinimized: boolean;
}

const initialState: CallState = {
  status: 'idle',
  peerId: null,
  peerName: null,
  peerAvatarUrl: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  callDuration: 0,
  isMinimized: false,
};

export interface UseWebRTCReturn {
  callState: CallState;
  startCall: (
    targetUserId: string,
    conversationId: string,
    peerName?: string,
    peerAvatarUrl?: string | null,
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  minimizeCallUI: () => void;
  expandCallUI: () => void;
}

export function useWebRTC({
  socket,
  currentUserId,
}: {
  socket: Socket | null;
  currentUserId: string;
}): UseWebRTCReturn {
  const [callState, setCallState] = useState<CallState>(initialState);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<{ type: RTCSdpType; sdp: string } | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const autoRejectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingRef = useRef(false);
  // keep latest callState accessible inside event handlers without re-registering
  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const clearTimers = useCallback(() => {
    if (autoRejectTimerRef.current) clearTimeout(autoRejectTimerRef.current);
    if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    autoRejectTimerRef.current = null;
    outgoingTimeoutRef.current = null;
    durationIntervalRef.current = null;
  }, []);

  const stopStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;
  }, []);

  const closePc = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  const cleanupCall = useCallback(() => {
    stopStreams();
    closePc();
    clearTimers();
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    closingRef.current = false;
    setCallState(initialState);
  }, [stopStreams, closePc, clearTimers]);

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    durationIntervalRef.current = setInterval(() => {
      setCallState((prev) => ({ ...prev, callDuration: prev.callDuration + 1 }));
    }, 1000);
  }, []);

  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
  }, []);

  const requestAudio = useCallback(async () => {
    const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream as MediaStream;
    return stream as MediaStream;
  }, []);

  const createPc = useCallback(async (
    stream: MediaStream,
    peerId: string,
    conversationId: string,
  ) => {
    closePc();
    const iceConfig = await fetchIceConfig();
    const pc = new RTCPeerConnection(iceConfig as any) as any;
    pcRef.current = pc;

    const remoteStream = new MediaStream([]);
    setCallState((prev) => ({ ...prev, remoteStream: remoteStream as any }));

    stream.getTracks().forEach((track: any) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event: any) => {
      event.streams?.[0]?.getTracks().forEach((track: any) => {
        remoteStream.addTrack(track);
      });
      setCallState((prev) => ({ ...prev, remoteStream: remoteStream as any }));
    };

    pc.onicecandidate = (event: any) => {
      if (!event.candidate || !socket) return;
      socket.emit('webrtc_ice_candidate', {
        targetUserId: peerId,
        candidate: event.candidate.toJSON(),
      });
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[WebRTC] connection state:', state);
      if (state === 'connected') {
        setCallState((prev) => ({ ...prev, status: 'connected', isMinimized: false }));
        startDurationTimer();
      }
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        if (!closingRef.current) {
          socket?.emit('call_ended', { targetUserId: peerId, conversationId });
        }
        cleanupCall();
      }
    };

    return pc;
  }, [closePc, startDurationTimer, cleanupCall, socket]);

  const startCall = useCallback(async (
    targetUserId: string,
    conversationId: string,
    peerName?: string,
    peerAvatarUrl?: string | null,
  ) => {
    if (!socket || !currentUserId) return;

    try {
      const stream = await requestAudio();
      setCallState({
        status: 'calling',
        peerId: targetUserId,
        peerName: peerName ?? null,
        peerAvatarUrl: peerAvatarUrl ?? null,
        conversationId,
        localStream: stream,
        remoteStream: null,
        isMuted: false,
        callDuration: 0,
        isMinimized: false,
      });

      outgoingTimeoutRef.current = setTimeout(() => {
        if (!pcRef.current) {
          socket?.emit('call_ended', { targetUserId, conversationId });
          cleanupCall();
        }
      }, 40000);

      socket.emit('call_user', { targetUserId, conversationId, callType: 'audio' }, (res: any) => {
        if (!res || res.success) return;
        if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
        cleanupCall();
      });
    } catch (err) {
      cleanupCall();
      console.warn('[WebRTC] startCall error:', err);
    }
  }, [socket, currentUserId, requestAudio, cleanupCall]);

  const acceptCall = useCallback(async () => {
    const cs = callStateRef.current;
    if (!socket || !cs.peerId || !cs.conversationId) return;

    try {
      if (autoRejectTimerRef.current) clearTimeout(autoRejectTimerRef.current);
      const stream = await requestAudio();
      const pc = await createPc(stream, cs.peerId, cs.conversationId);

      setCallState((prev) => ({
        ...prev,
        status: 'connected',
        localStream: stream,
        callDuration: 0,
        isMinimized: false,
      }));

      socket.emit('call_accepted', {
        callerId: cs.peerId,
        conversationId: cs.conversationId,
      });

      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        pendingOfferRef.current = null;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { targetUserId: cs.peerId, answer });
        await flushPendingCandidates();
      }
    } catch (err) {
      cleanupCall();
      console.warn('[WebRTC] acceptCall error:', err);
    }
  }, [socket, requestAudio, createPc, flushPendingCandidates, cleanupCall]);

  const rejectCall = useCallback(() => {
    const cs = callStateRef.current;
    if (socket && cs.peerId && cs.conversationId) {
      socket.emit('call_rejected', {
        callerId: cs.peerId,
        conversationId: cs.conversationId,
      });
    }
    cleanupCall();
  }, [socket, cleanupCall]);

  const endCall = useCallback(() => {
    const cs = callStateRef.current;
    if (socket && cs.peerId && cs.conversationId) {
      closingRef.current = true;
      socket.emit('call_ended', {
        targetUserId: cs.peerId,
        conversationId: cs.conversationId,
      });
    }
    cleanupCall();
  }, [socket, cleanupCall]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0] as any;
    if (!track) return;
    track.enabled = !track.enabled;
    setCallState((prev) => ({ ...prev, isMuted: !track.enabled }));
  }, []);

  const minimizeCallUI = useCallback(() => {
    setCallState((prev) => ({ ...prev, isMinimized: true }));
  }, []);

  const expandCallUI = useCallback(() => {
    setCallState((prev) => ({ ...prev, isMinimized: false }));
  }, []);

  // Socket event listeners — re-register ทุกครั้งที่ socket instance เปลี่ยน
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const onIncomingCall = (payload: any) => {
      if (payload.callerId === currentUserId) return;
      const cs = callStateRef.current;
      if (cs.status !== 'idle' && cs.status !== 'ended') {
        socket.emit('call_rejected', {
          callerId: payload.callerId,
          conversationId: payload.conversationId,
        });
        return;
      }

      if (autoRejectTimerRef.current) clearTimeout(autoRejectTimerRef.current);

      setCallState({
        status: 'ringing',
        peerId: payload.callerId,
        peerName: payload.callerName,
        peerAvatarUrl: payload.callerAvatarUrl ?? null,
        conversationId: payload.conversationId,
        localStream: null,
        remoteStream: null,
        isMuted: false,
        callDuration: 0,
        isMinimized: false,
      });

      autoRejectTimerRef.current = setTimeout(() => {
        socket.emit('call_rejected', {
          callerId: payload.callerId,
          conversationId: payload.conversationId,
        });
        cleanupCall();
      }, 30000);
    };

    const onCallAccepted = async (payload: any) => {
      const cs = callStateRef.current;
      if (
        payload.accepterId !== cs.peerId ||
        payload.conversationId !== cs.conversationId ||
        !localStreamRef.current
      ) return;

      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);

      const pc = await createPc(localStreamRef.current, payload.accepterId, payload.conversationId);
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { targetUserId: payload.accepterId, offer });
    };

    const onCallRejected = (payload: any) => {
      const cs = callStateRef.current;
      if (payload.rejecterId !== cs.peerId) return;
      cleanupCall();
    };

    const onCallEnded = (payload: any) => {
      const cs = callStateRef.current;
      if (payload.endedBy !== cs.peerId) return;
      cleanupCall();
    };

    const onCallFailed = (payload: any) => {
      const cs = callStateRef.current;
      if (payload.targetUserId !== cs.peerId) return;
      cleanupCall();
    };

    const onOffer = async (payload: any) => {
      const cs = callStateRef.current;
      if (payload.callerId !== cs.peerId) return;
      const pc = pcRef.current;
      if (!pc) {
        pendingOfferRef.current = { type: payload.offer?.type as RTCSdpType, sdp: payload.offer?.sdp ?? '' };
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { targetUserId: payload.callerId, answer });
      await flushPendingCandidates();
    };

    const onAnswer = async (payload: any) => {
      const cs = callStateRef.current;
      if (payload.answererId !== cs.peerId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      await flushPendingCandidates();
    };

    const onIceCandidate = async (payload: any) => {
      const cs = callStateRef.current;
      if (payload.fromUserId !== cs.peerId || !payload.candidate) return;
      const pc = pcRef.current;
      if (!pc?.remoteDescription) {
        pendingCandidatesRef.current.push(payload.candidate);
        return;
      }
      try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
    };

    socket.on('incoming_call', onIncomingCall);
    socket.on('call_accepted', onCallAccepted);
    socket.on('call_rejected', onCallRejected);
    socket.on('call_ended', onCallEnded);
    socket.on('call_failed', onCallFailed);
    socket.on('webrtc_offer', onOffer);
    socket.on('webrtc_answer', onAnswer);
    socket.on('webrtc_ice_candidate', onIceCandidate);

    return () => {
      socket.off('incoming_call', onIncomingCall);
      socket.off('call_accepted', onCallAccepted);
      socket.off('call_rejected', onCallRejected);
      socket.off('call_ended', onCallEnded);
      socket.off('call_failed', onCallFailed);
      socket.off('webrtc_offer', onOffer);
      socket.off('webrtc_answer', onAnswer);
      socket.off('webrtc_ice_candidate', onIceCandidate);
    };
  }, [socket, currentUserId, cleanupCall, createPc, flushPendingCandidates]);

  useEffect(() => () => {
    cleanupCall();
  }, [cleanupCall]);

  return useMemo(() => ({
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    minimizeCallUI,
    expandCallUI,
  }), [callState, startCall, acceptCall, rejectCall, endCall, toggleMute, minimizeCallUI, expandCallUI]);
}
