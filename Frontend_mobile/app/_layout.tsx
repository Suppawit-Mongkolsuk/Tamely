import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import './global.css';
import { CallProvider } from '../lib/CallContext';
import { OnlineStatusProvider, useOnlineStatus } from '../lib/OnlineStatusContext';
import { API_BASE } from '../lib/config';

const PUBLIC_SEGMENTS = ['(auth)', 'index'];

const isExpoGo = Constants.executionEnvironment === 'storeClient' || (Constants as any).appOwnership === 'expo';

const dummyWebRTC = {
  callState: {
    status: 'idle' as const,
    peerId: null, peerName: null, peerAvatarUrl: null, conversationId: null,
    localStream: null, remoteStream: null, isMuted: false, callDuration: 0, isMinimized: false,
  },
  startCall: async (..._args: any[]) => {},
  acceptCall: async () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  minimizeCallUI: () => {},
  expandCallUI: () => {},
};

function getUseCallFeature() {
  if (isExpoGo) return (_args: any) => dummyWebRTC;
  return require('../hooks/useWebRTC').useWebRTC;
}
function getCallOverlay() {
  if (isExpoGo) return null;
  return require('../components/ui/CallOverlay').default;
}
const useCallFeature = getUseCallFeature();
const CallOverlayComponent: React.ComponentType<any> | null = getCallOverlay();

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    const currentSegment = segments[0] ?? 'index';
    const isPublic = PUBLIC_SEGMENTS.includes(currentSegment);
    if (!token && !isPublic) {
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, [segments]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        checkAuth();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [segments]);

  return null;
}

function GlobalCallOverlay({ onStartCall }: { onStartCall: (fn: typeof dummyWebRTC['startCall']) => void }) {
  const [currentUserId, setCurrentUserId] = useState('');
  const [token, setToken] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then(([[, t], [, u]]) => {
      setToken(t ?? '');
      setCurrentUserId(u ? JSON.parse(u ?? '{}')?.id ?? '' : '');
    });
  }, []);

  useEffect(() => {
    if (!token || !currentUserId) return;
    const timer = setTimeout(() => {
      const s = io(API_BASE, {
        auth: { token },
        transports: ['websocket'],
        extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
      });
      s.once('connect', () => setSocket(s));
    }, 500);
    return () => {
      clearTimeout(timer);
      setSocket(null);
    };
  }, [token, currentUserId]);

  useEffect(() => {
    return () => { socket?.disconnect(); };
  }, [socket]);

  const { setUserOnline, setUserOffline } = useOnlineStatus();

  useEffect(() => {
    if (!socket) return;
    socket.on('user_online', ({ userId }: { userId: string }) => setUserOnline(userId));
    socket.on('user_offline', ({ userId }: { userId: string }) => setUserOffline(userId));
    return () => {
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, setUserOnline, setUserOffline]);

  const { callState, startCall, acceptCall, rejectCall, endCall, toggleMute, minimizeCallUI, expandCallUI } =
    useCallFeature({ socket, currentUserId });

  useEffect(() => {
    onStartCall(startCall);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCall]);

  if (!CallOverlayComponent) return null;
  return (
    <CallOverlayComponent
      callState={callState}
      acceptCall={acceptCall}
      rejectCall={rejectCall}
      endCall={endCall}
      toggleMute={toggleMute}
      minimizeCallUI={minimizeCallUI}
      expandCallUI={expandCallUI}
    />
  );
}

export default function RootLayout() {
  const startCallRef = useRef<typeof dummyWebRTC['startCall']>(dummyWebRTC.startCall);
  const startCallProxy = useRef<typeof dummyWebRTC['startCall']>(
    (...args: Parameters<typeof dummyWebRTC['startCall']>) => startCallRef.current(...args)
  ).current;

  return (
    <OnlineStatusProvider>
      <CallProvider value={{ startCall: startCallProxy }}>
        <View style={{ flex: 1 }}>
          <AuthGuard />
          <GlobalCallOverlay onStartCall={(fn) => { startCallRef.current = fn; }} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(workspace)" />
            <Stack.Screen name="(screensDetail)" />
          </Stack>
        </View>
      </CallProvider>
    </OnlineStatusProvider>
  );
}
