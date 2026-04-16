import { Stack } from 'expo-router';
import React from 'react';
import './global.css';
import { useNotifications } from '../hooks/useNotifications';
 
export default function RootLayout() {
  useNotifications();
 
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(workspace)" />
    </Stack>
  );
}
 