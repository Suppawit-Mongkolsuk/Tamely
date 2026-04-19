import { Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import './global.css';

const PUBLIC_SEGMENTS = ['(auth)', 'index'];

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

  // ตรวจสอบอีกครั้งเมื่อ app กลับมา foreground
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

export default function RootLayout() {
  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(workspace)" />
        <Stack.Screen name="(screensDetail)" />
      </Stack>
    </>
  );
}
