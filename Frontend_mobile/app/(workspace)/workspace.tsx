import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, RefreshControl, Alert,
  Modal, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, Plus, X, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkspaceCard from '../../components/ui/WorkspaceCard';
import DecorativeBubble from '../../components/ui/DecBubble';

interface WorkspaceData {
  id: string;
  name: string;
  iconUrl?: string | null;
  memberCount?: number;
  role?: string;
  planType?: 'Pro' | 'Enterprise' | null;
  unreadCount?: number;
}

import { API_BASE } from '@/lib/config';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default function WorkspaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [firstRoom, setFirstRoom] = useState('General');
  const [isCreating, setIsCreating] = useState(false);

  const rawToken = params.token;
  const [token, setToken] = useState(Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? ''));
  const [userStr, setUserStr] = useState('');

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then((pairs) => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v ?? '']));
      if (!token && map['token']) setToken(map['token']);
      if (map['user']) setUserStr(map['user']);
    });
  }, []);

  const handleTokenExpired = () => {
    Alert.alert(
      'Session หมดอายุ',
      'กรุณา Login ใหม่อีกครั้ง',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  };

  const fetchWorkspaces = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${API_BASE}/api/workspaces`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const raw = await response.text();
      const result = JSON.parse(raw);

      if (response.ok) {
        setWorkspaces(result.data || result);
      } else if (response.status === 401) {
        handleTokenExpired();
      } else {
        Alert.alert('Error', result.error ?? 'โหลด Workspace ไม่สำเร็จ');
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        Alert.alert('Timeout', 'เชื่อมต่อ Server นานเกินไป กรุณาลองใหม่');
      } else {
        Alert.alert('Error', 'ไม่สามารถโหลดข้อมูล Workspace ได้');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [token]);

  const closeModal = () => {
    setShowCreateModal(false);
    setWorkspaceName('');
    setDescription('');
    setFirstRoom('General');
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      Alert.alert('กรุณากรอกชื่อ Workspace');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/api/workspaces`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            name: workspaceName.trim(),
            description: description.trim(),
            firstRoom: firstRoom.trim() || 'General',
          }),
        }
      );

      const raw = await res.text();
      const result = JSON.parse(raw);

      if (res.ok) {
        closeModal();
        fetchWorkspaces();
      } else if (res.status === 401) {
        closeModal();
        handleTokenExpired();
      } else {
        Alert.alert('Error', result.error ?? 'สร้าง Workspace ไม่สำเร็จ');
      }
    } catch (err) {
      Alert.alert('Error', 'สร้าง Workspace ไม่สำเร็จ');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws: WorkspaceData) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      
      {/* ส่วน Header */}
      <LinearGradient
        colors={['#152C53', '#234476', '#42639B']}
        style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 1 }}
      >
        <DecorativeBubble size={35} top={-5} right={-8} opacity={0.12} />
        <DecorativeBubble size={20} top={5} right={10} opacity={0.07} />
        <DecorativeBubble size={45} bottom={-13} left={-10} opacity={0.08} />

        {/* โลโก้ */}
        <Image
          source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')}
          style={{ width: 200, height: 200, marginTop: -60, marginBottom: -60, marginLeft: -45 }}
          resizeMode="contain"
        />

        {/* spacer โปร่งใสกั้นไม่ให้โลโก้ทับข้อความ */}
        <View style={{ height: 0 }} />

        {/* ข้อความ */}
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 , marginTop: -20   }}>
          Choose a Workspace
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
          Select a workspace to continue or start a new one
        </Text>

        {/* ปุ่ม Logout มุมขวาบน absolute */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 33,
            right: 15,
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
          onPress={async () => {
            await AsyncStorage.clear();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
            Logout
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ส่วน Content */}
      <View className="flex-1 px-6 pt-6">

        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            className="flex-1 bg-white border-2 border-dashed border-blue-200 rounded-3xl p-6 items-center justify-center shadow-sm"
            onPress={() => router.push('/(workspace)/enter-code')}
          >
            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-3">
              <Search size={24} color="#425C95" />
            </View>
            <Text className="font-bold text-[#425C95]">Join with Code</Text>
            <Text className="text-xs text-gray-400 mt-1">Enter invite code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-green-50 border-2 border-dashed border-green-200 rounded-3xl p-6 items-center justify-center shadow-sm"
            onPress={() => setShowCreateModal(true)}
          >
            <View className="w-12 h-12 bg-green-100 rounded-2xl items-center justify-center mb-3">
              <Plus size={24} color="#16a34a" />
            </View>
            <Text className="font-bold text-green-700">New Workspace</Text>
            <Text className="text-xs text-gray-400 mt-1">Create your own</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 mb-6 border border-gray-100">
          <Search size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search workspaces..."
            className="flex-1 ml-3 text-gray-700"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#425C95" className="mt-10" />
        ) : (
          <FlatList
            data={filteredWorkspaces}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: WorkspaceData }) => (
              <WorkspaceCard
                id={item.id}
                name={item.name}
                imageUrl={item.iconUrl}
                memberCount={item.memberCount || 0}
                lastActive="Active now"
                isAdmin={item.role === 'OWNER' || item.role === 'ADMIN'}
                planType={item.planType ?? null}
                unreadCount={item.unreadCount ?? 0}
                onPress={(id: string) =>
                  router.push({
                    pathname: '/(tabs)/feed',
                    params: {
                      wsId: id,
                      token: token,
                      user: userStr,
                      role: item.role,
                    },
                  })
                }
              />
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-10">
                ยังไม่มี Workspace หรอ สร้างสิ
              </Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchWorkspaces();
                }}
              />
            }
          />
        )}
      </View>

      {/* Modal สร้าง Workspace */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={closeModal}
          />

          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 36,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>
                  สร้าง Workspace ใหม่
                </Text>
                <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                  ตั้งค่า workspace ใหม่สำหรับทีมของคุณ
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={{ padding: 4 }}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 }} />

            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                ชื่อ Workspace
              </Text>
              <TextInput
                value={workspaceName}
                onChangeText={setWorkspaceName}
                placeholder="เช่น ทีมพัฒนาผลิตภัณฑ์"
                placeholderTextColor="#d1d5db"
                autoFocus
                style={{
                  borderWidth: 1.5,
                  borderColor: workspaceName ? '#425C95' : '#e5e7eb',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#111827',
                  marginBottom: 6,
                }}
              />
              <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                ชื่อที่จะแสดงสำหรับพื้นที่ทำงานของคุณ
              </Text>

              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                คำอธิบาย (ไม่บังคับ)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="อธิบายวัตถุประสงค์ของ workspace นี้"
                placeholderTextColor="#d1d5db"
                style={{
                  borderWidth: 1.5,
                  borderColor: description ? '#425C95' : '#e5e7eb',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#111827',
                  marginBottom: 16,
                }}
              />

              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                ชื่อห้องแรก
              </Text>
              <TextInput
                value={firstRoom}
                onChangeText={setFirstRoom}
                placeholder="General"
                placeholderTextColor="#d1d5db"
                style={{
                  borderWidth: 1.5,
                  borderColor: firstRoom ? '#425C95' : '#e5e7eb',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#111827',
                  marginBottom: 6,
                }}
              />
              <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                ห้องแชทแรกที่จะสร้างใน workspace นี้
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: '#eff6ff',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 24,
                  gap: 10,
                }}
              >
                <Shield size={18} color="#425C95" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e40af', marginBottom: 4 }}>
                    คุณจะได้รับสิทธิ์ Admin อัตโนมัติ
                  </Text>
                  <Text style={{ fontSize: 12, color: '#3b82f6', lineHeight: 18 }}>
                    คุณสามารถเชิญสมาชิก สร้างห้องเพิ่มเติม และจัดการสิทธิ์ได้ภายหลัง
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    flex: 1,
                    borderWidth: 1.5,
                    borderColor: '#e5e7eb',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 15 }}>
                    ยกเลิก
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateWorkspace}
                  disabled={isCreating || !workspaceName.trim()}
                  style={{
                    flex: 2,
                    backgroundColor: workspaceName.trim() ? '#425C95' : '#d1d5db',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                      สร้าง Workspace
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}