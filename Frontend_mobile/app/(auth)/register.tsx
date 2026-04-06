import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AntDesign } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        try {
            console.log('Sending register request...');
            const response = await fetch('http://10.0.2.2:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    displayName: fullName 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Register Success:', result.data.user);
                router.replace({ 
                    pathname: '/login', 
                    params: { user: JSON.stringify(result.data.user) } 
                });
            } else {
                console.log("Backend Error:", result);
                Alert.alert("Registration Failed", result.error || result.message || JSON.stringify(result));
            }
        } catch (error) {
            console.error('API Error:', error);
            Alert.alert('Network Error', 'Please check if backend is running.');
        }
    }
    
    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{flexGrow: 1 , backgroundColor: '#ffffff' }} 
                    showsVerticalScrollIndicator={false}
                    className='px-8 py-6'
                > 
                    <View className='mb-10 mt-2'>
                        <TouchableOpacity onPress={() => router.back()} className="mb-4">
                            <Feather name="arrow-left" size={24} color="#425C95" />
                        </TouchableOpacity>
                        
                        <Text className="text-3xl font-extrabold text-[#425C95] mb-2">Create account</Text>
                        <Text className="text-md text-gray-500 leading-5">
                            Sign up to start connecting with your workspace
                        </Text>
                    </View>
                    
                    <Text className="text-sm text-gray-700 mb-2 font-medium">Full Name</Text>
                    <View className="border border-gray-300 rounded-xl px-4 py-3 mb-4">
                        <TextInput 
                            className="text-base text-gray-800"
                            placeholder="Enter your full name" 
                            value={fullName} 
                            onChangeText={setFullName}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    
                    <Text className="text-sm text-gray-700 mb-2 font-medium">Email Address</Text>
                    <View className="border border-gray-300 rounded-xl px-4 py-3 mb-4">
                        <TextInput 
                            className="text-base text-gray-800"
                            placeholder="Enter your email" 
                            value={email} 
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <Text className="text-sm text-gray-700 mb-2 font-medium">Password</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-4">
                        <TextInput 
                            className="flex-1 text-base text-gray-800"
                            placeholder="Create a password" 
                            secureTextEntry={!showPassword}
                            value={password} 
                            onChangeText={setPassword}
                            placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Text className="text-gray-500 font-medium ml-2">
                                {showPassword ? "Hide" : "Show"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    <Text className="text-sm text-gray-700 mb-2 font-medium">Confirm Password</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-6">
                        <TextInput 
                            className="flex-1 text-base text-gray-800"
                            placeholder="Confirm your password" 
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword} 
                            onChangeText={setConfirmPassword}
                            placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Text className="text-gray-500 font-medium ml-2">
                                {showConfirmPassword ? "Hide" : "Show"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                        className="bg-[#425C95] rounded-xl py-4 items-center mb-6" 
                        onPress={handleRegister}
                    >
                        <Text className="text-white font-bold text-lg">Register</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center mb-6">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="text-gray-400 px-4 text-sm">or</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    <TouchableOpacity 
                        className="flex-row items-center justify-center border border-gray-300 rounded-xl py-3 px-4 bg-white"
                        onPress={() => console.log('Start Google Register Flow')}
                    >
                        <AntDesign name="google" size={24} color="#0f0758" style={{ marginRight: 12 }} />
                        <Text className="text-gray-700 font-medium text-base">Sign up with Google</Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-8 mb-4">
                        <Text className="text-gray-500">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text className="text-[#3b82f6] font-bold">Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}