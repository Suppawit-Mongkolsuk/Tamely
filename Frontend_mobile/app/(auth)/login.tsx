import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID';
const WEB_CLIENT_ID = '1086895750541-60k3q4ntds11ksnmjfvan0htdofgr4e1.apps.googleusercontent.com';

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const accessToken = response.authentication?.accessToken;
      if (accessToken) {
        sendGoogleTokenToBackend(accessToken);
      }
    } else if (response?.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('Google Login Failed', response.error?.message ?? 'เกิดข้อผิดพลาด');
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const sendGoogleTokenToBackend = async (accessToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/oauth/google/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ accessToken }),
      });

      const raw = await res.text();
      const result = JSON.parse(raw);

      if (res.ok) {
        const token = result.data?.token ?? result.token ?? '';
        if (!token) {
          Alert.alert('Login Error', 'ไม่ได้รับ token จาก server');
          return;
        }
        router.replace({
          pathname: '/(workspace)/workspace',
          params: {
            user: JSON.stringify(result.data?.user ?? result.user ?? {}),
            token,
          },
        });
      } else {
        Alert.alert('Login Failed', result.error ?? 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อกับ Backend ได้');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('กรุณากรอกข้อมูล', 'ต้องใส่ Email และ Password');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email, password }),
      });

      const raw = await res.text();
      const result = JSON.parse(raw);

      if (res.ok) {
        const userData = result.data?.user ?? result.user ?? result;
        const token = result.data?.token ?? result.token ?? '';

        if (!token) {
          Alert.alert('Login Error', 'ไม่ได้รับ token จาก server');
          return;
        }

        router.replace({
          pathname: '/(workspace)/workspace',
          params: {
            user: JSON.stringify(userData),
            token,
          },
        });
      } else {
        Alert.alert('Login Failed', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อกับ Backend ได้');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center">

        {/* รูปโลโก้ */}
        <Image
          source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')}
          className="w-96 h-96 mb-10 mt-25 mx-auto"
        />

        <Text className="text-3xl font-extrabold text-[#425C95] mb-2">Welcome Back</Text>
        <Text className="text-md text-gray-500 mb-6">Sign in to continue to workspace</Text>

        {/* Email Input */}
        <View className="border border-gray-300 rounded-xl px-4 py-3 mb-4">
          <TextInput
            placeholder="Email or Username"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-6">
          <TextInput
            className="flex-1"
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-gray-400">{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {/* ปุ่ม Sign In */}
        <TouchableOpacity
          className="bg-[#425C95] rounded-xl py-4 items-center"
          onPress={handleSignIn}
        >
          <Text className="text-white font-bold text-lg">Sign In</Text>
        </TouchableOpacity>

        {/* ตัวแบ่ง OR */}
        <View className="flex-row items-center mb-8 mt-6">
          <View className="flex-1 h-[1px] bg-gray-200" />
          <Text className="text-gray-400 px-4 text-sm">or</Text>
          <View className="flex-1 h-[1px] bg-gray-200" />
        </View>

        {/* ปุ่ม LOGIN WITH GOOGLE */}
        <TouchableOpacity
          className="flex-row items-center justify-center border border-gray-300 rounded-xl py-3 px-4 bg-white"
          disabled={!request || googleLoading}
          onPress={() => {
            setGoogleLoading(true);
            promptAsync();
          }}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#425C95" style={{ marginRight: 12 }} />
          ) : (
            <AntDesign name="google" size={24} color="#0f0758" style={{ marginRight: 12 }} />
          )}
          <Text className="text-gray-700 font-medium text-base">
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        {/* ลิงก์ Register */}
        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-gray-700 font-medium text-base">
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-[#425C95] font-bold text-base ml-2">
              Register
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}