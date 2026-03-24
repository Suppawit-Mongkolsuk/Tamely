import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ใช้ตัวนี้แทน

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    console.log('SignIn with:', email);
    // router.push('/enter-code');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'red' }}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 px-8 justify-center">
            {/* Path รูปภาพที่ถูกต้องสำหรับ branch devfolk */}
            <Image 
              source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')} 
              className="w-14 h-14 mb-6" 
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
          </View>
        </SafeAreaView>
      </Text>
    </View>
  );
}