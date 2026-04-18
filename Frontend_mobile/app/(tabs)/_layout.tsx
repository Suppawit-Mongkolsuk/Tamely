import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import InAppNotificationBanner from '../../components/ui/InAppNoti';
import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { API_BASE } from '../../lib/config';
import { CallProvider } from '../../lib/CallContext';

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
  const [startCallFn, setStartCallFn] = useState<typeof dummyWebRTC['startCall']>(() => dummyWebRTC.startCall);

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
    <CallProvider value={{ startCall: startCallFn }}>
      <View style={{ flex: 1 }}>
        <InAppNotificationBanner />
        <GlobalCallOverlay onStartCall={setStartCallFn} />
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
          <Tabs.Screen name="post-detail" options={{ href: null }} />
          <Tabs.Screen name="chat-room" options={{ href: null }} />
          <Tabs.Screen name="chat-dm" options={{ href: null }} />
          <Tabs.Screen name="profile-edit" options={{ href: null }} />
          <Tabs.Screen name="workspace-management" options={{ href: null }} />
        </Tabs>
      </View>
    </CallProvider>
  );
}

// Separate component to read startCall after hook runs and lift it up
function GlobalCallOverlay({ onStartCall }: { onStartCall: (fn: typeof dummyWebRTC['startCall']) => void }) {
  const [currentUserId, setCurrentUserId] = useState('');
  const [token, setToken] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then(([[, t], [, u]]) => {
      setToken(t ?? '');
      setCurrentUserId(u ? JSON.parse(u ?? '{}')?.id ?? '' : '');
    });
  }, []);

  useEffect(() => {
    if (!token || !currentUserId) return;
    // delay เล็กน้อยให้ ReactInstance พร้อมก่อน connect socket
    const timer = setTimeout(() => {
      const socket = io(API_BASE, {
        auth: { token },
        transports: ['websocket'],
        extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
      });
      socketRef.current = socket;
    }, 1000);
    return () => {
      clearTimeout(timer);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUserId]);

  const { callState, startCall, acceptCall, rejectCall, endCall, toggleMute, minimizeCallUI, expandCallUI } =
    useCallFeature({ socketRef, currentUserId });

  useEffect(() => {
    onStartCall(startCall);
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
