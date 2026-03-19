import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSignIn = () => {
    console.log('login with email:', email, 'and password:', password);
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='flex-1 px-8 justify-center'>
        {/* รูป logo*/}
        {/* <Image 
        source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')} 
        className='w-14 h-14 mb-6 rounded-2xl' /> */}
        {/* ข้อความ welcome back*/}
        <Text className='text-3xl font-extrabold text-[#425C95] mb-2'>Welcome Back</Text>
        <Text className='text-md text-gray-500 mb-6'>Sign in to continue to workspace</Text>
        {/* ใส่ Email*/}
        <Text className="text-sm text-gray-700 mb-2 font-medium">Email or Username</Text>
        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white">
          <TextInput className="flex-1 text-base text-gray-800" placeholder="Enter Your Email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" />
        </View>
        {/* ใส้ Password */}
        <Text className="text-sm text-gray-700 mb-2 font-medium">Password</Text>
        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-2 bg-white">
          <TextInput className="flex-1 text-base text-gray-800" placeholder="Enter your password" placeholderTextColor="#9ca3af" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-gray-500 font-medium ml-2">{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
        {/* ปุ่มลืมรหัส*/}
        <TouchableOpacity className="items-end mb-6">
            <Text className="text-[#3b82f6] text-sm font-medium">Forgot password?</Text>
        </TouchableOpacity>
        {/* ปุ่ม sign in*/}
        <TouchableOpacity className="bg-[#94a8bc] rounded-xl py-4 flex-row justify-center items-center mb-8" onPress={handleSignIn}>
            <Text className="text-white font-bold text-lg">Sign In</Text>
        </TouchableOpacity>
        {/* ตัวแบ่ง or เผื่อไป login ด้วยวิธีอื่น*/}
        <View className="flex-row items-center mb-8">
            <View className="flex-1 h-[1px] bg-gray-200" /><Text className="text-gray-400 px-4 text-sm">or</Text><View className="flex-1 h-[1px] bg-gray-200" />
        </View>
        {/* login ด้วย google     รอใส่รูป google   */}
        <TouchableOpacity className="flex-row items-center justify-center border border-gray-300 rounded-xl py-3 mb-4 bg-white">
          <Text className="text-red-500 font-bold text-lg mr-3">G</Text><Text className="text-gray-700 font-medium text-base">Continue with Google</Text>
        </TouchableOpacity>
        {/* ไปหน้าสร้าง */}
        <View className="flex-row justify-center mt-4">
          <Text className="text-gray-500">Don't have an account? </Text>
          <TouchableOpacity><Text className="text-[#3b82f6] font-bold">Register</Text></TouchableOpacity>
        </View>
          
      </View>
    </SafeAreaView>
  );
}