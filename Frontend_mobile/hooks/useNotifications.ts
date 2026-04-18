import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { API_BASE } from '@/lib/config';

export const NOTIF_KEYS = {
  push: 'pref_push_enabled',
  dm: 'pref_dm_enabled',
};

export const AI_KEYS = {
  autoSummarize: 'pref_ai_auto_summarize',
  smartSuggest: 'pref_ai_smart_suggest',
};

// ตรวจสอบว่ารันอยู่บน Expo Go หรือเปล่า
const isExpoGo = Constants.appOwnership === 'expo';

export function useNotifications() {
  const router = useRouter();
  const listenerRef = useRef<any>(null);
  const responseRef = useRef<any>(null);

  useEffect(() => {
    // ถ้าอยู่บน Expo Go ให้ข้ามทั้งหมด เพราะ expo-notifications ไม่รองรับ SDK 53
    if (isExpoGo) return;

    const setup = async () => {
      const Notifications = await import('expo-notifications');

      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const pushRaw = await AsyncStorage.getItem(NOTIF_KEYS.push);
          const pushEnabled = pushRaw !== 'false';

          const dmRaw = await AsyncStorage.getItem(NOTIF_KEYS.dm);
          const dmEnabled = dmRaw !== 'false';

          const data = notification.request.content.data as Record<string, string> | undefined;
          const isDm = data?.type === 'dm';

          // ถ้า push ปิดอยู่ ไม่แสดงอะไรเลย
          if (!pushEnabled) {
            return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: false };
          }

          // ถ้าเป็น DM แต่ปิด DM notification
          if (isDm && !dmEnabled) {
            return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: false };
          }

          return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true };
        },
      });

      listenerRef.current = Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Push] received:', notification.request.content);
      });

      responseRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        if (!data) return;

        if (data.type === 'dm' && data.conversationId) {
          router.push({ pathname: '/(tabs)/chat-dm' as any, params: { conversationId: data.conversationId } });
        } else if (data.type === 'room' && data.roomId) {
          router.push({ pathname: '/(tabs)/chat-room' as any, params: { roomId: data.roomId, roomName: data.roomName ?? '' } });
        } else {
          router.push('/(tabs)/alerts' as any);
        }
      });

      await registerForPushNotifications();
    };

    setup();

    return () => {
      listenerRef.current?.remove();
      responseRef.current?.remove();
    };
  }, []);
}

async function registerForPushNotifications() {
  try {
    const Notifications = await import('expo-notifications');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#425C95',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'ae72affe-d522-4a16-a802-e89e2a298334',
    });

    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) return;

    await fetch(`${API_BASE}/api/users/push-token`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ token: tokenData.data }),
    });
  } catch (err) {
    console.warn('[Push] failed to register:', err);
  }
}

export async function unregisterPushToken() {
  if (isExpoGo) return;

  try {
    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) return;

    await fetch(`${API_BASE}/api/users/push-token`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });
  } catch (err) {
    console.warn('[Push] failed to unregister:', err);
  }
}