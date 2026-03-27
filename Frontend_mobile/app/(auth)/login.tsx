import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AntDesign } from '@expo/vector-icons';
import { Button } from '@react-navigation/elements';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    console.log('SignIn with:', email);
    router.replace({ pathname: './test-auth'});
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
        onPress={() => console.log('Start Google Login Flow')}>
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