import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default function EnterCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? '');

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!code.trim()) {
      Alert.alert('กรุณากรอก Invite Code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/api/workspaces/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ code: code.trim().toUpperCase() }),
        }
      );

      const raw = await res.text();
      const result = JSON.parse(raw);

      if (res.ok) {
        router.replace({
          pathname: '/(workspace)/workspace',
          params: { token },
        });
      } else {
        Alert.alert('Error', result.error ?? 'Code ไม่ถูกต้องหรือหมดอายุแล้ว');
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        Alert.alert('Timeout', 'เชื่อมต่อ Server นานเกินไป กรุณาลองใหม่');
      } else {
        Alert.alert('Error', 'ไม่สามารถเชื่อมต่อ Server ได้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-6">
        
        <View style={{ height: 60, marginTop: 24, marginBottom: 200 }}>
          <Image
            source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')}
            style={{
              position: 'absolute',
              top: -50,
              left: -30,
              width: 400,
              height: 430,
            }}
            resizeMode="contain"
          />
        </View>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1f2937', marginBottom: 8 }}>
          Join your organization
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 36 }}>
          Enter the invite code shared by your team admin
        </Text>

        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
          Invite Code
        </Text>
        <TextInput
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="TEAMLY-XXX"
          placeholderTextColor="#d1d5db"
          autoCapitalize="characters"
          autoCorrect={false}
          style={{
            borderWidth: 1.5,
            borderColor: code ? '#425C95' : '#e5e7eb',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 18,
            color: '#1f2937',
            letterSpacing: 2,
            marginBottom: 8,
          }}
        />
        <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 32, textAlign: 'center' }}>
          Example: DEMO-ENG-2024
        </Text>

        <View
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: '#f3f4f6',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 6 }}>
            Don't have an invite code?
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20 }}>
            Contact your organization admin or team lead to get an invitation code. They can generate one from the admin panel.
          </Text>
          <TouchableOpacity style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 13, color: '#425C95', fontWeight: '600' }}>
              Learn more about invitations →
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={isLoading || !code.trim()}
          style={{
            backgroundColor: code.trim() ? '#425C95' : '#d1d5db',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              Continue to Setup →
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 16 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
            By continuing, you agree to the organization's terms and policies
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}