import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  socketRef,
  currentUserId,
}: {
  socketRef: React.RefObject<Socket | null>;
  currentUserId: string;
}): UseWebRTCReturn {
  const [callState, setCallState] = useState<CallState>(initialState);

  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const autoRejectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingRef = useRef(false);

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
      if (!event.candidate || !socketRef.current) return;
      socketRef.current.emit('webrtc_ice_candidate', {
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
          socketRef.current?.emit('call_ended', { targetUserId: peerId, conversationId });
        }
        cleanupCall();
      }
    };

    return pc;
  }, [closePc, startDurationTimer, cleanupCall, socketRef]);

  const startCall = useCallback(async (
    targetUserId: string,
    conversationId: string,
    peerName?: string,
    peerAvatarUrl?: string | null,
  ) => {
    if (!socketRef.current || !currentUserId) return;

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
          socketRef.current?.emit('call_ended', { targetUserId, conversationId });
          cleanupCall();
        }
      }, 40000);

      socketRef.current.emit('call_user', { targetUserId, conversationId, callType: 'audio' }, (res: any) => {
        if (!res || res.success) return;
        if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
        cleanupCall();
      });
    } catch (err) {
      cleanupCall();
      console.warn('[WebRTC] startCall error:', err);
    }
  }, [socketRef, currentUserId, requestAudio, cleanupCall]);

  const acceptCall = useCallback(async () => {
    if (!socketRef.current || !callState.peerId || !callState.conversationId) return;

    try {
      if (autoRejectTimerRef.current) clearTimeout(autoRejectTimerRef.current);
      const stream = await requestAudio();
      const pc = await createPc(stream, callState.peerId, callState.conversationId);

      setCallState((prev) => ({
        ...prev,
        status: 'connected',
        localStream: stream,
        callDuration: 0,
        isMinimized: false,
      }));

      socketRef.current.emit('call_accepted', {
        callerId: callState.peerId,
        conversationId: callState.conversationId,
      });

      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        pendingOfferRef.current = null;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current.emit('webrtc_answer', { targetUserId: callState.peerId, answer });
        await flushPendingCandidates();
      }
    } catch (err) {
      cleanupCall();
      console.warn('[WebRTC] acceptCall error:', err);
    }
  }, [socketRef, callState.peerId, callState.conversationId, requestAudio, createPc, flushPendingCandidates, cleanupCall]);

  const rejectCall = useCallback(() => {
    if (socketRef.current && callState.peerId && callState.conversationId) {
      socketRef.current.emit('call_rejected', {
        callerId: callState.peerId,
        conversationId: callState.conversationId,
      });
    }
    cleanupCall();
  }, [socketRef, callState.peerId, callState.conversationId, cleanupCall]);

  const endCall = useCallback(() => {
    if (socketRef.current && callState.peerId && callState.conversationId) {
      closingRef.current = true;
      socketRef.current.emit('call_ended', {
        targetUserId: callState.peerId,
        conversationId: callState.conversationId,
      });
    }
    cleanupCall();
  }, [socketRef, callState.peerId, callState.conversationId, cleanupCall]);

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

  // Socket event listeners
  useEffect(() => {
    if (!socketRef.current || !currentUserId) return;

    const onIncomingCall = (payload: any) => {
      if (payload.callerId === currentUserId) return;

      if (callState.status !== 'idle' && callState.status !== 'ended') {
        socketRef.current?.emit('call_rejected', {
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
        socketRef.current?.emit('call_rejected', {
          callerId: payload.callerId,
          conversationId: payload.conversationId,
        });
        cleanupCall();
      }, 30000);
    };

    const onCallAccepted = async (payload: any) => {
      if (
        payload.accepterId !== callState.peerId ||
        payload.conversationId !== callState.conversationId ||
        !localStreamRef.current
      ) return;

      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);

      const pc = await createPc(localStreamRef.current, payload.accepterId, payload.conversationId);
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('webrtc_offer', { targetUserId: payload.accepterId, offer });
    };

    const onCallRejected = (payload: any) => {
      if (payload.rejecterId !== callState.peerId) return;
      cleanupCall();
    };

    const onCallEnded = (payload: any) => {
      if (payload.endedBy !== callState.peerId) return;
      cleanupCall();
    };

    const onCallFailed = (payload: any) => {
      if (payload.targetUserId !== callState.peerId) return;
      cleanupCall();
    };

    const onOffer = async (payload: any) => {
      if (payload.callerId !== callState.peerId) return;
      const pc = pcRef.current;
      if (!pc) {
        pendingOfferRef.current = payload.offer;
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('webrtc_answer', { targetUserId: payload.callerId, answer });
      await flushPendingCandidates();
    };

    const onAnswer = async (payload: any) => {
      if (payload.answererId !== callState.peerId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      await flushPendingCandidates();
    };

    const onIceCandidate = async (payload: any) => {
      if (payload.fromUserId !== callState.peerId || !payload.candidate) return;
      const pc = pcRef.current;
      if (!pc?.remoteDescription) {
        pendingCandidatesRef.current.push(payload.candidate);
        return;
      }
      try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
    };

    socketRef.current.on('incoming_call', onIncomingCall);
    socketRef.current.on('call_accepted', onCallAccepted);
    socketRef.current.on('call_rejected', onCallRejected);
    socketRef.current.on('call_ended', onCallEnded);
    socketRef.current.on('call_failed', onCallFailed);
    socketRef.current.on('webrtc_offer', onOffer);
    socketRef.current.on('webrtc_answer', onAnswer);
    socketRef.current.on('webrtc_ice_candidate', onIceCandidate);

    return () => {
      socketRef.current?.off('incoming_call', onIncomingCall);
      socketRef.current?.off('call_accepted', onCallAccepted);
      socketRef.current?.off('call_rejected', onCallRejected);
      socketRef.current?.off('call_ended', onCallEnded);
      socketRef.current?.off('call_failed', onCallFailed);
      socketRef.current?.off('webrtc_offer', onOffer);
      socketRef.current?.off('webrtc_answer', onAnswer);
      socketRef.current?.off('webrtc_ice_candidate', onIceCandidate);
    };
  }, [
    socketRef,
    currentUserId,
    callState.status,
    callState.peerId,
    callState.conversationId,
    cleanupCall,
    createPc,
    flushPendingCandidates,
  ]);

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