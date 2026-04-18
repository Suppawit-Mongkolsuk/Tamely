import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import InAppNotificationBanner from '../../components/ui/InAppNoti';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { API_BASE } from '../../lib/config';
import { CallProvider } from '../../lib/CallContext';
import { OnlineStatusProvider, useOnlineStatus } from '../../lib/OnlineStatusContext';

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

// lazy require — ต้องอยู่ใน function ไม่ใช่ top-level เพราะ Expo Go ไม่มี react-native-webrtc
function getUseCallFeature() {
  if (isExpoGo) return (_args: any) => dummyWebRTC;
  return require('../../hooks/useWebRTC').useWebRTC; // eslint-disable-line @typescript-eslint/no-var-requires
}
function getCallOverlay() {
  if (isExpoGo) return null;
  return require('../../components/ui/CallOverlay').default; // eslint-disable-line @typescript-eslint/no-var-requires
}
const useCallFeature = getUseCallFeature();
const CallOverlayComponent: React.ComponentType<any> | null = getCallOverlay();


  
export default function TabLayout() {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const startCallRef = useRef<typeof dummyWebRTC['startCall']>(dummyWebRTC.startCall);

  const startCallProxy = useRef<typeof dummyWebRTC['startCall']>(
    (...args: Parameters<typeof dummyWebRTC['startCall']>) => startCallRef.current(...args)
  ).current;

  useEffect(() => {
    AsyncStorage.getItem('token').then((token) => {
      setIsLoggedIn(!!token);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color="#425C95" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <OnlineStatusProvider>
    <CallProvider value={{ startCall: startCallProxy }}>
      <View style={{ flex: 1 }}>
        <InAppNotificationBanner />
        <GlobalCallOverlay onStartCall={(fn) => { startCallRef.current = fn; }} />
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen
            name="feed"
            options={{
              title: 'Feed',
              tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="chats"
            options={{
              title: 'Chats',
              tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="ai"
            options={{
              title: 'AI',
              tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="alerts"
            options={{
              title: 'Alerts',
              tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </CallProvider>
    </OnlineStatusProvider>
  );
}

// Separate component to read startCall after hook runs and lift it up
function GlobalCallOverlay({ onStartCall }: { onStartCall: (fn: typeof dummyWebRTC['startCall']) => void; }) {
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
      // รอ connect event ก่อนค่อยส่ง socket ให้ useWebRTC เพื่อให้ listeners ลงหลัง socket พร้อม
      s.once('connect', () => setSocket(s));
    }, 500);
    return () => {
      clearTimeout(timer);
      setSocket(null);
    };
  }, [token, currentUserId]);

  // cleanup socket เมื่อ socket state เปลี่ยน (เช่น token expire แล้ว reconnect)
  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
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
