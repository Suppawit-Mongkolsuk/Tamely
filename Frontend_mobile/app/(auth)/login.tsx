import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_BASE } from '@/lib/config';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const logoSize = Math.min(height * 0.28, 260);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE}/api/oauth/google?mobile=1`,
        'tamely://',
      );

      if (result.type === 'success') {
        const parsed = Linking.parse(result.url);
        const token = parsed.queryParams?.token as string | undefined;

        if (!token) {
          Alert.alert('Login Error', 'ไม่ได้รับ token จาก server');
          return;
        }

        await AsyncStorage.setItem('token', token);

        const userRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        });
        const userData = await userRes.json();
        if (userRes.ok) {
          const user = userData.data ?? {};
          await AsyncStorage.setItem('user', JSON.stringify(user));
          router.replace('/(workspace)/workspace');
        } else {
          Alert.alert('Login Error', 'ไม่สามารถดึงข้อมูล user ได้');
        }
      }
    } catch {
      Alert.alert('Google Login Failed', 'เกิดข้อผิดพลาด');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let result: any;
      try {
        result = await res.json();
      } catch {
        Alert.alert('Server Error', 'Server ตอบกลับมาผิดรูปแบบ');
        return;
      }

      if (res.ok) {
        const userData = result.data?.user ?? result.user ?? result;
        const token = result.data?.token ?? result.token ?? '';

        if (!token) {
          Alert.alert('Login Error', 'ไม่ได้รับ token จาก server');
          return;
        }

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        router.replace('/(workspace)/workspace');
      } else {
        Alert.alert('Login Failed', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อกับ Backend ได้');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

        <Image
          source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')}
          style={{ width: logoSize, height: logoSize, alignSelf: 'center', marginBottom: 24 }}
          resizeMode="contain"
        />

        <Text className="text-3xl font-extrabold text-[#425C95] mb-2">Welcome Back</Text>
        <Text className="text-md text-gray-500 mb-6">Sign in to continue to workspace</Text>

        <View className="border border-gray-300 rounded-xl px-4 py-3 mb-4">
          <TextInput
            placeholder="Email or Username"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

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

        <TouchableOpacity
          className="bg-[#425C95] rounded-xl py-4 items-center"
          onPress={handleSignIn}
        >
          <Text className="text-white font-bold text-lg">Sign In</Text>
        </TouchableOpacity>

        <View className="flex-row items-center mb-8 mt-6">
          <View className="flex-1 h-[1px] bg-gray-200" />
          <Text className="text-gray-400 px-4 text-sm">or</Text>
          <View className="flex-1 h-[1px] bg-gray-200" />
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center border border-gray-300 rounded-xl py-3 px-4 bg-white"
          disabled={googleLoading}
          onPress={handleGoogleSignIn}
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

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
