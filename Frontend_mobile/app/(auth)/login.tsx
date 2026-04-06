import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AntDesign } from '@expo/vector-icons';
import { Button } from '@react-navigation/elements';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  {/*const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '1086895750541-60k3q4ntds11ksnmjfvan0htdofgr4e1.apps.googleusercontent.com',
  });*/}

  const sendGoogleTokenToBackend = async (accessToken: string) => {
    try {
      const res = await fetch('http://10.0.2.2:8080/api/oauth/google/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            accessToken: accessToken 
        }),
      });
      
      const result = await res.json();
      if (res.ok) {
        console.log('Google Login Success:', result.data.user);
        router.replace({ 
            pathname: '/test-auth', 
            params: { user: JSON.stringify(result.data.user) }
        });
      } 
      else {
        console.log("Backend Error:", result);
      } 
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อกับ Backend ได้');
    };
  };

  const handleSignIn = async () => {
    console.log('SignIn with:', email);
    
    try {
      const res = await fetch('http://10.0.2.2:8080/api/auth/login', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            email: email,
            password: password
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        console.log('Login Success:', result);
        const userData = result.user || result.data?.user || result; 

        router.replace({ 
            pathname: '/test-auth',
            params: { user: JSON.stringify(userData) } 
        });
      } else {
        console.log("Backend Error:", result);
        Alert.alert('Login Failed', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อกับ Backend ได้');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center ">
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
            <Text className="text-gray-400">{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

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
        //disabled={!request}
        >
        {/* โลโก้ Google */}
          <AntDesign name="google" size={24} color="#0f0758" style={{ marginRight: 12 }} />

        {/* ข้อความปุ่ม */}
        <Text className="text-gray-700 font-medium text-base">
            Continue with Google
        </Text>
      </TouchableOpacity>
      
      <View className="flex-row items-center justify-center mt-6">
          <Text className="text-gray-700 font-medium text-base  text-left">
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